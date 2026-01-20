import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { confirm } from '../utils/prompt.js';
import { syncToCloud } from '../lib/sync.js';
import { detectCurrentEnvironment } from '../lib/detector.js';
import { isInitialized, loadMappings, loadConfig } from '../lib/config.js';
import { pushToRepo, initLocalRepo } from '../lib/github.js';
import { expandHome, pathExists, ensureDir } from '../utils/fs.js';
import path from 'path';

export async function run(args) {
  const dryRun = args.includes('--dry-run');
  const all = args.includes('--all');
  const force = args.includes('--force');
  const verbose = args.includes('-v') || args.includes('--verbose');
  const onlyIndex = args.findIndex(a => a.startsWith('--only='));
  const onlyTools = onlyIndex >= 0 ? args[onlyIndex].slice(7).split(',') : null;
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  
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
  
  let hasSensitive = false;
  let totalFiles = 0;
  
  for (const toolName of toolsToSync) {
    console.log('');
    logger.section(toolName);
    
    const result = await syncToCloud(toolName, { dryRun, verbose, force });
    
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
    
    if (results.skipped.length > 0 && verbose) {
      console.log(chalk.gray('  跳过:'));
      for (const f of results.skipped) {
        console.log(`    ⊘ ${f.path} (${f.reason})`);
      }
    }
    
    if (results.sensitive.length > 0) {
      hasSensitive = true;
      console.log(chalk.red('  ⚠ 检测到敏感信息:'));
      for (const f of results.sensitive) {
        console.log(`    ! ${f.path}`);
        for (const m of f.matches) {
          console.log(`      ${chalk.gray(m.type)}: ${m.preview}`);
        }
      }
    }
    
    totalFiles += results.added.length + results.modified.length;
  }
  
  if (hasSensitive && !force) {
    console.log('');
    logger.warn('检测到敏感信息，这些文件已被跳过');
    console.log(`使用 ${chalk.yellow('--force')} 强制推送（不推荐）`);
  }
  
  if (totalFiles === 0) {
    console.log('');
    logger.success('没有需要推送的更改');
    return;
  }
  
  if (dryRun) {
    console.log('');
    console.log(`共 ${totalFiles} 个文件将被推送`);
    console.log(`使用 ${chalk.yellow('aipush')} 执行实际推送`);
    return;
  }
  
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo');
  
  if (!await pathExists(path.join(repoDir, '.git'))) {
    await ensureDir(repoDir);
    await initLocalRepo(repoDir);
  }
  
  console.log('');
  logger.startSpinner('正在推送到云端...');
  
  const config = await loadConfig();
  const deviceName = config.device?.name || 'unknown';
  const pushResult = await pushToRepo(repoDir, `Update from ${deviceName}`);
  
  if (pushResult.success) {
    logger.succeedSpinner(`已推送 ${totalFiles} 个文件`);
  } else {
    logger.failSpinner('推送失败');
    logger.error(pushResult.error);
  }
  
  console.log('');
}
