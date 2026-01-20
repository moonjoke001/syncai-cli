import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { detectCurrentEnvironment, getDetectionInfo } from '../lib/detector.js';

export async function run(args) {
  const verbose = args.includes('-v') || args.includes('--verbose');
  
  const result = await detectCurrentEnvironment();
  
  if (result.detected) {
    console.log('');
    logger.success(`当前环境: ${chalk.green.bold(result.tool)}`);
    
    if (verbose) {
      console.log('');
      console.log(`  检测方式: ${result.method}`);
      if (result.method === 'process') {
        console.log(`  进程名称: ${result.process}`);
      } else if (result.method === 'env') {
        console.log(`  环境变量: ${result.envVar}`);
      }
    }
  } else {
    console.log('');
    logger.warn('未检测到已知的 AI 工具环境');
    console.log('');
    console.log('可能的原因:');
    console.log('  - 不在 AI 工具的终端中运行');
    console.log('  - 工具未被识别');
    console.log('');
    console.log(`使用 ${chalk.yellow('aiscan')} 查看已安装的工具`);
  }
  
  if (verbose) {
    const info = await getDetectionInfo();
    console.log('');
    console.log(chalk.gray('已安装的工具:'), info.installed.join(', ') || '无');
    console.log(chalk.gray('支持的工具:'), info.all.join(', '));
  }
  
  console.log('');
}
