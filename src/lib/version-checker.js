import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

const CACHE_FILE = join(homedir(), '.config', 'syncai', 'version-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Skills/plugins to check
const TRACKED_ITEMS = [
  {
    name: 'oh-my-opencode',
    type: 'plugin',
    repo: 'code-yeongyu/oh-my-opencode',
    localPath: join(homedir(), '.config', 'opencode', 'node_modules', 'oh-my-opencode'),
    versionType: 'npm'
  },
  {
    name: 'superpowers',
    type: 'skill',
    repo: 'obra/superpowers',
    localPath: join(homedir(), '.config', 'opencode', 'superpowers'),
    versionType: 'git'
  },
  {
    name: 'planning-with-files',
    type: 'skill',
    repo: 'OthmanAdi/planning-with-files',
    localPath: join(homedir(), '.config', 'opencode', 'planning-with-files'),
    versionType: 'git'
  },
  {
    name: 'ui-ux-pro-max-skill',
    type: 'skill',
    repo: 'nextlevelbuilder/ui-ux-pro-max-skill',
    localPath: join(homedir(), '.config', 'opencode', 'ui-ux-pro-max-skill'),
    versionType: 'git'
  },
  {
    name: 'opencode-antigravity-auth',
    type: 'plugin',
    repo: 'NoeFabris/opencode-antigravity-auth',
    localPath: null, // npm plugin, no local path
    versionType: 'npm-config'
  }
];

/**
 * Load cached version data
 */
async function loadCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = await readFile(CACHE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    // Cache corrupted or missing, start fresh
  }
  return { lastCheck: 0, versions: {} };
}

/**
 * Save version data to cache
 */
