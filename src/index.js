#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { run as runInit } from './commands/init.js';
import { run as runDetect } from './commands/detect.js';
import { run as runScan } from './commands/scan.js';
import { run as runPull } from './commands/pull.js';
import { run as runPush } from './commands/push.js';
import { run as runStatus } from './commands/status.js';
import { run as runDiff } from './commands/diff.js';
import { run as runConfig } from './commands/config.js';
import { run as runAuth } from './commands/auth.js';
import { run as runBackup } from './commands/backup.js';
import { run as runHistory } from './commands/history.js';
import { run as runRollback } from './commands/rollback.js';
import { run as runPlugin } from './commands/plugin.js';
import { run as runHelp } from './commands/help.js';
import { checkAndPromptUpdates } from './lib/version-checker.js';

const program = new Command();

program
  .name('syncai')
  .description('Sync AI tool configurations across OpenCode, Kiro CLI, Gemini CLI, Claude Code and more')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize SyncAI with GitHub authentication')
  .option('-f, --force', 'Force reinitialize even if already configured')
  .action(async (options) => {
    await runInit(['init', ...(options.force ? ['--force'] : [])]);
  });

program
  .command('detect')
  .description('Detect which AI tool is currently running')
  .option('-v, --verbose', 'Show detailed detection info')
  .action(async (options) => {
    await runDetect(['detect', ...(options.verbose ? ['--verbose'] : [])]);
  });

program
  .command('scan')
  .description('Scan for installed AI tools')
  .option('-v, --verbose', 'Show detailed scan results')
  .action(async (options) => {
    await runScan(['scan', ...(options.verbose ? ['--verbose'] : [])]);
  });

program
  .command('pull')
  .description('Pull configurations from cloud')
  .option('-a, --all', 'Pull for all installed tools')
  .option('-o, --only <tools>', 'Pull only specified tools (comma-separated)')
  .option('-n, --no-backup', 'Skip backup before pulling')
  .option('--dry-run', 'Show what would be pulled without making changes')
  .action(async (options) => {
    const args = ['pull'];
    if (options.all) args.push('--all');
    if (options.only) args.push('--only', options.only);
    if (options.backup === false) args.push('--no-backup');
    if (options.dryRun) args.push('--dry-run');
    await runPull(args);
  });

program
  .command('push')
  .description('Push configurations to cloud')
  .option('-a, --all', 'Push for all installed tools')
  .option('-o, --only <tools>', 'Push only specified tools (comma-separated)')
  .option('-f, --force', 'Force push even with sensitive content warnings')
  .option('-m, --message <msg>', 'Commit message')
  .option('--dry-run', 'Show what would be pushed without making changes')
  .action(async (options) => {
    const args = ['push'];
    if (options.all) args.push('--all');
    if (options.only) args.push('--only', options.only);
    if (options.force) args.push('--force');
    if (options.message) args.push('--message', options.message);
    if (options.dryRun) args.push('--dry-run');
    await runPush(args);
  });

program
  .command('status')
  .alias('st')
  .description('Show sync status')
  .option('-a, --all', 'Show status for all tools')
  .option('-o, --only <tools>', 'Show status for specified tools (comma-separated)')
  .action(async (options) => {
    const args = ['status'];
    if (options.all) args.push('--all');
    if (options.only) args.push('--only', options.only);
    await runStatus(args);
  });

program
  .command('diff')
  .description('Show differences between local and cloud')
  .option('-a, --all', 'Show diff for all tools')
  .option('-o, --only <tools>', 'Show diff for specified tools (comma-separated)')
  .action(async (options) => {
    const args = ['diff'];
    if (options.all) args.push('--all');
    if (options.only) args.push('--only', options.only);
    await runDiff(args);
  });

program
  .command('config')
  .description('Manage SyncAI configuration')
  .option('-l, --list', 'List all configuration')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-d, --delete <key>', 'Delete a configuration value')
  .option('-e, --edit', 'Open configuration in editor')
  .action(async (options) => {
    const args = [];
    if (options.list) args.push('list');
    else if (options.get) args.push('get', options.get);
    else if (options.set) args.push('set', options.set);
    else if (options.delete) args.push('delete', options.delete);
    else if (options.edit) args.push('edit');
    await runConfig(args);
  });

program
  .command('auth')
  .description('Manage GitHub authentication')
  .option('-s, --status', 'Check authentication status')
  .option('-l, --login', 'Login to GitHub')
  .option('-o, --logout', 'Logout from GitHub')
  .action(async (options) => {
    const args = [];
    if (options.login) args.push('login');
    else if (options.logout) args.push('logout');
    else args.push('status');
    await runAuth(args);
  });

program
  .command('backup')
  .description('Create or manage backups')
  .option('-c, --create', 'Create a backup')
  .option('-l, --list', 'List all backups')
  .option('-o, --only <tools>', 'Backup only specified tools (comma-separated)')
  .action(async (options) => {
    const args = [];
    if (options.list) args.push('list');
    else if (options.create) args.push('create');
    if (options.only) args.push('--only', options.only);
    await runBackup(args);
  });

program
  .command('history')
  .description('Show sync history')
  .option('-n, --limit <n>', 'Limit number of entries', '10')
  .option('-o, --only <tools>', 'Show history for specified tools (comma-separated)')
  .action(async (options) => {
    const args = [];
    if (options.limit) args.push('--limit', options.limit);
    if (options.only) args.push('--only', options.only);
    await runHistory(args);
  });

program
  .command('rollback')
  .description('Rollback to a previous backup')
  .argument('[backup-id]', 'Backup ID to rollback to')
  .option('-l, --list', 'List available backups')
  .option('-o, --only <tools>', 'Rollback only specified tools (comma-separated)')
  .action(async (backupId, options) => {
    const args = [];
    if (options.list) args.push('list');
    else if (backupId) args.push(backupId);
    if (options.only) args.push('--only', options.only);
    await runRollback(args);
  });

program
  .command('plugin')
  .description('Manage custom tool plugins')
  .option('-l, --list', 'List installed plugins')
  .option('-a, --add <path>', 'Add a plugin')
  .option('-r, --remove <name>', 'Remove a plugin')
  .action(async (options) => {
    const args = [];
    if (options.list) args.push('list');
    else if (options.add) args.push('add', options.add);
    else if (options.remove) args.push('remove', options.remove);
    await runPlugin(args);
  });

program
  .command('help')
  .description('Show detailed help')
  .argument('[command]', 'Command to show help for')
  .action(async (command) => {
    await runHelp(command ? [command] : []);
  });

console.log(chalk.cyan(`
  ███████╗██╗   ██╗███╗   ██╗ ██████╗ █████╗ ██╗
  ██╔════╝╚██╗ ██╔╝████╗  ██║██╔════╝██╔══██╗██║
  ███████╗ ╚████╔╝ ██╔██╗ ██║██║     ███████║██║
  ╚════██║  ╚██╔╝  ██║╚██╗██║██║     ██╔══██║██║
  ███████║   ██║   ██║ ╚████║╚██████╗██║  ██║██║
  ╚══════╝   ╚═╝   ╚═╝  ╚═══╝ ╚═════╝╚═╝  ╚═╝╚═╝
`));
console.log(chalk.gray('  Sync AI configs across OpenCode, Kiro, Gemini, Claude & more\n'));

(async () => {
  await checkAndPromptUpdates({ silent: false });
  program.parse();

  if (!process.argv.slice(2).length) {
    program.help();
  }
})();
