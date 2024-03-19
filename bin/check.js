#!/usr/bin/env node

import { exec } from 'child_process';
import { check, addWords } from '../src/index.js';

exec('/LanguageTool-6.3/start.sh >/dev/null 2>&1 &', () => setTimeout(async () => {
  check();
}, 5000));
