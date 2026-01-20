import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { isGhInstalled, isGhAuthenticated, getGhUsername, loginGh, logoutGh } from '../lib/github.js';
import { loadConfig } from '../lib/config.js';

export async function run(args) {
  const [action] = args;
  
  if (action === 'login') {
    await handleLogin();
    return;
  }
  
  if (action === 'logout') {
    await handleLogout();
    return;
  }
  
  if (!action || action === 'status') {
    await showStatus();
    return;
  }
  
  console.log('');
  console.log('用法:');
  console.log(`  ${chalk.yellow('aiauth status')}   检查授权状态`);
  console.log(`  ${chalk.yellow('aiauth login')}    登录 GitHub`);
  console.log(`  ${chalk.yellow('aiauth logout')}   登出 GitHub`);
  console.log('');
}

async function showStatus() {
  console.log('');
  console.log(chalk.bold('授权状态:'));
  console.log('');
  
  const ghInstalled = await isGhInstalled();
  if (!ghInstalled) {
    logger.error('GitHub CLI 未安装');
    console.log(`  运行 ${chalk.yellow('aiinit')} 安装并配置`);
    console.log('');
    return;
  }
  logger.success('GitHub CLI 已安装');
  
  const ghAuth = await isGhAuthenticated();
  if (!ghAuth) {
    logger.error('GitHub 未授权');
    console.log(`  运行 ${chalk.yellow('aiauth login')} 登录`);
    console.log('');
    return;
  }
  
  const username = await getGhUsername();
  logger.success(`已登录为 ${chalk.green(username)}`);
  
  const config = await loadConfig();
  if (config.github?.repo) {
    console.log('');
    console.log(`  仓库: ${chalk.cyan(`${username}/${config.github.repo}`)}`);
    if (config.github.lastAuthCheck) {
      const date = new Date(config.github.lastAuthCheck);
      console.log(`  上次检查: ${chalk.gray(date.toLocaleString())}`);
    }
  }
  
  console.log('');
}

async function handleLogin() {
  console.log('');
  
  const ghInstalled = await isGhInstalled();
  if (!ghInstalled) {
    logger.error('GitHub CLI 未安装');
    console.log(`  运行 ${chalk.yellow('aiinit')} 安装`);
    console.log('');
    return;
  }
  
  const ghAuth = await isGhAuthenticated();
  if (ghAuth) {
    const username = await getGhUsername();
    logger.warn(`已登录为 ${username}`);
    console.log(`  如需切换账号，请先运行 ${chalk.yellow('aiauth logout')}`);
    console.log('');
    return;
  }
  
  logger.info('正在启动 GitHub 登录...');
  const success = await loginGh();
  
  if (success) {
    const username = await getGhUsername();
    logger.success(`登录成功！已登录为 ${chalk.green(username)}`);
  } else {
    logger.error('登录失败');
  }
  
  console.log('');
}

async function handleLogout() {
  console.log('');
  
  const ghAuth = await isGhAuthenticated();
  if (!ghAuth) {
    logger.warn('当前未登录');
    console.log('');
    return;
  }
  
  const username = await getGhUsername();
  logger.info(`正在登出 ${username}...`);
  
  const success = await logoutGh();
  
  if (success) {
    logger.success('已登出');
  } else {
    logger.error('登出失败');
  }
  
  console.log('');
}