async function saveCache(cache) {
  const dir = join(homedir(), '.config', 'syncai');
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Check if cache is still valid (less than 24 hours old)
 */
function isCacheValid(cache) {
  return Date.now() - cache.lastCheck < CACHE_TTL;
}

/**
 * Get latest version from GitHub API
 */
async function getLatestVersion(repo) {
  try {
    // Try releases first
    const releasesUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await fetch(releasesUrl);
    
    if (response.ok) {
      const data = await response.json();
      return { version: data.tag_name, type: 'release' };
    }
    
    // Fall back to tags
    const tagsUrl = `https://api.github.com/repos/${repo}/tags`;
    const tagsResponse = await fetch(tagsUrl);
    
    if (tagsResponse.ok) {
      const tags = await tagsResponse.json();
      if (tags.length > 0) {
        return { version: tags[0].name, type: 'tag' };
      }
    }
    
    // Fall back to latest commit
    const commitsUrl = `https://api.github.com/repos/${repo}/commits?per_page=1`;
    const commitsResponse = await fetch(commitsUrl);
    
    if (commitsResponse.ok) {
      const commits = await commitsResponse.json();
      if (commits.length > 0) {
        return { version: commits[0].sha.substring(0, 7), type: 'commit' };
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Get local version for git-based skill
 */
function getLocalGitVersion(localPath) {
  try {
    if (!existsSync(localPath)) {
      return null;
    }
    
    // Try to get tag
    try {
      const tag = execSync('git describe --tags --abbrev=0 2>/dev/null', { 
        cwd: localPath, 
        encoding: 'utf-8' 
      }).trim();
      if (tag) return { version: tag, type: 'tag' };
    } catch (e) {
      // No tags
    }
    
    // Get commit hash
    const commit = execSync('git rev-parse --short HEAD', { 
      cwd: localPath, 
      encoding: 'utf-8' 
    }).trim();
    return { version: commit, type: 'commit' };
  } catch (e) {
    return null;
  }
}

/**
 * Get local version for npm package
 */
function getLocalNpmVersion(localPath) {
  try {
    if (!existsSync(localPath)) {
      return null;
    }
    const pkgPath = join(localPath, 'package.json');
    if (!existsSync(pkgPath)) {
      return null;
    }
    const pkg = JSON.parse(execSync(`cat "${pkgPath}"`, { encoding: 'utf-8' }));
    return { version: pkg.version, type: 'npm' };
  } catch (e) {
    return null;
  }
}

/**
 * Check if update is available
 */
function hasUpdate(local, remote) {
  if (!local || !remote) return false;
  
  // If types match, compare versions
  if (local.type === remote.type) {
    return local.version !== remote.version;
  }
  
  // Different types (e.g., local is commit, remote is tag) - assume update available
  if (remote.type === 'release' || remote.type === 'tag') {
    return true;
  }
  
  return local.version !== remote.version;
}

/**
 * Update a git-based skill
 */
async function updateGitSkill(item) {
  try {
    execSync('git pull --ff-only', { 
      cwd: item.localPath, 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check all tracked items for updates
 */
export async function checkForUpdates(options = {}) {
  const { force = false, silent = false } = options;
  
  let cache = await loadCache();
  
  // Use cache if valid and not forced
  if (!force && isCacheValid(cache)) {
    if (!silent) {
      console.log(chalk.dim('Using cached version data (less than 24h old)'));
    }
    return cache.versions;
  }
  
  if (!silent) {
    console.log(chalk.cyan('Checking for updates...'));
  }
  
  const results = {};
  
  for (const item of TRACKED_ITEMS) {
    // Skip if local path doesn't exist
    if (item.localPath && !existsSync(item.localPath)) {
      continue;
    }
    
    // Get local version
    let localVersion = null;
    if (item.versionType === 'git') {
      localVersion = getLocalGitVersion(item.localPath);
    } else if (item.versionType === 'npm') {
      localVersion = getLocalNpmVersion(item.localPath);
    }
    
    // Get remote version
    const remoteVersion = await getLatestVersion(item.repo);
    
    results[item.name] = {
      ...item,
      local: localVersion,
      remote: remoteVersion,
      hasUpdate: hasUpdate(localVersion, remoteVersion)
    };
  }
  
  // Save to cache
  cache = {
    lastCheck: Date.now(),
    versions: results
  };
  await saveCache(cache);
  
  return results;
}

/**
 * Display update status
 */
export function displayUpdateStatus(results) {
  const updates = Object.values(results).filter(r => r.hasUpdate);
  
  if (updates.length === 0) {
    console.log(chalk.green('✓ All skills and plugins are up to date'));
    return [];
  }
  
  console.log(chalk.yellow(`\n⚠ ${updates.length} update(s) available:\n`));
  
  for (const item of updates) {
    const localStr = item.local ? `${item.local.version}` : 'not installed';
    const remoteStr = item.remote ? `${item.remote.version}` : 'unknown';
    console.log(`  ${chalk.bold(item.name)}: ${chalk.red(localStr)} → ${chalk.green(remoteStr)}`);
  }
  
  console.log();
  return updates;
}

/**
 * Prompt user to update and perform updates
 */
export async function promptAndUpdate(updates) {
  if (updates.length === 0) return;
  
  const choices = updates
    .filter(u => u.versionType === 'git' && u.localPath)
    .map(u => ({
      name: `${u.name} (${u.local?.version || '?'} → ${u.remote?.version || '?'})`,
      value: u.name,
      checked: true
    }));
  
  if (choices.length === 0) {
    console.log(chalk.dim('No git-based updates available for automatic upgrade.'));
    return;
  }
  
  if (!process.stdin.isTTY) {
    console.log(chalk.dim('Non-interactive mode. Run in terminal to update interactively.'));
    return;
  }
  
  const { selectedUpdates } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedUpdates',
      message: 'Select items to update:',
      choices
    }
  ]);
  
  if (selectedUpdates.length === 0) {
    console.log(chalk.dim('No updates selected.'));
    return;
  }
  
  for (const name of selectedUpdates) {
    const item = updates.find(u => u.name === name);
    if (!item) continue;
    
    process.stdout.write(`Updating ${chalk.bold(item.name)}... `);
    const success = await updateGitSkill(item);
    
    if (success) {
      console.log(chalk.green('✓'));
    } else {
      console.log(chalk.red('✗ (try manual update)'));
    }
  }
}

/**
 * Main function to check and prompt for updates
 */
export async function checkAndPromptUpdates(options = {}) {
  const results = await checkForUpdates(options);
  const updates = displayUpdateStatus(results);
  
  if (updates.length > 0 && !options.silent) {
    await promptAndUpdate(updates);
  }
  
  return results;
}

export default {
  checkForUpdates,
  displayUpdateStatus,
  promptAndUpdate,
  checkAndPromptUpdates,
  TRACKED_ITEMS
};
