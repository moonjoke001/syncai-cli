import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { getSyncStatus } from '../lib/sync.js';
import { detectCurrentEnvironment } from '../lib/detector.js';
import { isInitialized, loadMappings, getEffectiveConfigDir } from '../lib/config.js';
import { expandHome, readFile } from '../utils/fs.js';
import path from 'path';

export async function run(args) {
  const verbose = args.includes('-v') || args.includes('--verbose');
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  
  let toolName;
  const detected = await detectCurrentEnvironment();
  if (detected.detected) {
    toolName = detected.tool;
  } else {
    const mappings = await loadMappings();
    const installed = Object.keys(mappings).filter(t => mappings[t]?.installed);
    if (installed.length > 0) {
      toolName = installed[0];
    } else {
      logger.warn('未找到已安装的工具');
      return;
    }
  }
  
  const status = await getSyncStatus(toolName);
  
  if (status.status === 'synced') {
    logger.success(`${toolName}: 已同步，无差异`);
    console.log('');
    return;
  }
  
  if (status.status === 'no_local' || status.status === 'no_remote') {
    logger.warn(`${toolName}: ${status.status === 'no_local' ? '本地不存在' : '云端不存在'}`);
    console.log('');
    return;
  }
  
  const modified = status.files.filter(f => f.status === 'modified');
  
  if (modified.length === 0) {
    logger.info('没有内容差异');
    console.log('');
    return;
  }
  
  const configDir = await getEffectiveConfigDir(toolName);
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo', toolName);
  
  for (const file of modified) {
    console.log('');
    console.log(chalk.bold(`--- ${file.path} ---`));
    console.log('');
    
    try {
      const localPath = path.join(expandHome(configDir), file.path);
      const remotePath = path.join(repoDir, file.path);
      
      const localContent = await readFile(localPath);
      const remoteContent = await readFile(remotePath);
      
      console.log(chalk.red('- 本地:'));
      const localLines = localContent.split('\n').slice(0, 10);
      for (const line of localLines) {
        console.log(chalk.red(`  ${line}`));
      }
      if (localContent.split('\n').length > 10) {
        console.log(chalk.gray('  ...'));
      }
      
      console.log('');
      console.log(chalk.green('+ 云端:'));
      const remoteLines = remoteContent.split('\n').slice(0, 10);
      for (const line of remoteLines) {
        console.log(chalk.green(`  ${line}`));
      }
      if (remoteContent.split('\n').length > 10) {
        console.log(chalk.gray('  ...'));
      }
    } catch (e) {
      console.log(chalk.gray(`  无法读取文件: ${e.message}`));
    }
  }
  
  console.log('');
}
