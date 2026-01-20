import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { getSyncStatus } from '../lib/sync.js';
import { detectCurrentEnvironment } from '../lib/detector.js';
import { isInitialized, loadMappings } from '../lib/config.js';

export async function run(args) {
  const all = args.includes('--all');
  const verbose = args.includes('-v') || args.includes('--verbose');
  const onlyArg = args.find(a => a.startsWith('--only='));
  const onlyTools = onlyArg ? onlyArg.slice(7).split(',') : null;
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  
  let toolsToCheck = [];
  
  if (onlyTools) {
    toolsToCheck = onlyTools;
  } else if (all) {
    const mappings = await loadMappings();
    toolsToCheck = Object.keys(mappings).filter(t => mappings[t]?.installed);
  } else {
    const detected = await detectCurrentEnvironment();
    if (detected.detected) {
      toolsToCheck = [detected.tool];
    } else {
      const mappings = await loadMappings();
      toolsToCheck = Object.keys(mappings).filter(t => mappings[t]?.installed);
    }
  }
  
  for (const toolName of toolsToCheck) {
    const status = await getSyncStatus(toolName);
    
    console.log('');
    logger.section(toolName);
    
    if (status.status === 'synced') {
      logger.success('已同步 ✓');
    } else if (status.status === 'no_local') {
      logger.warn('本地配置不存在');
    } else if (status.status === 'no_remote') {
      logger.warn('云端配置不存在，运行 aipush 推送');
    } else {
      logger.warn('存在差异');
      
      const localOnly = status.files.filter(f => f.status === 'local_only');
      const remoteOnly = status.files.filter(f => f.status === 'remote_only');
      const modified = status.files.filter(f => f.status === 'modified');
      
      if (localOnly.length > 0) {
        console.log(chalk.green('  本地新增:'));
        for (const f of localOnly.slice(0, verbose ? Infinity : 5)) {
          console.log(`    + ${f.path}`);
        }
        if (!verbose && localOnly.length > 5) {
          console.log(chalk.gray(`    ... 还有 ${localOnly.length - 5} 个文件`));
        }
      }
      
      if (remoteOnly.length > 0) {
        console.log(chalk.blue('  云端新增:'));
        for (const f of remoteOnly.slice(0, verbose ? Infinity : 5)) {
          console.log(`    + ${f.path}`);
        }
        if (!verbose && remoteOnly.length > 5) {
          console.log(chalk.gray(`    ... 还有 ${remoteOnly.length - 5} 个文件`));
        }
      }
      
      if (modified.length > 0) {
        console.log(chalk.yellow('  已修改:'));
        for (const f of modified.slice(0, verbose ? Infinity : 5)) {
          console.log(`    ~ ${f.path}`);
        }
        if (!verbose && modified.length > 5) {
          console.log(chalk.gray(`    ... 还有 ${modified.length - 5} 个文件`));
        }
      }
      
      console.log('');
      console.log(`  运行 ${chalk.yellow('aipush')} 推送本地更改`);
      console.log(`  运行 ${chalk.yellow('aipull')} 拉取云端更改`);
    }
  }
  
  console.log('');
}
