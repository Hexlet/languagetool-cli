import axios from 'axios';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';

const baseUrl = 'http://localhost:8010';
const extensions = ['.md', '.adoc'];
const ignoreRules = ['STYLE'];

const check = () => {
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
      });

      const url = new URL('/v2/check', baseUrl);
      const response = await axios.post(url.toString(), data, { 
        headers: {
          Accept: 'application/json',
        },
      });

      const result= response.data.matches.map((match) => `${match.message} => ${match.sentence}`); //$(echo "$body" | jq '.matches[] | "\(.message) => \(.sentence)"')
      
      console.log(`\n${fullpath}`);
      console.log(result.join('\n----\n'));
      console.log(`-------------------${fullpath} done -----------------`);
    });

    Promise.all(promises).then(() => {
      console.log('------------------DONE-----------------');
    });
  });
};

const fix = () => {
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
      
      if (!results) {
        console.log(`-------------------${fullpath} done -----------------`);
        return;
      }

      const totalResult = results.reduce((acc, match) => {
        const { offset, length: matchLength, replacements } = match;
        if (!replacements) {
          return acc;
        }

        console.log(offset, matchLength);

        const replacement = _.get(match.replacements, '[0].value', '');

        const correctTextLength = replacement.length;
        const diffLength = correctTextLength - matchLength;
        const leftPart =  acc.result.slice(0, offset + acc.currentDiffLength);
        const rightPart = acc.result.slice(offset + matchLength + acc.currentDiffLength);
        console.log('left part: ', leftPart);
        console.log('right part: ', rightPart);
        const newResult = `${leftPart}${replacement}${rightPart}`;
        const nextCurrentDiffLength = acc.currentDiffLength + diffLength;

        console.log('newResult:');
        console.log(newResult);
        return {
          result: newResult,
          currentDiffLength: nextCurrentDiffLength,
        };
      }, {
        result: content,
        currentDiffLength: 0,
      });

      fs.writeFileSync(fullpath, totalResult.result, 'utf-8');

      console.log(`\n${fullpath}`);
      console.log(`Было:
      ${content}

      ---------
      Стало:
      ${totalResult.result}
      `);
      console.log(`-------------------${fullpath} done -----------------`);
    });

    Promise.all(promises).then(() => {
      console.log('------------------DONE-----------------');
    });
  });
};

export {
  check,
  fix,
};
