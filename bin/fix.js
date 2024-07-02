#!/usr/bin/env node

import { exec } from 'child_process';
import { fix } from '../src/index.js';
import { getLanguageToolVersion } from '../src/utils.js';

exec(`sh /LanguageTool-${getLanguageToolVersion}/start.sh >/dev/null 2>&1 &`, () => setTimeout(() => {
  const rules = process.argv.slice(2);
  fix('/content', rules).then(() => {
    console.log('------------------DONE-----------------');
  });
}, 5000));
