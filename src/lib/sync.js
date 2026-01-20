import path from 'path';
import { 
  expandHome, 
  pathExists, 
  copyDir, 
  copyFile, 
  listFiles, 
  ensureDir,
  readFile,
  writeFile,
  isDirectory
} from '../utils/fs.js';
import { hashFile } from '../utils/hash.js';
import { loadMappings, loadIgnore, loadConfig, getEffectiveConfigDir } from './config.js';
import { getToolDefinitions } from '../tools/index.js';
import { checkSensitiveContent } from './security.js';
import { createBackup } from './backup.js';
import { minimatch } from 'minimatch';

export async function syncToCloud(toolName, options = {}) {
  const { dryRun = false, verbose = false, force = false } = options;
  
  const mappings = await loadMappings();
  const toolMapping = mappings[toolName];
  if (!toolMapping || !toolMapping.installed) {
    return { success: false, error: 'tool_not_installed' };
  }
  
  const configDir = await getEffectiveConfigDir(toolName);
  if (!configDir || !await pathExists(expandHome(configDir))) {
    return { success: false, error: 'config_dir_not_found' };
  }
  
  const config = await loadConfig();
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo', toolName);
  
  if (!dryRun) {
    await ensureDir(repoDir);
  }
  
  const ignore = await loadIgnore();
  const toolDef = getToolDefinitions()[toolName];
  const ignorePatterns = [
    ...(ignore.global || []), 
    ...(ignore[toolName] || []),
    ...(toolDef?.ignore || [])
  ];
  
  const syncPaths = toolMapping.syncPaths || toolDef?.syncPaths || [];
  
  const results = {
    added: [],
    modified: [],
    deleted: [],
    skipped: [],
    sensitive: []
  };
  
  for (const syncPath of syncPaths) {
    const sourcePath = path.join(expandHome(configDir), syncPath);
    const destPath = path.join(repoDir, syncPath);
    
    if (!await pathExists(sourcePath)) {
      results.skipped.push({ path: syncPath, reason: 'not_found' });
      continue;
    }
    
    const isDir = await isDirectory(sourcePath);
    
    if (isDir) {
      const files = await listFiles(sourcePath, { recursive: true, filesOnly: true });
      
      for (const file of files) {
        const relativePath = path.join(syncPath, file.path);
        const sourceFile = path.join(expandHome(configDir), relativePath);
        const destFile = path.join(repoDir, relativePath);
        
        if (shouldIgnore(relativePath, ignorePatterns)) {
          results.skipped.push({ path: relativePath, reason: 'ignored' });
          continue;
        }
        
        if (!force) {
          const sensitiveCheck = await checkSensitiveContent(sourceFile);
          if (sensitiveCheck.hasSensitive) {
            results.sensitive.push({ 
              path: relativePath, 
              matches: sensitiveCheck.matches 
            });
            continue;
          }
        }
        
        const destExists = await pathExists(destFile);
        
        if (!dryRun) {
          await ensureDir(path.dirname(destFile));
          await copyFile(sourceFile, destFile);
        }
        
        if (destExists) {
          results.modified.push({ path: relativePath });
        } else {
          results.added.push({ path: relativePath });
        }
      }
    } else {
      if (shouldIgnore(syncPath, ignorePatterns)) {
        results.skipped.push({ path: syncPath, reason: 'ignored' });
        continue;
      }
      
      if (!force) {
        const sensitiveCheck = await checkSensitiveContent(sourcePath);
        if (sensitiveCheck.hasSensitive) {
          results.sensitive.push({ 
            path: syncPath, 
            matches: sensitiveCheck.matches 
          });
          continue;
        }
      }
      
      const destExists = await pathExists(destPath);
      
      if (!dryRun) {
        await ensureDir(path.dirname(destPath));
        await copyFile(sourcePath, destPath);
      }
      
      if (destExists) {
        results.modified.push({ path: syncPath });
      } else {
        results.added.push({ path: syncPath });
      }
    }
  }
  
  return { success: true, results, dryRun };
}

