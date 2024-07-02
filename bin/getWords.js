#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'node:fs';
import { getWrongWords } from '../src/index.js';
import { getLanguageToolVersion } from '../src/utils.js';

exec(`sh /LanguageTool-${getLanguageToolVersion}/start.sh >/dev/null 2>&1 &`, () => setTimeout(async () => {
  const rules = process.argv.slice(2);
  const words = await getWrongWords('/content', rules);
  fs.writeFileSync('/content/wrong_words.txt', words.join('\n'), 'utf-8');
}, 5000));
