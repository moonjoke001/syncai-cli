#!/usr/bin/env node
import { run } from '../commands/migrate.js';
run(process.argv.slice(2));