export async function syncFromCloud(toolName, options = {}) {
  const { dryRun = false, verbose = false, backup = true } = options;
  
  const mappings = await loadMappings();
  const toolMapping = mappings[toolName];
  
  const configDir = await getEffectiveConfigDir(toolName);
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo', toolName);
  
  if (!await pathExists(repoDir)) {
    return { success: false, error: 'repo_not_found' };
  }
  
  if (backup && !dryRun && await pathExists(expandHome(configDir))) {
    await createBackup(toolName, 'pre-pull');
  }
  
  const results = {
    added: [],
    modified: [],
    skipped: []
  };
  
  const files = await listFiles(repoDir, { recursive: true, filesOnly: true });
  
  for (const file of files) {
    const sourceFile = path.join(repoDir, file.path);
    const destFile = path.join(expandHome(configDir), file.path);
    
    const destExists = await pathExists(destFile);
    
    if (!dryRun) {
      await ensureDir(path.dirname(destFile));
      await copyFile(sourceFile, destFile);
    }
    
    if (destExists) {
      results.modified.push({ path: file.path });
    } else {
      results.added.push({ path: file.path });
    }
  }
  
  return { success: true, results, dryRun };
}

export async function getSyncStatus(toolName) {
  const configDir = await getEffectiveConfigDir(toolName);
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo', toolName);
  
  if (!await pathExists(expandHome(configDir))) {
    return { status: 'no_local', files: [] };
  }
  
  if (!await pathExists(repoDir)) {
    return { status: 'no_remote', files: [] };
  }
  
  const localFiles = await listFiles(expandHome(configDir), { recursive: true, filesOnly: true });
  const remoteFiles = await listFiles(repoDir, { recursive: true, filesOnly: true });
  
  const localSet = new Set(localFiles.map(f => f.path));
  const remoteSet = new Set(remoteFiles.map(f => f.path));
  
  const differences = [];
  
  for (const file of localFiles) {
    if (!remoteSet.has(file.path)) {
      differences.push({ path: file.path, status: 'local_only' });
    } else {
      const localHash = await hashFile(path.join(expandHome(configDir), file.path));
      const remoteHash = await hashFile(path.join(repoDir, file.path));
      if (localHash !== remoteHash) {
        differences.push({ path: file.path, status: 'modified' });
      }
    }
  }
  
  for (const file of remoteFiles) {
    if (!localSet.has(file.path)) {
      differences.push({ path: file.path, status: 'remote_only' });
    }
  }
  
  const status = differences.length === 0 ? 'synced' : 'out_of_sync';
  return { status, files: differences };
}

function shouldIgnore(filePath, patterns) {
  return patterns.some(pattern => minimatch(filePath, pattern));
}

export async function detectConflicts(toolName) {
  const configDir = await getEffectiveConfigDir(toolName);
  const repoDir = path.join(expandHome('~/.config/syncai'), 'repo', toolName);
  
  if (!configDir || !await pathExists(expandHome(configDir)) || !await pathExists(repoDir)) {
    return [];
  }
  
  const conflicts = [];
  const remoteFiles = await listFiles(repoDir, { recursive: true, filesOnly: true });
  
  for (const file of remoteFiles) {
    const localFile = path.join(expandHome(configDir), file.path);
    const remoteFile = path.join(repoDir, file.path);
    
    if (await pathExists(localFile)) {
      const localHash = await hashFile(localFile);
      const remoteHash = await hashFile(remoteFile);
      
      if (localHash !== remoteHash) {
        let localContent = '';
        let cloudContent = '';
        
        try {
          localContent = await readFile(localFile);
          cloudContent = await readFile(remoteFile);
        } catch {
        }
        
        conflicts.push({
          path: file.path,
          localHash,
          remoteHash,
          localContent,
          cloudContent
        });
      }
    }
  }
  
  return conflicts;
}
