import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { syncToCloud } from '../lib/sync.js';
import { detectCurrentEnvironment } from '../lib/detector.js';
import { isInitialized, loadMappings } from '../lib/config.js';
import { expandHome, pathExists } from '../utils/fs.js';
import { getToolDefinition } from '../tools/index.js';
import { watch } from 'fs';
import path from 'path';

export async function run(args) {
  const all = args.includes('--all');
  const verbose = args.includes('-v') || args.includes('--verbose');
  const onlyIndex = args.findIndex(a => a.startsWith('--only='));
  const onlyTools = onlyIndex >= 0 ? args[onlyIndex].slice(7).split(',') : null;
  const intervalIndex = args.findIndex(a => a.startsWith('--interval='));
  const interval = intervalIndex >= 0 ? parseInt(args[intervalIndex].slice(11), 10) * 1000 : 5000;
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  let toolsToWatch = [];
  
  if (onlyTools) {
    toolsToWatch = onlyTools;
  } else if (all) {
    const mappings = await loadMappings();
    toolsToWatch = Object.keys(mappings).filter(t => mappings[t]?.installed);
  } else {
    const detected = await detectCurrentEnvironment();
    if (!detected.detected) {
      logger.warn('未检测到当前环境，请使用 --all 或 --only=<tool>');
      return;
    }
    toolsToWatch = [detected.tool];
  }
  
  console.log('');
  logger.info(`正在监视 ${toolsToWatch.length} 个工具的配置变更...`);
  console.log(chalk.gray(`  工具: ${toolsToWatch.join(', ')}`));
  console.log(chalk.gray(`  间隔: ${interval / 1000}秒`));
  console.log('');
  console.log(chalk.yellow('按 Ctrl+C 停止监视'));
  console.log('');
  
  const watchers = [];
  const pendingSync = new Set();
  let syncTimeout = null;
  
  const debouncedSync = async () => {
    if (pendingSync.size === 0) return;
    
    const toolsToSync = [...pendingSync];
    pendingSync.clear();
    
    for (const toolName of toolsToSync) {
      logger.startSpinner(`正在同步 ${toolName}...`);
      const result = await syncToCloud(toolName, { verbose });
      
      if (result.success) {
        const total = result.results.added.length + result.results.modified.length;
        if (total > 0) {
          logger.succeedSpinner(`${toolName}: 已同步 ${total} 个文件`);
        } else {
          logger.succeedSpinner(`${toolName}: 无变更`);
        }
      } else {
        logger.failSpinner(`${toolName}: 同步失败`);
      }
    }
  };
  
  for (const toolName of toolsToWatch) {
    const toolDef = getToolDefinition(toolName);
    if (!toolDef) continue;
    
    const configDir = expandHome(toolDef.defaultConfigDir);
    if (!await pathExists(configDir)) continue;
    
    try {
      const watcher = watch(configDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        if (filename.includes('.git')) return;
        if (filename.includes('node_modules')) return;
        if (filename.endsWith('.log')) return;
        
        if (verbose) {
          console.log(chalk.gray(`  [${toolName}] ${eventType}: ${filename}`));
        }
        
        pendingSync.add(toolName);
        
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
        syncTimeout = setTimeout(debouncedSync, interval);
      });
      
      watchers.push(watcher);
      logger.success(`监视中: ${toolName} (${configDir})`);
    } catch (err) {
      logger.error(`无法监视 ${toolName}: ${err.message}`);
    }
  }
  
  if (watchers.length === 0) {
    logger.error('没有可监视的工具');
    return;
  }
  
  process.on('SIGINT', () => {
    console.log('');
    logger.info('停止监视...');
    for (const watcher of watchers) {
      watcher.close();
    }
    process.exit(0);
  });
  
  await new Promise(() => {});
}
