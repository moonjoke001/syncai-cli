import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { syncFromCloud, detectConflicts } from '../lib/sync.js';
import { detectCurrentEnvironment } from '../lib/detector.js';
import { isInitialized, loadMappings } from '../lib/config.js';
import { pullFromRepo } from '../lib/github.js';
import { expandHome, readFile } from '../utils/fs.js';
import { confirm, select } from '../utils/prompt.js';
import path from 'path';

export async function run(args) {
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const verbose = args.includes('-v') || args.includes('--verbose');
  const force = args.includes('--force') || args.includes('-f');
  const interactive = !args.includes('--no-interactive');
  const onlyIndex = args.findIndex(a => a.startsWith('--only='));
  const onlyTools = onlyIndex >= 0 ? args[onlyIndex].slice(7).split(',') : null;
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo');
  logger.startSpinner('正在从云端拉取...');
  const pullResult = await pullFromRepo(repoDir);
  
  if (!pullResult.success && !pullResult.stderr?.includes('not a git repository')) {
    logger.failSpinner('拉取失败');
    logger.error(pullResult.stderr);
    return;
  }
  logger.succeedSpinner('已获取最新配置');
  
  let toolsToSync = [];
  
  if (onlyTools) {
    toolsToSync = onlyTools;
  } else if (all) {
    const mappings = await loadMappings();
    toolsToSync = Object.keys(mappings).filter(t => mappings[t]?.installed);
  } else {
    const detected = await detectCurrentEnvironment();
    if (!detected.detected) {
      logger.warn('未检测到当前环境，请使用 --all 或 --only=<tool>');
      return;
    }
    toolsToSync = [detected.tool];
  }
  
  if (dryRun) {
    console.log(chalk.yellow('[Dry Run] 以下操作将被执行:'));
    console.log('');
  }
  
  for (const toolName of toolsToSync) {
    console.log('');
    logger.section(toolName);
    
    const conflicts = await detectConflicts(toolName);
    
    if (conflicts.length > 0 && !force && interactive && !dryRun) {
      console.log(chalk.red('  发现冲突文件:'));
      for (const conflict of conflicts) {
        console.log(`    ! ${conflict.path}`);
      }
      console.log('');
      
      const resolution = await resolveConflictsInteractively(toolName, conflicts);
      if (resolution === 'abort') {
        logger.warn('已取消同步');
        continue;
      }
    }
    
    const result = await syncFromCloud(toolName, { dryRun, verbose, force });
    
    if (!result.success) {
      logger.error(`同步失败: ${result.error}`);
      continue;
    }
    
    const { results } = result;
    
    if (results.added.length > 0) {
      console.log(chalk.green('  新增:'));
      for (const f of results.added) {
        console.log(`    + ${f.path}`);
      }
    }
    
    if (results.modified.length > 0) {
      console.log(chalk.yellow('  修改:'));
      for (const f of results.modified) {
        console.log(`    ~ ${f.path}`);
      }
    }
    
    const total = results.added.length + results.modified.length;
    if (total === 0) {
      logger.success('已是最新');
    } else {
      logger.success(`${dryRun ? '将' : '已'}同步 ${total} 个文件`);
    }
  }
  
  console.log('');
}

async function resolveConflictsInteractively(toolName, conflicts) {
  console.log(chalk.cyan('  冲突解决选项:'));
  console.log('');
  
  const choice = await select('如何处理冲突?', [
    { value: 'cloud', label: '使用云端版本 (覆盖本地)' },
    { value: 'local', label: '保留本地版本 (跳过同步)' },
    { value: 'each', label: '逐个文件决定' },
    { value: 'abort', label: '取消操作' }
  ]);
  
  if (choice === 'abort') {
    return 'abort';
  }
  
  if (choice === 'cloud') {
    return 'force';
  }
  
  if (choice === 'local') {
    return 'skip';
  }
  
  if (choice === 'each') {
    for (const conflict of conflicts) {
      console.log('');
      console.log(chalk.yellow(`  文件: ${conflict.path}`));
      
      if (conflict.localContent && conflict.cloudContent) {
        console.log(chalk.gray('  本地版本:'));
        const localPreview = conflict.localContent.split('\n').slice(0, 5).map(l => `    ${l}`).join('\n');
        console.log(localPreview);
        if (conflict.localContent.split('\n').length > 5) {
          console.log('    ...');
        }
        
        console.log(chalk.gray('  云端版本:'));
        const cloudPreview = conflict.cloudContent.split('\n').slice(0, 5).map(l => `    ${l}`).join('\n');
        console.log(cloudPreview);
        if (conflict.cloudContent.split('\n').length > 5) {
          console.log('    ...');
        }
      }
      
      const fileChoice = await select(`如何处理 ${conflict.path}?`, [
        { value: 'cloud', label: '使用云端版本' },
        { value: 'local', label: '保留本地版本' },
        { value: 'backup', label: '备份本地后使用云端' }
      ]);
      
      conflict.resolution = fileChoice;
    }
    
    return 'resolved';
  }
  
  return choice;
}
