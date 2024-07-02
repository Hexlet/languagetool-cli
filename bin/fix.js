#!/usr/bin/env node

import { exec } from 'child_process';
import { fix } from '../src/index.js';

exec('sh /LanguageTool-6.3/start.sh >/dev/null 2>&1 &', () => setTimeout(() => {
  const rules = process.argv.slice(2);
  fix(rules).then(() => {
    console.log('------------------DONE-----------------');
  });
}, 5000));
