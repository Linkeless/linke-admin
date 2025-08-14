#!/usr/bin/env node

/**
 * Task 24 验证脚本 - 验证财务组件迁移到 React Query
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

async function verifyTask24() {
  log.title('Task 24: 迁移财务组件到 React Query');
  
  const baseDir = path.join(__dirname, '..');
  
  // 1. 检查财务组件目录结构
  log.title('1. 检查财务组件目录结构');
  
  const financeComponentDir = path.join(baseDir, 'components/finance');
  check(
    fileExists(financeComponentDir),
    '财务组件目录存在',
    '财务组件目录不存在'
  );
  
  // 2. 检查优惠券相关组件
  log.title('2. 检查优惠券组件 React Query 集成');
  
  const couponComponents = [
    'components/finance/coupons/create-coupon-dialog.tsx',
    'components/finance/coupons/edit-coupon-dialog.tsx',
    'components/finance/coupons/coupon-form.tsx'
  ];
  
  for (const component of couponComponents) {
    const filePath = path.join(baseDir, component);
    const content = readFile(filePath);
    
    if (!content) {
      log.error(`无法读取 ${component}`);
      continue;
    }
    
    log.info(`检查 ${component}`);
    
    // 检查是否使用了 React Query mutations
    const hasMutations = content.includes('useCreateCoupon') || 
                         content.includes('useUpdateCoupon') ||
                         content.includes('useDeleteCoupon');
    
    check(
      hasMutations,
      `  使用了 React Query mutations`,
      `  未使用 React Query mutations`
    );
    
    // 检查是否有旧的数据获取模式
    const hasOldPattern = /useEffect.*fetch|useState.*loading.*=.*true/.test(content);
    check(
      !hasOldPattern,
      `  已移除旧的数据获取模式`,
      `  仍包含旧的数据获取模式`
    );
  }
  
  // 3. 检查订单相关组件
  log.title('3. 检查订单组件 React Query 集成');
  
  const orderComponents = [
    'components/finance/orders/order-stats-cards.tsx',
    'components/finance/orders/order-filters.tsx'
  ];
  
  for (const component of orderComponents) {
    const filePath = path.join(baseDir, component);
    const content = readFile(filePath);
    
    if (!content) {
      log.error(`无法读取 ${component}`);
      continue;
    }
    
    log.info(`检查 ${component}`);
    
    if (component.includes('order-stats-cards')) {
      // 统计卡片应该使用查询hooks
      check(
        content.includes('useOrderAnalytics'),
        `  使用了 useOrderAnalytics hook`,
        `  未使用 useOrderAnalytics hook`
      );
      
      check(
        content.includes('isLoading'),
        `  使用了 isLoading 状态`,
        `  未使用 isLoading 状态`
      );
    }
    
    // 检查是否有旧的数据获取模式
    const hasOldPattern = /useEffect.*fetch|useState.*loading.*=.*true/.test(content);
    check(
      !hasOldPattern,
      `  已移除旧的数据获取模式`,
      `  仍包含旧的数据获取模式`
    );
  }
  
  // 4. 检查发票相关组件
  log.title('4. 检查发票组件 React Query 集成');
  
  const invoiceActionsPath = path.join(baseDir, 'app/finance/invoices/components/invoice-actions.tsx');
  const invoiceActionsContent = readFile(invoiceActionsPath);
  
  if (invoiceActionsContent) {
    log.info('检查 invoice-actions.tsx');
    
    const invoiceMutations = [
      'useMarkInvoicePaid',
      'useMarkInvoiceVoid',
      'useSendInvoice'
    ];
    
    for (const mutation of invoiceMutations) {
      check(
        invoiceActionsContent.includes(mutation),
        `  使用了 ${mutation}`,
        `  未使用 ${mutation}`
      );
    }
    
    // 检查是否有旧的数据获取模式
    const hasOldPattern = /useEffect.*fetch|useState.*loading.*=.*true/.test(invoiceActionsContent);
    check(
      !hasOldPattern,
      `  已移除旧的数据获取模式`,
      `  仍包含旧的数据获取模式`
    );
  }
  
  // 5. 检查错误处理组件
  log.title('5. 检查错误处理组件');
  
  const errorHandlingComponents = [
    'components/finance/error-boundary.tsx',
    'components/finance/use-finance-error-handler.tsx'
  ];
  
  for (const component of errorHandlingComponents) {
    const filePath = path.join(baseDir, component);
    check(
      fileExists(filePath),
      `找到 ${component}`,
      `缺少 ${component}`
    );
    
    const content = readFile(filePath);
    if (content) {
      // 错误边界组件应该是纯组件，不应该有数据获取
      const hasDataFetching = /useQuery|useMutation|useEffect.*fetch/.test(content);
      check(
        !hasDataFetching,
        `  ${component} 是纯组件（无数据获取）`,
        `  ${component} 包含数据获取逻辑`
      );
    }
  }
  
  // 6. 检查组件导出
  log.title('6. 检查组件导出');
  
  const indexPath = path.join(baseDir, 'components/finance/index.ts');
  const indexContent = readFile(indexPath);
  
  if (indexContent) {
    const expectedExports = [
      'FinanceErrorBoundary',
      'withFinanceErrorBoundary',
      'FinanceDataError',
      'FinanceDataEmpty'
    ];
    
    for (const exportName of expectedExports) {
      check(
        indexContent.includes(exportName),
        `导出了 ${exportName}`,
        `未导出 ${exportName}`
      );
    }
  }
  
  // 7. 检查组件中的乐观更新
  log.title('7. 检查乐观更新实现');
  
  const componentsWithMutations = [
    'components/finance/coupons/create-coupon-dialog.tsx',
    'components/finance/coupons/edit-coupon-dialog.tsx'
  ];
  
  for (const component of componentsWithMutations) {
    const filePath = path.join(baseDir, component);
    const content = readFile(filePath);
    
    if (content) {
      const hasMutationHandling = 
        content.includes('onSuccess') ||
        content.includes('isPending') ||
        content.includes('isLoading');
      
      if (hasMutationHandling) {
        log.success(`${component} 实现了变更状态处理`);
      } else {
        log.warn(`${component} 可能需要改进变更状态处理`);
      }
    }
  }
  
  // 8. 检查类型安全
  log.title('8. 检查类型安全');
  
  const componentsToCheck = [
    'components/finance/coupons/coupon-form.tsx',
    'components/finance/orders/order-filters.tsx'
  ];
  
  for (const component of componentsToCheck) {
    const filePath = path.join(baseDir, component);
    const content = readFile(filePath);
    
    if (content) {
      // 检查是否有类型定义
      const hasTypeDefinitions = 
        content.includes('interface') ||
        content.includes('type ') ||
        content.includes(': ');
      
      check(
        hasTypeDefinitions,
        `${component} 包含类型定义`,
        `${component} 缺少类型定义`
      );
      
      // 检查是否使用了any类型
      const hasAnyType = /:\s*any\b/.test(content);
      if (hasAnyType) {
        log.warn(`${component} 使用了 any 类型，建议改进`);
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
    log.title(`✅ Task 24 验证通过 (${passRate}%)`);
    log.success('财务组件已成功迁移到 React Query！');
  } else if (passRate >= 70) {
    log.title(`⚠️ Task 24 部分完成 (${passRate}%)`);
    log.warn('财务组件迁移基本完成，但仍有一些问题需要解决。');
  } else {
    log.title(`❌ Task 24 验证失败 (${passRate}%)`);
    log.error('财务组件迁移未完成，请检查上述失败项。');
  }
  
  // 最佳实践建议
  log.title('最佳实践建议');
  log.info('1. 确保所有数据获取组件都使用 React Query hooks');
  log.info('2. 移除所有 useEffect + useState 的数据获取模式');
  log.info('3. 使用 mutations 的 isPending 状态替代手动 loading 状态');
  log.info('4. 利用 onSuccess/onError 回调处理操作结果');
  log.info('5. 确保错误处理组件保持为纯组件');
  log.info('6. 使用 TypeScript 严格类型定义避免 any 类型');
  
  process.exit(failedChecks > 0 ? 1 : 0);
}

// 运行验证
verifyTask24().catch((error) => {
  log.error(`验证过程出错: ${error.message}`);
  process.exit(1);
});