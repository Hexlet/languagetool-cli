import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toMarkdown } from 'mdast-util-to-markdown'

import {
  getPaths,
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

const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
const filterWords = filterWordsContent.split(/\n/);

const isFiltered = (word) => {
  if (filterWords.includes(word)) {
    return true;
  }

  if (word.includes('   ')) {
    return true;
  }

  return false;
};

const runCheck = async (rules = []) => {

  const filePaths = await getPaths();

  const promises = filePaths.map(async (fullpath) => {
    const sourceContent = fs.readFileSync(fullpath, 'utf-8');

    const fileName = fullpath.split('/').slice(2).join('/');

    const parser = new Checker(rules);

    const content = parser.filterContent(sourceContent);

    const checkResult = await check(content, rules);

    const result= checkResult.matches.map((match) => {
      const { offset, length, replacements } = match;
      const leftPart =  content.slice(0, offset);
      const lineCount = leftPart.split('\n').length;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word)) {
        return null;
      }

      const resultText = [
        formatMessage(`${fileName}#${lineCount}`, 'blue'),
        formatMessage(`${match.message} в слове "${word}" => ${match.sentence}`, 'red'),
        formatMessage('Предлагаемые варианты:', 'blue'),
        formatMessage(replacements.map((replacement) => replacement.value).join('\n--\n'), 'green'),
      ];

      return resultText.join('\n');
    });

    console.log(result.filter((item) => item).join('\n----------------------\n'));
    console.log(`-------------------${fileName} done -----------------`);
  });

  Promise.all(promises).then(() => {
    console.log('------------------DONE-----------------');
  });
};

const getWrongWords = async (rules = []) => {

  const filePaths = await getPaths();

  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');

    const data = await check(content, rules);

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

  Promise.all(promises).then((words) => {
    fs.writeFileSync(path.join(dirpath, 'wrong_words.txt'), words.map((w) => w.trim()).filter((w) => w).join('\n'), 'utf-8');
  });
};

const checkContent = async (content, rules) => {

  const checkResults = await check(content, rules);

  const results = checkResults.matches; //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
  // const fileName = fullpath.split('/').slice(2).join('/');
  
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

const checkTree = (source, rules) => {
  const iter = async (tree) => {
    if (filterBlocks.includes(tree.type)) {
      return Promise.resolve();
    }

    tree.value = await checkContent(tree.value, rules);

    if (tree.children) {
      return Promise.all(tree.children.map(iter));
    }
    return Promise.resolve();
  };

  return iter(source);
}

const fix = async (rules = []) => {
  const filePaths = await getPaths();
  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');
    const fileName = fullpath.split('/').slice(2).join('/');

    const parsedContent = fromMarkdown(content);

    checkTree(parsedContent, rules);

    const finalResult = toMarkdown(parsedContent, {
      emphasis: '_',
    });

    fs.writeFileSync(fullpath, finalResult, 'utf-8');

    printFixResult(content, finalResult, fileName);
  });

  Promise.all(promises).then(() => {
    console.log('------------------DONE-----------------');
  });
};

export {
  runCheck,
  fix,
  getWrongWords,
};
