import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import {
  getPaths,
  formatMessage,
  parseCheckedResult,
} from './utils.js';

import { check } from './languageToolApi.js';


const isFiltered = (word, dictionary) => {
  if (dictionary.includes(word)) {
    return true;
  }

  if (word.includes('   ')) {
    return true;
  }

  return false;
  // for (const current in dictionary) {
  //   const regexp = new RegExp(current);

  //   if (regexp.test(word)) {
  //     return true;
  //   }
  // }

  // return false;
};

const runCheck = async (rules = []) => {
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);

  const filePaths = await getPaths();

  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');

    const fileName = fullpath.split('/').slice(2).join('/');

    const checkResult = await check(content, rules);

    const result= checkResult.matches.map((match) => {
      const { offset, length, replacements } = match;
      const leftPart =  content.slice(0, offset);
      const lineCount = leftPart.split('\n').length;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word, filterWords)) {
        return null;
      }

      const resultText = [
        `${fileName}#${lineCount}`,
        `${match.message} в слове "${word}" => ${match.sentence}`,
        formatMessage('Предлагаемые варианты:'),
        replacements.map((replacement) => replacement.value).join('\n--\n'),
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
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);

  const filePaths = await getPaths();

  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');

    const data = await check(content, rules);

    const result= data.matches.map((match) => {
      const { offset, length } = match;
      const word = content.slice(offset, offset + length);

      if (isFiltered(word, filterWords)) {
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

const fix = async (rules = []) => {
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);

  const filePaths = await getPaths();
  const promises = filePaths.map(async (fullpath) => {
    const content = fs.readFileSync(fullpath, 'utf-8');

    const checkResults = await check(content, rules);

    const results = checkResults.matches; //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
    const fileName = fullpath.split('/').slice(2).join('/');
    
    if (!results) {
      console.log(`-------------------${fileName} done -----------------`);
      return;
    }

    const totalResult = results.reduce((acc, match) => {

      const parsed = parseCheckedResult(match, acc.result, acc.currentDiffLength);

      if (!parsed || (parsed.incorrectWord && isFiltered(parsed.incorrectWord, filterWords))) {
        return acc;
      }

      return {
        result: parsed.result,
        currentDiffLength: parsed.currentDiffLength,
      };
    }, { result: content, currentDiffLength: 0 });

    fs.writeFileSync(fullpath, totalResult.result, 'utf-8');

    printFixResult(content, totalResult.result, fileName);
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
