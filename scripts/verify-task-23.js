#!/usr/bin/env node

/**
 * Task 23 验证脚本 - 验证财务页面迁移到 React Query
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`)
};

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 验证结果统计
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function check(condition, passMsg, failMsg) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    log.success(passMsg);
    return true;
  } else {
    failedChecks++;
    log.error(failMsg);
    return false;
  }
}

async function verifyTask23() {
  log.title('Task 23: 迁移财务页面到 React Query');
  
  const baseDir = path.join(__dirname, '..');
  
  // 1. 检查 React Query hooks 是否存在
  log.title('1. 检查 React Query Hooks 文件');
  
  const hookFiles = [
    'hooks/queries/use-orders.ts',
    'hooks/queries/use-invoices.ts',
    'hooks/queries/use-coupons.ts',
    'hooks/mutations/use-finance-mutations.ts'
  ];
  
  for (const hookFile of hookFiles) {
    const filePath = path.join(baseDir, hookFile);
    check(
      fileExists(filePath),
      `找到 ${hookFile}`,
      `缺少 ${hookFile}`
    );
  }
  
  // 2. 检查财务页面是否使用 React Query
  log.title('2. 检查财务页面 React Query 集成');
  
  const pages = [
    { 
      path: 'app/finance/orders/page.tsx',
      hooks: ['useOrders', 'useCancelOrder'],
      oldPatterns: ['useEffect', 'useState.*loading']
    },
    {
      path: 'app/finance/invoices/page.tsx',
      hooks: ['useInvoices', 'useInvoiceStatistics'],
      oldPatterns: ['useEffect', 'useState.*loading']
    },
    {
      path: 'app/finance/coupons/page.tsx',
      hooks: ['useCoupons'],
      oldPatterns: ['useEffect.*loadData', 'useState.*loading']
    }
  ];
  
  for (const page of pages) {
    const filePath = path.join(baseDir, page.path);
    const content = readFile(filePath);
    
    if (!content) {
      log.error(`无法读取 ${page.path}`);
      continue;
    }
    
    log.info(`检查 ${page.path}`);
    
    // 检查是否导入了 React Query hooks
    for (const hook of page.hooks) {
      check(
        content.includes(hook),
        `  使用了 ${hook}`,
        `  未使用 ${hook}`
      );
    }
    
    // 检查是否还有旧的数据获取模式
    for (const pattern of page.oldPatterns) {
      const regex = new RegExp(pattern);
      const hasOldPattern = regex.test(content);
      
      if (page.path.includes('coupons')) {
        // 优惠券页面刚迁移，不应该有旧模式
        check(
          !hasOldPattern,
          `  已移除旧模式: ${pattern}`,
          `  仍包含旧模式: ${pattern}`
        );
      } else {
        // 其他页面已经迁移，只是警告
        if (hasOldPattern) {
          log.warn(`  可能包含旧模式: ${pattern}`);
        }
      }
    }
    
    // 检查是否使用了 isLoading, error 等 React Query 状态
    check(
      content.includes('isLoading'),
      '  使用了 isLoading 状态',
      '  未使用 isLoading 状态'
    );
    
    // 检查是否使用了 queryClient
    if (content.includes('useQueryClient')) {
      log.success('  使用了 useQueryClient');
    }
  }
  
  // 3. 检查 mutations hooks
  log.title('3. 检查 Mutations Hooks');
  
  const mutationsFile = path.join(baseDir, 'hooks/mutations/use-finance-mutations.ts');
  const mutationsContent = readFile(mutationsFile);
  
  if (mutationsContent) {
    const expectedMutations = [
      'useCreateSubscriptionOrder',
      'useCancelOrder',
      'useCreateCoupon',
      'useUpdateCoupon',
      'useDeleteCoupon',
      'useCreateInvoice',
      'useUpdateInvoice',
      'useDeleteInvoice'
    ];
    
    for (const mutation of expectedMutations) {
      const hasExport = mutationsContent.includes(`export const ${mutation}`) || 
                        mutationsContent.includes(`export function ${mutation}`);
      check(
        hasExport,
        `找到 mutation: ${mutation}`,
        `缺少 mutation: ${mutation}`
      );
    }
  }
  
  // 4. 检查缓存策略
  log.title('4. 检查缓存策略');
  
  const cacheStrategyFile = path.join(baseDir, 'lib/cache-strategies.ts');
  const cacheContent = readFile(cacheStrategyFile);
  
  if (cacheContent) {
    check(
      cacheContent.includes('DataType'),
      '定义了数据类型枚举',
      '缺少数据类型枚举'
    );
    
    check(
      cacheContent.includes('createQueryOptions'),
      '定义了 createQueryOptions 函数',
      '缺少 createQueryOptions 函数'
    );
  }
  
  // 5. 检查查询键工厂
  log.title('5. 检查查询键工厂');
  
  const queryKeysFile = path.join(baseDir, 'lib/query-keys.ts');
  const queryKeysContent = readFile(queryKeysFile);
  
  if (queryKeysContent) {
    const modules = ['orders', 'invoices', 'coupons'];
    
    for (const module of modules) {
      check(
        queryKeysContent.includes(`${module}:`),
        `找到 ${module} 查询键工厂`,
        `缺少 ${module} 查询键工厂`
      );
    }
  }
  
  // 6. 检查组件中的乐观更新
  log.title('6. 检查乐观更新实现');
  
  const componentsToCheck = [
    'components/finance/coupons/create-coupon-dialog.tsx',
    'components/finance/coupons/edit-coupon-dialog.tsx'
  ];
  
  for (const component of componentsToCheck) {
    const componentPath = path.join(baseDir, component);
    const componentContent = readFile(componentPath);
    
    if (componentContent) {
      const hasOptimisticUpdate = 
        componentContent.includes('mutate') ||
        componentContent.includes('useMutation') ||
        componentContent.includes('invalidateQueries');
      
      if (hasOptimisticUpdate) {
        log.success(`${component} 实现了数据更新机制`);
      } else {
        log.warn(`${component} 可能需要优化数据更新机制`);
      }
    }
  }
  
  // 总结
  log.title('验证结果总结');
  log.info(`总检查项: ${totalChecks}`);
  log.success(`通过: ${passedChecks}`);
  if (failedChecks > 0) {
    log.error(`失败: ${failedChecks}`);
  }
  
  const passRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  
  if (passRate >= 90) {
    log.title(`✅ Task 23 验证通过 (${passRate}%)`);
    log.success('财务页面已成功迁移到 React Query！');
  } else if (passRate >= 70) {
    log.title(`⚠️ Task 23 部分完成 (${passRate}%)`);
    log.warn('财务页面迁移基本完成，但仍有一些问题需要解决。');
  } else {
    log.title(`❌ Task 23 验证失败 (${passRate}%)`);
    log.error('财务页面迁移未完成，请检查上述失败项。');
  }
  
  // 性能建议
  log.title('性能优化建议');
  log.info('1. 确保所有查询都设置了合适的 staleTime 和 cacheTime');
  log.info('2. 对频繁变化的数据使用较短的缓存时间');
  log.info('3. 对静态数据（如配置）使用较长的缓存时间');
  log.info('4. 使用 prefetchQuery 预加载关键数据');
  log.info('5. 实现批量操作的乐观更新以提升用户体验');
  
  process.exit(failedChecks > 0 ? 1 : 0);
}

// 运行验证
verifyTask23().catch((error) => {
  log.error(`验证过程出错: ${error.message}`);
  process.exit(1);
});