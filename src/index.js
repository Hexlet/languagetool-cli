import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown'

import {
  getFilePaths,
  formatMessage,
  parseCheckedResult,
  printFixResult,
} from './utils.js';

import { check } from './languageToolApi.js';
import Checker from './markdownParser.js';

const filterBlocks = [
  'code',
  'inlineCode',
];

const errorDelimeter = '\n------------------------\n';

const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
const filterWords = filterWordsContent.split(/\n/).map((word) => word.toLowerCase());

const isFiltered = (word) => {
  if (filterWords.includes(word.toLowerCase())) {
    return true;
  }

  if (word.includes('   ')) {
    return true;
  }

  return false;
};

const getWrongWords = async (dirPath, language, rules = []) => {

  const filePaths = await getFilePaths(dirPath);

  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');

    const data = await check(content, language, rules);

    const result= data.matches.map((match) => {
      const { offset, length } = match;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word)) {
        return '';
      }

      return word.trim();
    });

    return result.filter((item) => item).join('\n');
  });

  return Promise.all(promises).then((words) => {
    return words.map((w) => w.trim()).filter((w) => w);
  });
};

const checkContent = async (content, language, rules) => {
  const checkResults = await check(content, language, rules);

  const results = checkResults.matches;
  
  if (!results) {
    return '';
  }

  const totalResult = results.reduce((acc, match) => {

    const parsed = parseCheckedResult(match, acc.result, acc.currentDiffLength);

    if (!parsed || (parsed.incorrectWord && isFiltered(parsed.incorrectWord))) {
      return acc;
    }

    return {
      result: parsed.result,
      currentDiffLength: parsed.currentDiffLength,
    };
  }, { result: content, currentDiffLength: 0 });

  return totalResult.result;
};

const checkTree = (source, language, rules) => {
  const iter = async (tree) => {
    if (filterBlocks.includes(tree.type)) {
      return tree;
    }

    try {
      const newValue = await checkContent(tree.value, language, rules);

      tree.value = newValue;
    } catch(e) {
      console.error(tree.value);
    }

    if (tree.children) {
      tree.children = await Promise.all(tree.children.map(iter));
    }
    return tree;
  };

  return iter(source);
}

const fix = async (dirPath, language, rules = []) => {
  const filePaths = await getFilePaths(dirPath);
  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');
    const fileName = fullpath.split('/').slice(2).join('/');

    const parsedContent = fromMarkdown(content);

    const fixedContent = await checkTree(parsedContent, language, rules);

    const finalResult = toMarkdown(fixedContent, {
      emphasis: '_',
    });

    fs.writeFileSync(fullpath, finalResult, 'utf-8');

    printFixResult(content, finalResult, fileName);
  });

  return Promise.all(promises);
};

const getErrors = async (dirPath, language, rules = []) => {
  const filePaths = await getFilePaths(dirPath);

  const promises = filePaths.map(async (fullpath) => {
    const sourceContent = fs.readFileSync(fullpath, 'utf-8');

    const fileName = fullpath.split('/').slice(2).join('/');

    const parser = new Checker(rules);

    const content = parser.filterContent(sourceContent);

    const checkResult = await check(content, language, rules);

    const resultCheckFile = checkResult.matches.map((match) => {
      const { offset, length, replacements } = match;
      const leftPart =  content.slice(0, offset);
      const lineNumber = leftPart.split('\n').length;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word)) {
        return null;
      }

      const result = {
        fileName,
        lineNumber,
        match,
        replacements
      };

      return result;
    });

    return resultCheckFile;
  });

  return Promise.all(promises).then((results) => results.flat().filter((item) => item));
};

const formatContextMessage = (context, offset, length) => {
  const leftPart = context.slice(0, offset);
  const errorPart = context.slice(offset, offset + length);
  const rightPart =  context.slice(offset + length);
  
  const formattedErrorPath = formatMessage(errorPart, 'red');

  const result = `${leftPart}${formattedErrorPath}${rightPart}`;
  
  return result;
}

const getLineError = (error) => {
  const {
    fileName,
    lineNumber,
    match,
  } = error;

  const lineError = `${fileName}#${lineNumber}#${match.context.offset}#${match.context.length}`;

  return lineError;
};

const formatError = (error) => {
  const {
    match,
    replacements,
  } = error;

  const fileLineMessage = formatMessage(getLineError(error), 'blue');
  const contextMessage = formatContextMessage(match.context.text, match.context.offset, match.context.length);

  const errorMessage = formatMessage(match.message, 'red');

  const formattedReplacements = replacements.map((replacement) => formatMessage(replacement.value, 'green')).join(', ');

  const replacementsMessage = `${formatMessage('Предлагаемые варианты:\n', 'blue')}${formattedReplacements}`;

  const result = [
    fileLineMessage,
    contextMessage,
    errorMessage,
    formattedReplacements ? replacementsMessage : null,
  ].filter((item) => item !== null).join('\n');

  return result;
};

const formatErrors = (errors) => errors.map(formatError);

const filterIgnoredErrors = (formatedErrors, ignoreFilePath) => {
  if (!fs.existsSync(ignoreFilePath)) {
    return formatedErrors;
  }

  const ignoreContent = fs.readFileSync(ignoreFilePath, 'utf-8');
  const ignore = ignoreContent.split(errorDelimeter);

  const result = formatedErrors.filter((error) => !ignore.includes(error));

  return result;
};

const writeIgnoreErrorsFile = (formatedErrors, ignoreFilePath) => {
  const result = formatedErrors.join(errorDelimeter);

  fs.writeFileSync(ignoreFilePath, result, 'utf-8');
};

export {
  fix,
  getWrongWords,
  getErrors,
  formatErrors,
  filterIgnoredErrors,
  writeIgnoreErrorsFile,
  errorDelimeter,
};
