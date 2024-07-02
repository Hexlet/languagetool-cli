#!/usr/bin/env node

import { exec } from 'child_process';
import { getErrors, formatErrors } from '../src/index.js';
import { getLanguageToolVersion } from '../src/utils.js';

exec(`sh /LanguageTool-${getLanguageToolVersion}/start.sh >/dev/null 2>&1 &`, () => setTimeout(async () => {
  const rules = process.argv.slice(2);
  const errors = await getErrors('/content', rules);
  if (errors) {
    const formattedErrors = formatErrors(errors);
    console.log(formattedErrors.join('\n------------------------'));
    process.exit(1);
  }
}, 5000));
