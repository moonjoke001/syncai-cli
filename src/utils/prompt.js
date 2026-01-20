/**
 * Interactive prompt utilities
 */
import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * Confirm prompt
 */
export async function confirm(message, defaultValue = true) {
  const { result } = await inquirer.prompt([{
    type: 'confirm',
    name: 'result',
    message,
    default: defaultValue
  }]);
  return result;
}

/**
 * Input prompt
 */
export async function input(message, defaultValue = '') {
  const { result } = await inquirer.prompt([{
    type: 'input',
    name: 'result',
    message,
    default: defaultValue
  }]);
  return result;
}

/**
 * Password prompt (hidden input)
 */
export async function password(message) {
  const { result } = await inquirer.prompt([{
    type: 'password',
    name: 'result',
    message,
    mask: '*'
  }]);
  return result;
}

/**
 * Select from list
 */
export async function select(message, choices) {
  const { result } = await inquirer.prompt([{
    type: 'list',
    name: 'result',
    message,
    choices
  }]);
  return result;
}

/**
 * Multi-select from list
 */
export async function multiSelect(message, choices) {
  const { result } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'result',
    message,
    choices
  }]);
  return result;
}

/**
 * Conflict resolution prompt
 */
export async function resolveConflict(filePath, localInfo, remoteInfo) {
  console.log('');
  console.log(chalk.yellow(`检测到冲突: ${filePath}`));
  console.log('');
  console.log(`  本地 (${localInfo.device || 'local'}): ${localInfo.timestamp}`);
  console.log(`  云端 (${remoteInfo.device || 'remote'}): ${remoteInfo.timestamp}`);
  console.log('');
  
  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: '选择操作:',
    choices: [
      { name: '使用云端版本 (覆盖本地)', value: 'remote' },
      { name: '保留本地版本 (跳过)', value: 'local' },
      { name: '查看差异', value: 'diff' },
      { name: '取消操作', value: 'cancel' }
    ]
  }]);
  
  return action;
}

/**
 * Install method selection
 */
export async function selectInstallMethod(methods) {
  const { method } = await inquirer.prompt([{
    type: 'list',
    name: 'method',
    message: '选择安装方式:',
    choices: methods.map((m, i) => ({
      name: `[${i + 1}] ${m.command}${m.recommended ? ' (推荐)' : ''}`,
      value: m
    })).concat([
      { name: `[${methods.length + 1}] 手动安装`, value: null }
    ])
  }]);
  
  return method;
}
