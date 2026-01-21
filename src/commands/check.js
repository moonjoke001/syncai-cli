import chalk from 'chalk';
import { checkAndPromptUpdates } from '../lib/version-checker.js';

export async function run(args) {
  const force = args.includes('--force') || args.includes('-f');
  
  console.log(chalk.cyan('\n🔍 Checking for skill and plugin updates...\n'));
  
  try {
    await checkAndPromptUpdates({ force, silent: false });
  } catch (error) {
    console.error(chalk.red('Error checking for updates:'), error.message);
    process.exit(1);
  }
}
