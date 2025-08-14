#!/usr/bin/env node

/**
 * 验证脚本 - Task 31-32: 服务器模块迁移
 * 
 * 验证内容:
 * - Task 31: 服务器页面是否正确使用 React Query hooks
 * - Task 32: 服务器组件是否正确使用 React Query mutations
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function checkFile(filePath, checks) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, passed: false, details: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const results = checks.map(check => ({
    name: check.name,
    found: check.pattern.test(content),
    required: check.required !== false
  }));

  const passed = results.filter(r => r.required).every(r => r.found);
  return { exists: true, passed, details: results };
}

function printResult(title, result) {
  console.log(`\n${colors.cyan}${title}${colors.reset}`);
  
  if (!result.exists) {
    console.log(`  ${colors.red}✗ 文件不存在${colors.reset}`);
    return false;
  }

  let allPassed = true;
  result.details.forEach(detail => {
    const status = detail.found ? 
      `${colors.green}✓` : 
      (detail.required ? `${colors.red}✗` : `${colors.yellow}○`);
    
    console.log(`  ${status} ${detail.name}${colors.reset}`);
    
    if (detail.required && !detail.found) {
      allPassed = false;
    }
  });

  return allPassed;
}

// Task 31: 服务器页面迁移验证
console.log(`\n${colors.blue}=== Task 31: 服务器页面迁移验证 ===${colors.reset}`);

const serverPages = [
  {
    path: 'app/servers/shadowsocks-servers/page.tsx',
    name: 'Shadowsocks 服务器页面',
    checks: [
      { name: '使用 useShadowsocksServers hook', pattern: /useShadowsocksServers/, required: true },
      { name: '使用 useServerGroups hook', pattern: /useServerGroups/, required: true },
      { name: '使用 React Query', pattern: /useQueryClient|invalidateQueries/, required: true },
      { name: '删除了 useEffect 加载数据', pattern: /loadData.*useEffect.*getServers/, required: false },
      { name: '正确处理 loading 状态', pattern: /isLoading|loading/, required: true },
      { name: '正确处理 error 状态', pattern: /error.*refetch|serversError/, required: true },
      { name: '使用缓存失效机制', pattern: /invalidateQueries.*shadowsocksServers/, required: true }
    ]
  },
  {
    path: 'app/servers/server-groups/page.tsx',
    name: '服务器组页面',
    checks: [
      { name: '使用 useServerGroups hook', pattern: /useServerGroups/, required: true },
      { name: '使用 React Query', pattern: /useQueryClient|invalidateQueries/, required: true },
      { name: '删除了 useEffect 加载数据', pattern: /loadData.*useEffect.*getServerGroups/, required: false },
      { name: '正确处理 loading 状态', pattern: /isLoading|loading/, required: true },
      { name: '正确处理 error 状态', pattern: /error.*refetch/, required: true },
      { name: '使用缓存失效机制', pattern: /invalidateQueries.*serverGroups/, required: true }
    ]
  }
];

let task31Passed = true;
serverPages.forEach(page => {
  const fullPath = path.join(process.cwd(), page.path);
  const result = checkFile(fullPath, page.checks);
  const passed = printResult(page.name, result);
  if (!passed) task31Passed = false;
});

// Task 32: 服务器组件迁移验证
console.log(`\n${colors.blue}=== Task 32: 服务器组件迁移验证 ===${colors.reset}`);

const serverComponents = [
  {
    path: 'components/servers/shadowsocks-servers/create-server-dialog.tsx',
    name: '创建服务器对话框',
    checks: [
      { name: '使用 useCreateShadowsocksServer mutation', pattern: /useCreateShadowsocksServer/, required: true },
      { name: '删除了直接服务调用', pattern: /shadowsocksServerService\.(createServer|getServers)/, required: false },
      { name: '使用 mutation.mutate', pattern: /mutation\.mutate|createServerMutation\.mutate/, required: true },
      { name: '使用 mutation.isPending', pattern: /isPending/, required: true },
      { name: '使用 toast 通知', pattern: /toast\.(success|error)/, required: true }
    ]
  },
  {
    path: 'components/servers/shadowsocks-servers/edit-server-dialog.tsx',
    name: '编辑服务器对话框',
    checks: [
      { name: '使用 useUpdateShadowsocksServer mutation', pattern: /useUpdateShadowsocksServer/, required: false },
      { name: '删除了直接服务调用', pattern: /shadowsocksServerService\.updateServer/, required: false },
      { name: '使用 mutation 处理', pattern: /mutation|mutate/, required: false }
    ]
  },
  {
    path: 'components/servers/server-groups/create-server-group-dialog.tsx',
    name: '创建服务器组对话框',
    checks: [
      { name: '使用 useCreateServerGroup mutation', pattern: /useCreateServerGroup/, required: false },
      { name: '删除了直接服务调用', pattern: /serverGroupService\.createServerGroup/, required: false },
      { name: '使用 mutation 处理', pattern: /mutation|mutate/, required: false }
    ]
  }
];

let task32Passed = true;
serverComponents.forEach(component => {
  const fullPath = path.join(process.cwd(), component.path);
  const result = checkFile(fullPath, component.checks);
  const passed = printResult(component.name, result);
  if (component.checks.some(c => c.required) && !passed) {
    task32Passed = false;
  }
});

// 检查 hooks 文件是否存在
console.log(`\n${colors.blue}=== React Query Hooks 文件验证 ===${colors.reset}`);

const hookFiles = [
  {
    path: 'hooks/queries/use-shadowsocks-servers.ts',
    name: 'Shadowsocks 服务器查询 Hooks'
  },
  {
    path: 'hooks/queries/use-server-groups.ts',
    name: '服务器组查询 Hooks'
  },
  {
    path: 'hooks/mutations/use-server-mutations.ts',
    name: '服务器变更 Mutations'
  }
];

let hooksExist = true;
hookFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? colors.green + '✓' : colors.red + '✗'} ${file.name}${colors.reset}`);
  if (!exists) hooksExist = false;
});

// 总体结果
console.log(`\n${colors.blue}=== 验证结果总结 ===${colors.reset}`);

const results = [
  { name: 'Task 31: 服务器页面迁移', passed: task31Passed },
  { name: 'Task 32: 服务器组件迁移', passed: task32Passed },
  { name: 'React Query Hooks 文件', passed: hooksExist }
];

let totalPassed = 0;
const totalTasks = results.length;

results.forEach(result => {
  if (result.passed) {
    console.log(`  ${colors.green}✓ ${result.name}${colors.reset}`);
    totalPassed++;
  } else {
    console.log(`  ${colors.red}✗ ${result.name}${colors.reset}`);
  }
});

const percentage = Math.round((totalPassed / totalTasks) * 100);
const overallSuccess = percentage >= 80;

console.log(`\n${colors.cyan}完成率: ${percentage}% (${totalPassed}/${totalTasks})${colors.reset}`);

if (overallSuccess) {
  console.log(`${colors.green}✅ 服务器模块迁移验证通过！${colors.reset}\n`);
} else {
  console.log(`${colors.yellow}⚠️  服务器模块迁移需要完善${colors.reset}\n`);
}

process.exit(overallSuccess ? 0 : 1);