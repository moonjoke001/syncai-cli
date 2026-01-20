import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { confirm, input, selectInstallMethod } from '../utils/prompt.js';
import { ensureDir, getConfigDir } from '../utils/fs.js';
import { 
  loadConfig, 
  saveConfig, 
  saveMappings,
  saveIgnore
} from '../lib/config.js';
import { 
  isGhInstalled, 
  isGhAuthenticated, 
  getGhUsername, 
  loginGh, 
  repoExists, 
  createPrivateRepo,
  getGhInstallCommands,
  getRepoUrl
} from '../lib/github.js';
import { scanAndSaveMappings } from '../lib/scanner.js';
import { execInteractive } from '../utils/exec.js';
import os from 'os';

const DEFAULT_REPO_NAME = 'syai';

let autoYes = false;

export async function run(args) {
  autoYes = args.includes('--yes') || args.includes('-y');
  
  console.log('');
  console.log(chalk.cyan.bold('🔍 检查环境...'));
  console.log('');
  
  const ghStatus = await checkGitHubCli();
  if (!ghStatus.success) {
    return;
  }
  
  const repoStatus = await checkRepository(ghStatus.username);
  if (!repoStatus.success) {
    return;
  }
  
  await scanTools();
  
  await saveInitConfig(ghStatus.username, repoStatus.repoName);
  
  printSuccess(ghStatus.username, repoStatus.repoName);
}

async function autoConfirm(message, defaultValue = true) {
  if (autoYes) return defaultValue;
  return confirm(message, defaultValue);
}

async function autoInput(message, defaultValue) {
  if (autoYes) return defaultValue;
  return input(message, defaultValue);
}

async function checkGitHubCli() {
  logger.section('GitHub CLI');
  
  if (!await isGhInstalled()) {
    logger.error('未检测到 gh 命令');
    console.log('');
    console.log('请先安装 GitHub CLI:');
    
    const methods = getGhInstallCommands();
    const selected = await selectInstallMethod(methods);
    
    if (selected) {
      logger.startSpinner('正在安装 GitHub CLI...');
      const result = await execInteractive(selected.command, []);
      if (result.success) {
        logger.succeedSpinner('安装完成');
      } else {
        logger.failSpinner('安装失败，请手动安装');
        console.log('访问: https://cli.github.com');
        return { success: false };
      }
    } else {
      console.log('请手动安装后重新运行 aiinit');
      console.log('访问: https://cli.github.com');
      return { success: false };
    }
  } else {
    logger.success('已安装');
  }
  
  if (!await isGhAuthenticated()) {
    logger.warn('未登录 GitHub');
    console.log('');
    
    const shouldLogin = await autoConfirm('是否现在登录?', true);
    if (shouldLogin) {
      const loginSuccess = await loginGh();
      if (!loginSuccess) {
        logger.error('登录失败');
        return { success: false };
      }
      logger.success('登录成功');
    } else {
      logger.error('需要登录 GitHub 才能继续');
      return { success: false };
    }
  } else {
    const username = await getGhUsername();
    logger.success(`已登录为 ${chalk.green(username)}`);
    return { success: true, username };
  }
  
  const username = await getGhUsername();
  return { success: true, username };
}

async function checkRepository(username) {
  logger.section('仓库');
  
  const exists = await repoExists(DEFAULT_REPO_NAME);
  
  if (exists) {
    logger.success(`检测到已有仓库: ${chalk.green(`${username}/${DEFAULT_REPO_NAME}`)}`);
    console.log('');
    
    const shouldConnect = await autoConfirm('是否连接?', true);
    if (shouldConnect) {
      logger.success('已连接');
      return { success: true, repoName: DEFAULT_REPO_NAME };
    } else {
      const customName = await autoInput('请输入仓库名称:', '');
      if (!customName) {
        logger.error('需要仓库名称才能继续');
        return { success: false };
      }
      
      const customExists = await repoExists(customName);
      if (customExists) {
        logger.success(`已连接到 ${username}/${customName}`);
        return { success: true, repoName: customName };
      } else {
        const shouldCreate = await autoConfirm(`创建新仓库 ${customName}?`, true);
        if (shouldCreate) {
          logger.startSpinner(`正在创建 ${username}/${customName}...`);
          const created = await createPrivateRepo(customName);
          if (created) {
            logger.succeedSpinner('仓库创建成功');
            return { success: true, repoName: customName };
          } else {
            logger.failSpinner('创建失败');
            return { success: false };
          }
        }
        return { success: false };
      }
    }
  } else {
    logger.warn(`未检测到 ${DEFAULT_REPO_NAME} 仓库`);
    console.log('');
    
    const shouldCreate = await autoConfirm('创建私有仓库?', true);
    if (!shouldCreate) {
      logger.error('需要仓库才能继续');
      return { success: false };
    }
    
    const repoName = await autoInput('仓库名称:', DEFAULT_REPO_NAME);
    
    logger.startSpinner(`正在创建 ${username}/${repoName}...`);
    const created = await createPrivateRepo(repoName);
    
    if (created) {
      logger.succeedSpinner('仓库创建成功');
      return { success: true, repoName };
    } else {
      logger.failSpinner('创建失败');
      return { success: false };
    }
  }
}

async function scanTools() {
  logger.section('工具扫描');
  
  logger.startSpinner('正在扫描已安装的 AI 工具...');
  const mappings = await scanAndSaveMappings();
  logger.stopSpinner();
  
  const installed = Object.entries(mappings).filter(([_, d]) => d.installed);
  const notInstalled = Object.entries(mappings).filter(([_, d]) => !d.installed);
  
  for (const [name, data] of installed) {
    const method = data.installMethod ? ` (${data.installMethod})` : '';
    logger.success(`${name}${method} - ${data.configDir}`);
  }
  
  for (const [name] of notInstalled) {
    logger.step(`${chalk.gray(name)} - 未安装`);
  }
}

async function saveInitConfig(username, repoName) {
  await ensureDir(getConfigDir());
  
  const config = await loadConfig();
  config.github = {
    username,
    repo: repoName,
    branch: 'main',
    authMethod: 'gh-cli',
    lastAuthCheck: new Date().toISOString()
  };
  config.device = {
    id: `${os.hostname()}-${Date.now().toString(36)}`,
    name: os.hostname(),
    createdAt: new Date().toISOString()
  };
  config.initialized = true;
  config.initDate = new Date().toISOString();
  
  await saveConfig(config);
}

function printSuccess(username, repoName) {
  console.log('');
  logger.success('初始化完成！');
  console.log('');
  console.log(`配置已保存到: ${chalk.cyan('~/.config/syncai/')}`);
  console.log(`远程仓库: ${chalk.cyan(`https://github.com/${username}/${repoName}`)} ${chalk.gray('(私有)')}`);
  console.log('');
  console.log(chalk.bold('下一步:'));
  console.log(`  ${chalk.yellow('aipush')}    # 推送当前配置到云端`);
  console.log(`  ${chalk.yellow('aipull')}    # 从云端拉取配置`);
  console.log(`  ${chalk.yellow('aistatus')}  # 查看同步状态`);
  console.log('');
}
