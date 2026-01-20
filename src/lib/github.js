import { execCommand, commandExists, execInteractive } from '../utils/exec.js';
import * as logger from '../utils/logger.js';
import { loadConfig, updateConfig } from './config.js';

const DEFAULT_REPO_NAME = 'syai';

export async function isGhInstalled() {
  return commandExists('gh');
}

export async function isGhAuthenticated() {
  const result = await execCommand('gh auth status');
  return result.success;
}

export async function getGhUsername() {
  const result = await execCommand('gh api user --jq .login');
  if (result.success && result.stdout) {
    return result.stdout.trim();
  }
  return null;
}

export async function loginGh() {
  logger.info('正在启动 GitHub 授权流程...');
  const result = await execInteractive('gh', ['auth', 'login']);
  return result.success;
}

export async function logoutGh() {
  const result = await execInteractive('gh', ['auth', 'logout']);
  return result.success;
}

export async function repoExists(repoName) {
  const username = await getGhUsername();
  if (!username) return false;
  
  const result = await execCommand(`gh repo view ${username}/${repoName} --json name`);
  return result.success;
}

export async function createPrivateRepo(repoName = DEFAULT_REPO_NAME) {
  const result = await execCommand(`gh repo create ${repoName} --private --description "SyncAI configuration sync repository"`);
  return result.success;
}

export async function cloneRepo(repoName, targetDir) {
  const username = await getGhUsername();
  const result = await execCommand(`gh repo clone ${username}/${repoName} "${targetDir}"`);
  return result.success;
}

export async function getRepoUrl(repoName) {
  const username = await getGhUsername();
  if (!username) return null;
  return `https://github.com/${username}/${repoName}`;
}

export async function pushToRepo(localDir, message = 'Update configurations', force = false) {
  const addResult = await execCommand('git add -A', { cwd: localDir });
  if (!addResult.success) {
    return { success: false, error: addResult.stderr };
  }
  
  const commitResult = await execCommand(`git commit -m "${message}"`, { cwd: localDir });
  if (!commitResult.success) {
    if (commitResult.stdout?.includes('nothing to commit') || 
        commitResult.stderr?.includes('nothing to commit')) {
      return { success: true, noChanges: true };
    }
    return { success: false, error: commitResult.stderr };
  }
  
  const pushCmd = force ? 'git push origin main --force' : 'git push origin main';
  const pushResult = await execCommand(pushCmd, { cwd: localDir });
  if (!pushResult.success) {
    return { success: false, error: pushResult.stderr };
  }
  
  return { success: true };
}

export async function pullFromRepo(localDir) {
  const result = await execCommand('git pull origin main', { cwd: localDir });
  return result;
}

export async function getRepoStatus(localDir) {
  const result = await execCommand('git status --porcelain', { cwd: localDir });
  if (result.success) {
    const files = result.stdout.split('\n').filter(Boolean).map(line => ({
      status: line.slice(0, 2).trim(),
      path: line.slice(3)
    }));
    return { success: true, files, hasChanges: files.length > 0 };
  }
  return { success: false, files: [], hasChanges: false };
}

export async function getCommitHistory(localDir, limit = 10) {
  const result = await execCommand(
    `git log --oneline -n ${limit} --format="%h|%s|%ci|%an"`,
    { cwd: localDir }
  );
  
  if (result.success && result.stdout) {
    return result.stdout.split('\n').filter(Boolean).map(line => {
      const [hash, message, date, author] = line.split('|');
      return { hash, message, date, author };
    });
  }
  return [];
}

export async function checkoutCommit(localDir, commitHash) {
  const result = await execCommand(`git checkout ${commitHash}`, { cwd: localDir });
  return result.success;
}

export async function initLocalRepo(localDir) {
  const config = await loadConfig();
  const username = config.github?.username || await getGhUsername();
  const repoName = config.github?.repo || DEFAULT_REPO_NAME;
  
  const commands = [
    'git init',
    `git remote add origin https://github.com/${username}/${repoName}.git`,
    'git branch -M main'
  ];
  
  for (const cmd of commands) {
    const result = await execCommand(cmd, { cwd: localDir });
    if (!result.success && !result.stderr.includes('already exists')) {
      return { success: false, error: result.stderr };
    }
  }
  return { success: true };
}

export async function setupGithub() {
  if (!await isGhInstalled()) {
    return { success: false, error: 'gh_not_installed' };
  }
  
  if (!await isGhAuthenticated()) {
    return { success: false, error: 'gh_not_authenticated' };
  }
  
  const username = await getGhUsername();
  if (!username) {
    return { success: false, error: 'cannot_get_username' };
  }
  
  await updateConfig({
    github: {
      username,
      lastAuthCheck: new Date().toISOString()
    }
  });
  
  return { success: true, username };
}

export function getGhInstallCommands() {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    return [
      { command: 'brew install gh', recommended: true },
      { command: 'port install gh', recommended: false }
    ];
  }
  
  if (platform === 'linux') {
    return [
      { command: 'brew install gh', recommended: true },
      { command: 'sudo apt install gh', recommended: false },
      { command: 'sudo dnf install gh', recommended: false },
      { command: 'sudo pacman -S github-cli', recommended: false }
    ];
  }
  
  if (platform === 'win32') {
    return [
      { command: 'winget install --id GitHub.cli', recommended: true },
      { command: 'choco install gh', recommended: false },
      { command: 'scoop install gh', recommended: false }
    ];
  }
  
  return [];
}
