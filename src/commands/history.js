import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { getCommitHistory } from '../lib/github.js';
import { isInitialized } from '../lib/config.js';
import { expandHome } from '../utils/fs.js';
import path from 'path';

export async function run(args) {
  const limitIndex = args.findIndex(a => a.startsWith('--limit=') || a.startsWith('-n'));
  let limit = 10;
  if (limitIndex >= 0) {
    const arg = args[limitIndex];
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.slice(8), 10);
    } else if (arg === '-n' && args[limitIndex + 1]) {
      limit = parseInt(args[limitIndex + 1], 10);
    }
  }
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo');
  const history = await getCommitHistory(repoDir, limit);
  
  if (history.length === 0) {
    logger.info('没有提交历史');
    console.log(`  运行 ${chalk.yellow('aipush')} 创建首次提交`);
    console.log('');
    return;
  }
  
  console.log(chalk.bold('提交历史:'));
  console.log('');
  
  for (const commit of history) {
    const date = new Date(commit.date).toLocaleString();
    console.log(`  ${chalk.yellow(commit.hash)} ${commit.message}`);
    console.log(`    ${chalk.gray(date)} - ${chalk.gray(commit.author)}`);
  }
  
  console.log('');
  console.log(`使用 ${chalk.yellow('airollback <hash>')} 回滚到指定版本`);
  console.log('');
}
