#!/usr/bin/env node

import { exec } from 'child_process';
import { getWrongWords } from '../src/index.js';

exec('sh /LanguageTool-6.3/start.sh >/dev/null 2>&1 &', () => setTimeout(async () => {
  const rules = process.argv.slice(2);
  getWrongWords(rules);
}, 5000));
