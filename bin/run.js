#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'node:fs';
import { getErrors, formatErrors, getWrongWords, fix, filterIgnoredErrors, writeIgnoreErrorsFile } from '../src/index.js';
import { getLanguageToolVersion } from '../src/utils.js';
import { Command } from 'commander';
const program = new Command();

const serverStartCommand = `sh /LanguageTool-${getLanguageToolVersion}/start.sh >/dev/null 2>&1 &`;

program
  .command('check')
  .description('Fix errors with overwriting files')
  .argument('[dir_path]', 'path to files', '/content')
  .option('-r, --rules "rule1, rule2, ..."', 'languagetools rules', '')
  .option('-l, --language <Ru-ru>', 'A language code like en-US, de-DE, fr, or auto to guess the language automatically', 'auto')
  .option('-i, --ignore <file_path>', 'Path to file with ignore rules', '/content/ignore')
  .action((dirPath, options) => {
    exec(serverStartCommand, () => setTimeout(async () => {
      const rules = options.rules.split(',').map((item) => item.trim()).filter((item) => item);
      const language = options.language;
      const ignorePath = options.ignore;

      const errors = await getErrors(dirPath, language, rules);
      const filtered = filterIgnoredErrors(errors, ignorePath);
      if (filtered) {
        const formattedErrors = formatErrors(errors);
        console.log(formattedErrors.join('\n------------------------\n'));
        process.exit(1);
      }
    }, 5000));    
  });

program
  .command('fix')
  .description('Check errors')
  .argument('[dir_path]', 'path to files', '/content')
  .option('-r, --rules "rule1, rule2, ..."', 'languagetools rules', '')
  .option('-l, --language <Ru-ru>', 'A language code like en-US, de-DE, fr, or auto to guess the language automatically', 'auto')
  .option('-i, --ignore <file_path>', 'Path to file with ignore rules', '/content/ignore')
  .action((dirPath = '/content', options) => {
    exec(serverStartCommand, () => setTimeout(async () => {
      const rules = options.rules.split(',').map((item) => item.trim()).filter((item) => item);
      const language = options.language;
      fix(dirPath, language, rules).then(() => {
        console.log('------------------DONE-----------------');
      });
    }, 5000));    
  });

program
  .command('words')
  .description('Get errors to a file')
  .argument('[dir_path]', 'path to files', '/content')
  .option('-r, --rules "rule1, rule2, ..."', 'languagetools rules', '')
  .option('-l, --language <Ru-ru>', 'A language code like en-US, de-DE, fr, or auto to guess the language automatically', 'auto')
  .option('-f, --file <wrong_words.txt>', 'Destination', '/content/wrong_words.txt')
  .action((dirPath = '/content', options) => {
    exec(serverStartCommand, () => setTimeout(async () => {
      const rules = options.rules.split(',').map((item) => item.trim()).filter((item) => item);
      const language = options.language;
      const words = await getWrongWords(dirPath, language, rules);
      fs.writeFileSync(options.file, words.join('\n'), 'utf-8');
    }, 5000));    
  });

program
  .command('ignore')
  .argument('[dir_path]', 'path to files', '/content')
  .argument('[file_path]', 'path for ignore file', '/content/ignore')
  .option('-r, --rules "rule1, rule2, ..."', 'languagetools rules', '')
  .option('-l, --language <Ru-ru>', 'A language code like en-US, de-DE, fr, or auto to guess the language automatically', 'auto')
  .option('-f, --file <wrong_words.txt>', 'Destination', '/content/wrong_words.txt')
  .action((dirPath = '/content', filePath, options) => {
    exec(serverStartCommand, () => setTimeout(async () => {
      const rules = options.rules.split(',').map((item) => item.trim()).filter((item) => item);
      const language = options.language;

      const errors = await getErrors(dirPath, language, rules);
      fs.writeFileSync(filePath, words.join('\n'), 'utf-8');
    }, 5000));    
  });

program
  .parse(process.argv);
