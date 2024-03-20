import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const baseUrl = 'http://localhost:8010';
const extensions = ['.md', '.adoc'];
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

const check = () => {
  const dirpath = '/content';

  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = fileNames.filter((filename) => extensions.includes(path.extname(filename).toLowerCase()));

    const promises = filePaths.map(async (filepath) => {
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath, 'utf-8');

      const fileName = fullpath.split('/').slice(2).join('/');

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: 'false',
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

        const resultText = [
          `${fileName}#${lineCount}`,
          `${match.message} в слове "${word}" => ${match.sentence}`,
          'Предлагаемые варианты:',
          replacements.map((replacement) => replacement.value).join('\n--\n'),
        ];

        return resultText.join('\n');
      });

      console.log(result.join('\n----------------------\n'));
      console.log(`-------------------${fileName} done -----------------`);
    });

    Promise.all(promises).then(() => {
      console.log('------------------DONE-----------------');
    });
  });
};

const fix = () => {
  const filterWordsContent = fs.readFileSync('ignore_dictionary.txt', 'utf-8');
  const filterWords = filterWordsContent.split(/\n/);
  const dirpath = '/content';
  fs.readdir(dirpath, { recursive: true }, (_err, fileNames) => {

    const filePaths = fileNames.filter((filename) => extensions.includes(path.extname(filename).toLowerCase()));

    const promises = filePaths.map(async (filepath) => {
      const fullpath = path.join(dirpath, filepath);
      const content = fs.readFileSync(fullpath, 'utf-8');

      const data = new URLSearchParams({
        text: content,
        language: 'ru-RU',
        enabledOnly: 'false',
        disabledCategories: ignoreRules.join(','),
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, { 
        headers: {
          Accept: 'application/json',
        },
      });

      const results = response.data.matches; //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
      const fileName = fullpath.split('/').slice(1).join('/');
      
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
        const incorrectWordStartIndex = offset + matchLength + acc.currentDiffLength;
        const incorrectWordEndIndex = offset + acc.currentDiffLength;

        const leftPart =  acc.result.slice(0, incorrectWordEndIndex);
        const rightPart = acc.result.slice(incorrectWordStartIndex);

        const incorrectWord = acc.result.slice(incorrectWordStartIndex, incorrectWordEndIndex).trim();

        // console.log(incorrectWordStartIndex, incorrectWordEndIndex)
        // console.log('result: ', acc.result);
        // console.log('incorrectWord: ', incorrectWord);

        if (incorrectWord && filterWords.includes(incorrectWord)) {
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
  addWords,
};
