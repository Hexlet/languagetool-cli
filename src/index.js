import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const baseUrl = 'http://localhost:8010';
const ignoreRules = ['STYLE'];

const addWords = () => {
  const content = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const words = content.split(/\s/);

  const url = new URL('/v2/add', baseUrl);

  const promises = words.map((word) => {
    const data = new URLSearchParams({
      word,
    });
    return axios.post(url, data);
  });

  return Promise.all(promises).then(() => console.log('Dictionary added'));
};

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

const prepareTextFilepaths = (filePaths) => {
  const textFilesExtensions = ['.md', '.adoc'];
  return filePaths.filter((filename) => textFilesExtensions.includes(path.extname(filename).toLowerCase()))
};

const check = (rules = []) => {
  const dirpath = '/content';
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);

  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = prepareTextFilepaths(fileNames);

    const promises = filePaths.map(async (filepath) => {
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath, 'utf-8');

      const fileName = fullpath.split('/').slice(2).join('/');

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: rules.length > 0,
        enabledRules: rules.join(','),
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, {
        headers: {
          Accept: 'application/json',
        },
      });

      const result= response.data.matches.map((match) => {
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
          'Предлагаемые варианты:',
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
  });
};

const getWrongWords = (rules = []) => {
  const dirpath = '/content';
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);

  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = prepareTextFilepaths(fileNames);

    const promises = filePaths.map(async (filepath) => {
      console.log(`start processing: ${filepath}`);
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath, 'utf-8');

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: rules.length > 0,
        enabledRules: rules.join(','),
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, {
        headers: {
          Accept: 'application/json',
        },
      });

      const result= response.data.matches.map((match) => {
        const { offset, length, replacements } = match;
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
  });
};

const fix = (rules = []) => {
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);
  const dirpath = '/content';
  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = prepareTextFilepaths(fileNames);

    const promises = filePaths.map(async (filepath) => {
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath, 'utf-8');

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: rules.length > 0,
        enabledRules: rules.join(','),
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, {
        headers: {
          Accept: 'application/json',
        },
      });

      const results = response.data.matches; //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
      const fileName = fullpath.split('/').slice(2).join('/');

      if (!results) {
        console.log(`-------------------${fileName} done -----------------`);
        return;
      }

      const totalResult = results.reduce((acc, match) => {
        const { offset, length: matchLength, replacements } = match;
        if (!replacements) {
          return acc;
        }

        const replacement = _.get(match.replacements, '[0].value', '');

        const correctTextLength = replacement.length;
        const diffLength = correctTextLength - matchLength;

        const incorrectWordStartIndex = offset + acc.currentDiffLength;
        const incorrectWordEndIndex = incorrectWordStartIndex + matchLength;

        const leftPart =  acc.result.slice(0, incorrectWordStartIndex);
        const rightPart = acc.result.slice(incorrectWordEndIndex);

        const incorrectWord = acc.result.slice(incorrectWordStartIndex, incorrectWordEndIndex).trim();

        if (incorrectWord && isFiltered(incorrectWord, filterWords)) {
          return acc;
        }

        const newResult = `${leftPart}${replacement}${rightPart}`;
        const nextCurrentDiffLength = acc.currentDiffLength + diffLength;

        return {
          result: newResult,
          currentDiffLength: nextCurrentDiffLength,
        };
      }, {
        result: content,
        currentDiffLength: 0,
      });

      fs.writeFileSync(fullpath, totalResult.result, 'utf-8');

      console.log(`\n${fileName}`);
      console.log(`Было:
      ${content}

      ---------
      Стало:
      ${totalResult.result}
      `);
      console.log(`-------------------${fileName} done -----------------`);
    });

    Promise.all(promises).then(() => {
      console.log('------------------DONE-----------------');
    });
  });
};

export {
  check,
  fix,
  getWrongWords,
};
