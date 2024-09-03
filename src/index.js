import fs from 'node:fs';
import path from 'node:path';
import _ from 'lodash';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown'
import MyStem from 'mystem3';

import {
  getFilePaths,
  formatMessage,
  parseCheckedResult,
  printFixResult,
  getIgnoredWordsInWorkspace,
} from './utils.js';

import { check } from './languageToolApi.js';
import Checker from './markdownParser.js';

const filterBlocks = [
  'code',
  'inlineCode',
];

const errorDelimeter = '\n------------------------\n';

// Initialize mystem
const mystem = new MyStem();
mystem.start();

// Function to lemmatize a word using mystem3
const lemmatizeWord = async (word) => {
  try {
    const lemma = await mystem.lemmatize(word);
    return lemma.toLowerCase();
  } catch (error) {
    console.error(`Error lemmatizing word "${word}":`, error);
    return word.toLowerCase(); // Return the original word if lemmatization fails
  }
};

// Lemmatize all words in the dictionary
const lemmatizeDictionary = async (dictionary) => {
  const lemmatizedDictionary = new Set();
  for (const word of dictionary) {
    const lemma = await lemmatizeWord(word);
    lemmatizedDictionary.add(lemma);
  }
  return lemmatizedDictionary;
};

// Read and lemmatize the filter words
const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
const filterWords = filterWordsContent.split(/\n/).map((word) => word.toLowerCase());
let lemmatizedFilterWords;

// Function to initialize lemmatized filter words
const initLemmatizedFilterWords = async () => {
  lemmatizedFilterWords = await lemmatizeDictionary(filterWords);
};

const isFiltered = async (word, additionalWords = []) => {
  const lemma = await lemmatizeWord(word);

  const lemmatizedAdditionalWords = await lemmatizeDictionary(additionalWords);

  if (lemmatizedFilterWords.has(lemma) || lemmatizedAdditionalWords.has(lemma)) {
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

    const result = await Promise.all(data.matches.map(async (match) => {
      const { offset, length } = match;
      const word = content.slice(offset, offset + length);

      if (await isFiltered(word)) {
        return '';
      }

      return word.trim();
    }));

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

  const totalResult = await results.reduce(async (accPromise, match) => {
    const acc = await accPromise;

    const parsed = parseCheckedResult(match, acc.result, acc.currentDiffLength);

    if (!parsed || (parsed.incorrectWord && await isFiltered(parsed.incorrectWord))) {
      return acc;
    }

    return {
      result: parsed.result,
      currentDiffLength: parsed.currentDiffLength,
    };
  }, Promise.resolve({ result: content, currentDiffLength: 0 }));

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

  const wrongWords = getIgnoredWordsInWorkspace('/content/.vscode/settings.json');

  const promises = filePaths.map(async (fullpath) => {
    const sourceContent = fs.readFileSync(fullpath, 'utf-8');

    const fileName = fullpath.split('/').slice(2).join('/');

    const parser = new Checker(rules);

    const content = parser.filterContent(sourceContent, filterBlocks);

    const checkResult = await check(content, language, rules);

    const resultCheckFile = await Promise.all(checkResult.matches.map(async (match) => {
      const { offset, length, replacements } = match;
      const leftPart =  content.slice(0, offset);
      const lineNumber = leftPart.split('\n').length;
      const word = content.slice(offset, offset + length);

      if (await isFiltered(word, wrongWords)) {
        return null;
      }

      const result = {
        fileName,
        lineNumber,
        match,
        replacements
      };

      return result;
    }));

    return resultCheckFile.filter(item => item !== null);
  });

  return Promise.all(promises).then((results) => results.flat());
};

const formatContextMessage = (context, offset, length, isColored) => {
  const leftPart = context.slice(0, offset);
  const errorPart = context.slice(offset, offset + length);
  const rightPart =  context.slice(offset + length);

  const formattedErrorPath = formatMessage(errorPart, isColored && 'red');

  const result = `${leftPart}${formattedErrorPath}${rightPart}`;

  return result;
}

const getLineError = (error) => {
  const {
    fileName,
    lineNumber,
    match,
  } = error;

  const lineError = [fileName, lineNumber, match.context.offset, match.context.length].join(':');

  return lineError;
};

const formatError = (error, isColored) => {
  const {
    match,
    replacements,
  } = error;

  const fileLineMessage = formatMessage(getLineError(error), isColored && 'blue');
  const contextMessage = formatContextMessage(match.context.text, match.context.offset, match.context.length, isColored);

  const errorMessage = formatMessage(match.message, isColored && 'red');

  const formattedReplacements = replacements.map((replacement) => formatMessage(replacement.value, isColored && 'green')).join(', ');

  const replacementsMessage = `${formatMessage('Предлагаемые варианты:\n', isColored && 'blue')}${formattedReplacements}`;

  const result = [
    fileLineMessage,
    contextMessage,
    errorMessage,
    formattedReplacements ? replacementsMessage : null,
  ].filter((item) => item !== null).join('\n');

  return result;
};

const formatErrors = (errors, isColored = false) => errors.map((error) => formatError(error, isColored));

const filterIgnoredErrors = (errors, ignoreFilePath) => {
  if (!fs.existsSync(ignoreFilePath)) {
    return errors;
  }

  const ignoreContent = fs.readFileSync(ignoreFilePath, 'utf-8');
  const ignore = ignoreContent.split(errorDelimeter);

  const result = errors.filter((error) => {
    const formatedError = formatError(error);
    return !ignore.includes(formatedError);
  });

  return result;
};

const writeIgnoreErrorsFile = (errors, ignoreFilePath) => {
  const formatedErrors = formatErrors(errors);
  const result = formatedErrors.join(errorDelimeter);

  fs.appendFileSync(ignoreFilePath, `${result}${errorDelimeter}`, 'utf-8');
};

// Initialize lemmatized filter words before running any checks
const init = async () => {
  await initLemmatizedFilterWords();
  console.log('Lemmatized filter words initialized.');
};

// Main function to run the spell-check
const main = async () => {
  await init();

  // Your main logic here, e.g.:
  const errors = await getErrors('/content/content.md', 'ru', []);
  console.log(formatErrors(errors, true));
};

main().catch(console.error).finally(() => {
  mystem.stop();
  console.log('Mystem stopped.');
});

export {
  fix,
  getWrongWords,
  getErrors,
  formatErrors,
  filterIgnoredErrors,
  writeIgnoreErrorsFile,
  errorDelimeter,
};
