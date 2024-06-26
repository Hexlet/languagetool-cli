// @ts-check

import clc from 'cli-color';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';

const defaultExtensions = ['.md'];

export const formatMessage = (msg, color = 'dark') => {
  if (!clc[color]) {
    return clc.white(msg);
  }
  return clc[color](msg);
};

export const formatError = (err) => clc.red(err);

export const getFilePaths = async (dirpath, extensions = defaultExtensions) => {
  const fileNames = await fs.readdir(dirpath, { recursive: true });
  
  const filePaths = fileNames.filter((filename) => extensions.includes(path.extname(filename).toLowerCase()));

  return filePaths.map((filePath) => {
    const fullpath = path.join(dirpath, filePath);
    return fullpath;
  });
};

export const parseCheckedResult = (match, currentResult, currentDiffLength) => {
  const { offset, length: matchLength, replacements } = match;
  if (!replacements) {
    return null;
  }
  const replacement = _.get(match.replacements, '[0].value', '');

  const correctTextLength = replacement.length;
  const diffLength = correctTextLength - matchLength;

  const incorrectWordStartIndex = offset + currentDiffLength;
  const incorrectWordEndIndex = incorrectWordStartIndex + matchLength;

  const leftPart =  currentResult.slice(0, incorrectWordStartIndex);
  const rightPart = currentResult.slice(incorrectWordEndIndex);

  const incorrectWord = currentResult.slice(incorrectWordStartIndex, incorrectWordEndIndex).trim();

  const newResult = `${leftPart}${replacement}${rightPart}`;
  const nextCurrentDiffLength = currentDiffLength + diffLength;

  return {
    result: newResult,
    currentDiffLength: nextCurrentDiffLength,
    incorrectWord,
  };
};

export const printFixResult = (previousContent, currentContent, fileName) => {
  console.log(`\n${fileName}`);
  console.log('Было:');
  console.log(formatMessage(previousContent, 'red'));
  console.log('---------');
  console.log('Стало:');
  console.log(formatMessage(currentContent, 'green'));
  console.log(`-------------------${fileName} done -----------------`);
};

export const getLanguageToolVersion = '6.4';
