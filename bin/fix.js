#!/usr/bin/env node

import { exec } from 'child_process';
import { fix } from '../src/index.js';

exec('/LanguageTool-6.3/start.sh >/dev/null 2>&1 &', () => setTimeout(fix, 5000));
