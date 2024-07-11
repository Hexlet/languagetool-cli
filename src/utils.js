// @ts-check

import fs from 'node:fs';
import clc from 'cli-color';
import _ from 'lodash';
import { glob } from 'glob';

export const formatMessage = (msg, color) => {
  if (!color) {
    return msg;
  }
  if (!clc[color]) {
    return clc.white(msg);
  }
  return clc[color](msg);
};

export const formatError = (err) => clc.red(err);

export const getFilePaths = async (dirPath) => {
  const filePaths = await glob(dirPath);
  return filePaths;
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

export const getIgnoredWordsInWorkspace = (path) => {
  if (!fs.existsSync(path)) {
    return [];
  }

  const content = fs.readFileSync(path, 'utf-8');
  const parsed = JSON.parse(content);

  return parsed['languageToolLinter.languageTool.ignoredWordsInWorkspace'] || [];
};

export const getLanguageToolVersion = '6.4';
