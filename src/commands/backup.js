import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { confirm } from '../utils/prompt.js';
import { listBackups, restoreBackup, deleteBackup, cleanOldBackups, createBackup } from '../lib/backup.js';
import { isInitialized, loadMappings } from '../lib/config.js';
import { detectCurrentEnvironment } from '../lib/detector.js';

export async function run(args) {
  const [action, ...rest] = args;
  
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  if (!action || action === 'list') {
    await handleList(rest);
    return;
  }
  
  if (action === 'create') {
    await handleCreate(rest);
    return;
  }
  
  if (action === 'restore') {
    await handleRestore(rest);
    return;
  }
  
  if (action === 'delete') {
    await handleDelete(rest);
    return;
  }
  
  if (action === 'clean') {
    await handleClean(rest);
    return;
  }
  
  console.log('');
  console.log('用法:');
  console.log(`  ${chalk.yellow('aibackup list [tool]')}       列出备份`);
  console.log(`  ${chalk.yellow('aibackup create [tool]')}     创建备份`);
  console.log(`  ${chalk.yellow('aibackup restore <id>')}      恢复备份`);
  console.log(`  ${chalk.yellow('aibackup delete <id>')}       删除备份`);
  console.log(`  ${chalk.yellow('aibackup clean [--keep=5]')}  清理旧备份`);
  console.log('');
}

async function handleList(args) {
  const toolName = args[0] || null;
  
  console.log('');
  
  const backups = await listBackups(toolName);
  
  if (backups.length === 0) {
    logger.info('没有备份');
    console.log('');
    return;
  }
  
  console.log(chalk.bold('备份列表:'));
  console.log('');
  
  let currentTool = null;
  for (const backup of backups) {
    if (backup.tool !== currentTool) {
      currentTool = backup.tool;
      console.log(chalk.cyan(`[${currentTool}]`));
    }
    
    const date = backup.timestamp ? new Date(backup.timestamp).toLocaleString() : 'unknown';
    const reason = backup.reason || 'manual';
    console.log(`  ${chalk.yellow(backup.name)} - ${date} (${chalk.gray(reason)})`);
  }
  
  console.log('');
  console.log(`共 ${backups.length} 个备份`);
  console.log('');
}

async function handleCreate(args) {
  let toolName = args[0];
  
  if (!toolName) {
    const detected = await detectCurrentEnvironment();
    if (detected.detected) {
      toolName = detected.tool;
    } else {
      logger.error('请指定工具名称或在工具环境中运行');
      return;
    }
  }
  
  console.log('');
  logger.startSpinner(`正在创建 ${toolName} 备份...`);
  
  const result = await createBackup(toolName, 'manual');
  
  if (result.success) {
    logger.succeedSpinner(`备份创建成功: ${result.backupName}`);
  } else {
    logger.failSpinner(`备份失败: ${result.error}`);
  }
  
  console.log('');
}

async function handleRestore(args) {
  const backupId = args[0];
  
  if (!backupId) {
    logger.error('请指定备份 ID');
    console.log(`  使用 ${chalk.yellow('aibackup list')} 查看可用备份`);
    return;
  }
  
  const parts = backupId.split('/');
  let toolName, backupName;
  
  if (parts.length === 2) {
    [toolName, backupName] = parts;
  } else {
    const backups = await listBackups();
    const found = backups.find(b => b.name === backupId);
    if (found) {
      toolName = found.tool;
      backupName = found.name;
    } else {
      logger.error('备份不存在');
      return;
    }
  }
  
  console.log('');
  
  const shouldRestore = await confirm(`确定要恢复备份 ${backupName}? 当前配置将被覆盖`, false);
  if (!shouldRestore) {
    logger.info('已取消');
    return;
  }
  
  logger.startSpinner('正在恢复...');
  
  const result = await restoreBackup(toolName, backupName);
  
  if (result.success) {
    logger.succeedSpinner('恢复成功');
  } else {
    logger.failSpinner(`恢复失败: ${result.error}`);
  }
  
  console.log('');
}

async function handleDelete(args) {
  const backupId = args[0];
  
  if (!backupId) {
    logger.error('请指定备份 ID');
    return;
  }
  
  const parts = backupId.split('/');
  let toolName, backupName;
  
  if (parts.length === 2) {
    [toolName, backupName] = parts;
  } else {
    const backups = await listBackups();
    const found = backups.find(b => b.name === backupId);
    if (found) {
      toolName = found.tool;
      backupName = found.name;
    } else {
      logger.error('备份不存在');
      return;
    }
  }
  
  console.log('');
  
  const shouldDelete = await confirm(`确定要删除备份 ${backupName}?`, false);
  if (!shouldDelete) {
    logger.info('已取消');
    return;
  }
  
  const result = await deleteBackup(toolName, backupName);
  
  if (result.success) {
    logger.success('已删除');
  } else {
    logger.error(`删除失败: ${result.error}`);
  }
  
  console.log('');
}

async function handleClean(args) {
  const keepIndex = args.findIndex(a => a.startsWith('--keep='));
  const keep = keepIndex >= 0 ? parseInt(args[keepIndex].slice(7), 10) : 5;
  
  console.log('');
  
  const mappings = await loadMappings();
  const tools = Object.keys(mappings).filter(t => mappings[t]?.installed);
  
  let totalDeleted = 0;
  for (const tool of tools) {
    const deleted = await cleanOldBackups(tool, keep);
    if (deleted > 0) {
      logger.info(`${tool}: 删除了 ${deleted} 个旧备份`);
      totalDeleted += deleted;
    }
  }
  
  if (totalDeleted === 0) {
    logger.success('没有需要清理的备份');
  } else {
    logger.success(`共清理了 ${totalDeleted} 个备份`);
  }
  
  console.log('');
}
