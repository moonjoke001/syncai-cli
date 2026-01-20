import chalk from 'chalk';
import * as logger from '../utils/logger.js';
import { getToolDefinitions, registerTool, unregisterTool, isBuiltInTool, listToolNames } from '../tools/index.js';
import { pathExists, readJson, getPluginsDir, ensureDir, writeJson, remove } from '../utils/fs.js';
import path from 'path';

export async function run(args) {
  const [action, ...rest] = args;
  
  if (!action || action === 'list') {
    await handleList();
    return;
  }
  
  if (action === 'add') {
    await handleAdd(rest[0]);
    return;
  }
  
  if (action === 'remove') {
    await handleRemove(rest[0]);
    return;
  }
  
  if (action === 'show') {
    await handleShow(rest[0]);
    return;
  }
  
  console.log('');
  console.log('用法:');
  console.log(`  ${chalk.yellow('aiplugin list')}           列出所有工具`);
  console.log(`  ${chalk.yellow('aiplugin add <file>')}     添加自定义工具`);
  console.log(`  ${chalk.yellow('aiplugin remove <name>')}  移除自定义工具`);
  console.log(`  ${chalk.yellow('aiplugin show <name>')}    显示工具详情`);
  console.log('');
}

async function handleList() {
  console.log('');
  console.log(chalk.bold('已注册的工具:'));
  console.log('');
  
  const tools = getToolDefinitions();
  
  const builtIn = [];
  const custom = [];
  
  for (const [name, def] of Object.entries(tools)) {
    if (isBuiltInTool(name)) {
      builtIn.push({ name, ...def });
    } else {
      custom.push({ name, ...def });
    }
  }
  
  console.log(chalk.cyan('内置工具:'));
  for (const tool of builtIn) {
    console.log(`  ${chalk.green('●')} ${chalk.bold(tool.name)} - ${tool.displayName || tool.name}`);
    console.log(`    ${chalk.gray('配置目录:')} ${tool.defaultConfigDir}`);
  }
  
  if (custom.length > 0) {
    console.log('');
    console.log(chalk.cyan('自定义工具:'));
    for (const tool of custom) {
      console.log(`  ${chalk.yellow('●')} ${chalk.bold(tool.name)} - ${tool.displayName || tool.name}`);
      console.log(`    ${chalk.gray('配置目录:')} ${tool.defaultConfigDir}`);
    }
  }
  
  console.log('');
}

async function handleAdd(filePath) {
  if (!filePath) {
    logger.error('请指定工具定义文件路径');
    return;
  }
  
  console.log('');
  
  if (!await pathExists(filePath)) {
    logger.error(`文件不存在: ${filePath}`);
    return;
  }
  
  try {
    const toolDef = await import(path.resolve(filePath));
    const def = toolDef.default || toolDef;
    
    if (!def.name) {
      logger.error('工具定义缺少 name 字段');
      return;
    }
    
    if (isBuiltInTool(def.name)) {
      logger.error(`不能覆盖内置工具: ${def.name}`);
      return;
    }
    
    const pluginsDir = getPluginsDir();
    await ensureDir(pluginsDir);
    
    const destPath = path.join(pluginsDir, `${def.name}.json`);
    await writeJson(destPath, def);
    
    registerTool(def);
    
    logger.success(`已添加工具: ${def.name}`);
    console.log(`  配置目录: ${def.defaultConfigDir}`);
    console.log(`  同步路径: ${(def.syncPaths || []).join(', ')}`);
  } catch (e) {
    logger.error(`加载失败: ${e.message}`);
  }
  
  console.log('');
}

async function handleRemove(name) {
  if (!name) {
    logger.error('请指定工具名称');
    return;
  }
  
  console.log('');
  
  if (isBuiltInTool(name)) {
    logger.error(`不能移除内置工具: ${name}`);
    return;
  }
  
  const tools = listToolNames();
  if (!tools.includes(name)) {
    logger.error(`工具不存在: ${name}`);
    return;
  }
  
  const pluginsDir = getPluginsDir();
  const pluginPath = path.join(pluginsDir, `${name}.json`);
  
  if (await pathExists(pluginPath)) {
    await remove(pluginPath);
  }
  
  unregisterTool(name);
  
  logger.success(`已移除工具: ${name}`);
  console.log('');
}

async function handleShow(name) {
  if (!name) {
    logger.error('请指定工具名称');
    return;
  }
  
  console.log('');
  
  const tools = getToolDefinitions();
  const tool = tools[name];
  
  if (!tool) {
    logger.error(`工具不存在: ${name}`);
    return;
  }
  
  console.log(chalk.bold(`工具: ${name}`));
  console.log('');
  console.log(`  显示名称: ${tool.displayName || name}`);
  console.log(`  类型: ${isBuiltInTool(name) ? '内置' : '自定义'}`);
  console.log(`  可执行文件: ${(tool.binNames || []).join(', ')}`);
  console.log(`  配置目录: ${tool.defaultConfigDir}`);
  console.log(`  同步路径:`);
  for (const p of tool.syncPaths || []) {
    console.log(`    - ${p}`);
  }
  if (tool.ignore && tool.ignore.length > 0) {
    console.log(`  忽略规则:`);
    for (const p of tool.ignore) {
      console.log(`    - ${p}`);
    }
  }
  
  console.log('');
}
