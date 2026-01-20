import path from 'path';
import { 
  expandHome, 
  ensureDir, 
  copyDir, 
  listFiles, 
  remove,
  getBackupsDir,
  pathExists,
  readJson,
  writeJson
} from '../utils/fs.js';
import { generateTimestamp } from '../utils/hash.js';
import { getEffectiveConfigDir } from './config.js';

const MAX_BACKUPS = 10;

export async function createBackup(toolName, reason = 'manual') {
  const configDir = await getEffectiveConfigDir(toolName);
  if (!configDir || !await pathExists(expandHome(configDir))) {
    return { success: false, error: 'config_dir_not_found' };
  }
  
  const timestamp = generateTimestamp();
  const backupName = `${timestamp}_${reason}`;
  const backupDir = path.join(getBackupsDir(), toolName, backupName);
  
  await ensureDir(backupDir);
  await copyDir(expandHome(configDir), backupDir);
  
  const meta = {
    toolName,
    reason,
    timestamp: new Date().toISOString(),
    sourceDir: configDir
  };
  await writeJson(path.join(backupDir, '.backup-meta.json'), meta);
  
  await cleanOldBackups(toolName);
  
  return { success: true, backupDir, backupName };
}

export async function listBackups(toolName = null) {
  const backupsDir = getBackupsDir();
  if (!await pathExists(backupsDir)) {
    return [];
  }
  
  const results = [];
  const toolDirs = toolName 
    ? [toolName] 
    : (await listFiles(backupsDir)).filter(f => f.isDirectory).map(f => f.path);
  
  for (const tool of toolDirs) {
    const toolBackupDir = path.join(backupsDir, tool);
    if (!await pathExists(toolBackupDir)) continue;
    
    const backups = await listFiles(toolBackupDir);
    for (const backup of backups.filter(b => b.isDirectory)) {
      const metaPath = path.join(toolBackupDir, backup.path, '.backup-meta.json');
      let meta = {};
      if (await pathExists(metaPath)) {
        meta = await readJson(metaPath);
      }
      results.push({
        tool,
        name: backup.path,
        path: path.join(toolBackupDir, backup.path),
        ...meta
      });
    }
  }
  
  return results.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
}

export async function restoreBackup(toolName, backupName) {
  const backupDir = path.join(getBackupsDir(), toolName, backupName);
  if (!await pathExists(backupDir)) {
    return { success: false, error: 'backup_not_found' };
  }
  
  const configDir = await getEffectiveConfigDir(toolName);
  if (!configDir) {
    return { success: false, error: 'tool_not_configured' };
  }
  
  await createBackup(toolName, 'pre-restore');
  
  const expandedConfigDir = expandHome(configDir);
  await remove(expandedConfigDir);
  await ensureDir(expandedConfigDir);
  await copyDir(backupDir, expandedConfigDir);
  
  const metaPath = path.join(expandedConfigDir, '.backup-meta.json');
  if (await pathExists(metaPath)) {
    await remove(metaPath);
  }
  
  return { success: true };
}

export async function cleanOldBackups(toolName, keep = MAX_BACKUPS) {
  const backups = await listBackups(toolName);
  const toolBackups = backups.filter(b => b.tool === toolName);
  
  if (toolBackups.length <= keep) return;
  
  const toDelete = toolBackups.slice(keep);
  for (const backup of toDelete) {
    await remove(backup.path);
  }
  
  return toDelete.length;
}

export async function deleteBackup(toolName, backupName) {
  const backupDir = path.join(getBackupsDir(), toolName, backupName);
  if (!await pathExists(backupDir)) {
    return { success: false, error: 'backup_not_found' };
  }
  
  await remove(backupDir);
  return { success: true };
}
