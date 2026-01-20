import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { confirm } from '../utils/prompt.js';
import { checkoutCommit, getCommitHistory } from '../lib/github.js';
import { createBackup } from '../lib/backup.js';
import { isInitialized, loadMappings } from '../lib/config.js';
import { expandHome } from '../utils/fs.js';
import path from 'path';

export async function run(args) {
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  const showList = args.includes('--list') || args.includes('-l') || args.includes('list');
  const commitHash = args.find(a => !a.startsWith('-') && a !== 'list');
  
  if (showList) {
    console.log('');
    console.log(`使用 ${chalk.yellow('aihistory')} 查看可用的提交`);
    console.log(`使用 ${chalk.yellow('airollback <commit-hash>')} 回滚到指定版本`);
    console.log('');
    return;
  }
  
  if (!commitHash) {
    console.log('');
    console.log('用法:');
    console.log(`  ${chalk.yellow('airollback <commit-hash>')}`);
    console.log('');
    console.log(`使用 ${chalk.yellow('aihistory')} 查看可用的提交`);
    console.log('');
    return;
  }
  
  console.log('');
  
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo');
  const history = await getCommitHistory(repoDir, 50);
  
  const commit = history.find(c => c.hash.startsWith(commitHash));
  if (!commit) {
    logger.error(`未找到提交: ${commitHash}`);
    console.log(`使用 ${chalk.yellow('aihistory')} 查看可用的提交`);
    console.log('');
    return;
  }
  
  console.log(`将回滚到: ${chalk.yellow(commit.hash)} ${commit.message}`);
  console.log(`  ${chalk.gray(new Date(commit.date).toLocaleString())}`);
  console.log('');
  
  const shouldRollback = await confirm('确定要回滚? 当前更改将丢失', false);
  if (!shouldRollback) {
    logger.info('已取消');
    console.log('');
    return;
  }
  
  const mappings = await loadMappings();
  const installedTools = Object.keys(mappings).filter(t => mappings[t]?.installed);
  
  logger.startSpinner('正在创建当前状态备份...');
  for (const tool of installedTools) {
    await createBackup(tool, 'pre-rollback');
  }
  logger.succeedSpinner('备份创建完成');
  
  logger.startSpinner('正在回滚...');
  const success = await checkoutCommit(repoDir, commit.hash);
  
  if (success) {
    logger.succeedSpinner('回滚成功');
    console.log('');
    console.log(`运行 ${chalk.yellow('aipull --all')} 将回滚后的配置应用到本地`);
  } else {
    logger.failSpinner('回滚失败');
  }
  
  console.log('');
}
