import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { input, confirm } from '../utils/prompt.js';
import { loadConfig, updateConfig, loadMappings, updateMappings, isInitialized } from '../lib/config.js';
import { collapseHome } from '../utils/fs.js';

export async function run(args) {
  const [action, ...rest] = args;
  
  if (!action || action === 'show') {
    await showConfig();
    return;
  }
  
  if (action === 'get') {
    await getConfig(rest[0]);
    return;
  }
  
  if (action === 'set') {
    await setConfig(rest[0], rest.slice(1).join(' '));
    return;
  }
  
  if (action === 'reset') {
    await resetConfig(rest[0]);
    return;
  }
  
  if (action === 'edit') {
    console.log('');
    console.log(`配置文件位置: ${chalk.cyan('~/.config/syncai/config.json')}`);
    console.log(`映射文件位置: ${chalk.cyan('~/.config/syncai/mappings.json')}`);
    console.log('');
    return;
  }
  
  console.log('');
  console.log('用法:');
  console.log(`  ${chalk.yellow('aiconfig')}              显示所有配置`);
  console.log(`  ${chalk.yellow('aiconfig get <key>')}    获取配置值`);
  console.log(`  ${chalk.yellow('aiconfig set <key> <value>')}  设置配置值`);
  console.log(`  ${chalk.yellow('aiconfig reset <key>')} 重置配置值`);
  console.log(`  ${chalk.yellow('aiconfig edit')}         打开配置文件`);
  console.log('');
  console.log('示例:');
  console.log(`  ${chalk.gray('aiconfig set kiro.customConfigDir ~/my-kiro')}`);
  console.log(`  ${chalk.gray('aiconfig get github.repo')}`);
  console.log('');
}

async function showConfig() {
  const initialized = await isInitialized();
  
  console.log('');
  console.log(chalk.bold('配置状态:'));
  console.log('');
  
  if (!initialized) {
    logger.warn('未初始化，请运行 aiinit');
    return;
  }
  
  const config = await loadConfig();
  const mappings = await loadMappings();
  
  console.log(chalk.cyan('[GitHub]'));
  console.log(`  用户名: ${config.github?.username || '未设置'}`);
  console.log(`  仓库: ${config.github?.repo || '未设置'}`);
  console.log(`  分支: ${config.github?.branch || 'main'}`);
  console.log('');
  
  console.log(chalk.cyan('[设备]'));
  console.log(`  ID: ${config.device?.id || '未设置'}`);
  console.log(`  名称: ${config.device?.name || '未设置'}`);
  console.log('');
  
  console.log(chalk.cyan('[工具配置]'));
  for (const [name, data] of Object.entries(mappings)) {
    if (data.installed) {
      const configDir = data.customConfigDir || data.configDir;
      console.log(`  ${name}: ${collapseHome(configDir)}`);
      if (data.customConfigDir) {
        console.log(`    ${chalk.gray('(自定义路径)')}`);
      }
    }
  }
  console.log('');
}

async function getConfig(key) {
  if (!key) {
    logger.error('请指定配置键');
    return;
  }
  
  const config = await loadConfig();
  const mappings = await loadMappings();
  
  const parts = key.split('.');
  let value;
  
  if (parts[0] in mappings) {
    value = getNestedValue(mappings, parts);
  } else {
    value = getNestedValue(config, parts);
  }
  
  console.log('');
  if (value !== undefined) {
    console.log(`${key} = ${JSON.stringify(value)}`);
  } else {
    console.log(`${key} 未设置`);
  }
  console.log('');
}

async function setConfig(key, value) {
  if (!key || value === undefined) {
    logger.error('用法: aiconfig set <key> <value>');
    return;
  }
  
  const parts = key.split('.');
  const mappings = await loadMappings();
  
  if (parts[0] in mappings) {
    const toolName = parts[0];
    const propName = parts[1];
    
    if (propName === 'customConfigDir') {
      await updateMappings(toolName, { customConfigDir: value });
      logger.success(`已设置 ${key} = ${value}`);
    } else {
      logger.error('只能设置 customConfigDir');
    }
  } else {
    const config = await loadConfig();
    setNestedValue(config, parts, value);
    await updateConfig(config);
    logger.success(`已设置 ${key} = ${value}`);
  }
  console.log('');
}

async function resetConfig(key) {
  if (!key) {
    logger.error('请指定配置键');
    return;
  }
  
  const parts = key.split('.');
  const mappings = await loadMappings();
  
  if (parts[0] in mappings && parts[1] === 'customConfigDir') {
    await updateMappings(parts[0], { customConfigDir: null });
    logger.success(`已重置 ${key}`);
  } else {
    logger.error('只能重置工具的 customConfigDir');
  }
  console.log('');
}

function getNestedValue(obj, parts) {
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function setNestedValue(obj, parts, value) {
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current)) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
