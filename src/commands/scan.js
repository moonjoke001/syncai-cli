import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { scanAndSaveMappings, getInstalledTools } from '../lib/scanner.js';
import { isInitialized } from '../lib/config.js';

export async function run(args) {
  const initialized = await isInitialized();
  if (!initialized) {
    logger.warn('请先运行 aiinit 初始化');
    return;
  }
  
  console.log('');
  logger.startSpinner('正在扫描已安装的 AI 工具...');
  
  const mappings = await scanAndSaveMappings();
  
  logger.stopSpinner();
  
  console.log('');
  console.log(chalk.bold('扫描结果:'));
  console.log('');
  
  const entries = Object.entries(mappings);
  const installed = entries.filter(([_, d]) => d.installed);
  const notInstalled = entries.filter(([_, d]) => !d.installed);
  
  if (installed.length > 0) {
    console.log(chalk.green('已安装:'));
    for (const [name, data] of installed) {
      const method = data.installMethod ? chalk.gray(` (${data.installMethod})`) : '';
      const configExists = data.configDirExists ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(`  ${configExists} ${chalk.bold(name)}${method}`);
      console.log(`    ${chalk.gray('路径:')} ${data.binPath}`);
      console.log(`    ${chalk.gray('配置:')} ${data.configDir}`);
    }
  }
  
  if (notInstalled.length > 0) {
    console.log('');
    console.log(chalk.gray('未安装:'));
    for (const [name] of notInstalled) {
      console.log(`  ${chalk.gray('○')} ${chalk.gray(name)}`);
    }
  }
  
  console.log('');
  logger.success(`共检测到 ${installed.length} 个已安装的工具`);
  console.log('');
}
