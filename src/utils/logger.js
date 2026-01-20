/**
 * Logger utilities
 */
import chalk from 'chalk';
import ora from 'ora';

let spinner = null;

/**
 * Log info message
 */
export function info(message) {
  console.log(chalk.blue('ℹ'), message);
}

/**
 * Log success message
 */
export function success(message) {
  console.log(chalk.green('✓'), message);
}

/**
 * Log warning message
 */
export function warn(message) {
  console.log(chalk.yellow('⚠'), message);
}

/**
 * Log error message
 */
export function error(message) {
  console.log(chalk.red('✗'), message);
}

/**
 * Log debug message (only in verbose mode)
 */
export function debug(message, verbose = false) {
  if (verbose || process.env.SYNCAI_DEBUG) {
    console.log(chalk.gray('[DEBUG]'), message);
  }
}

/**
 * Log section header
 */
export function section(title) {
  console.log('');
  console.log(chalk.cyan.bold(`[${title}]`));
}

/**
 * Log step
 */
export function step(message) {
  console.log(chalk.gray('→'), message);
}

/**
 * Start spinner
 */
export function startSpinner(message) {
  spinner = ora(message).start();
  return spinner;
}

/**
 * Stop spinner with success
 */
export function succeedSpinner(message) {
  if (spinner) {
    spinner.succeed(message);
    spinner = null;
  }
}

/**
 * Stop spinner with failure
 */
export function failSpinner(message) {
  if (spinner) {
    spinner.fail(message);
    spinner = null;
  }
}

/**
 * Stop spinner
 */
export function stopSpinner() {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}

/**
 * Log table
 */
export function table(data, columns) {
  const columnWidths = columns.map(col => {
    const headerLen = col.header.length;
    const maxDataLen = Math.max(...data.map(row => String(row[col.key] || '').length));
    return Math.max(headerLen, maxDataLen);
  });
  
  // Header
  const header = columns.map((col, i) => col.header.padEnd(columnWidths[i])).join('  ');
  console.log(chalk.bold(header));
  console.log(chalk.gray('-'.repeat(header.length)));
  
  // Rows
  for (const row of data) {
    const line = columns.map((col, i) => {
      const value = String(row[col.key] || '');
      return value.padEnd(columnWidths[i]);
    }).join('  ');
    console.log(line);
  }
}

/**
 * Log box
 */
export function box(content, title = '') {
  const lines = content.split('\n');
  const maxLen = Math.max(...lines.map(l => l.length), title.length);
  const border = '─'.repeat(maxLen + 2);
  
  console.log('');
  console.log(chalk.cyan(`┌${border}┐`));
  if (title) {
    console.log(chalk.cyan('│ ') + chalk.bold(title.padEnd(maxLen)) + chalk.cyan(' │'));
    console.log(chalk.cyan(`├${border}┤`));
  }
  for (const line of lines) {
    console.log(chalk.cyan('│ ') + line.padEnd(maxLen) + chalk.cyan(' │'));
  }
  console.log(chalk.cyan(`└${border}┘`));
  console.log('');
}

/**
 * Create formatted output for commands
 */
export function formatCommands(commands) {
  return commands.map(cmd => `  ${chalk.yellow(cmd.name.padEnd(20))} ${chalk.gray(cmd.description)}`).join('\n');
}
