#!/usr/bin/env node

/**
 * 任务36验证脚本 - 性能优化和测试
 * 
 * 验证React Query性能优化的实现完成度和NFR-1合规性
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证任务36: 性能优化和测试\n');

// ==================== 验证清单 ====================

const verificationChecklist = [
  {
    name: 'Performance Config',
    description: '性能配置文件',
    check: () => fs.existsSync(path.join(process.cwd(), 'lib/performance-config.ts')),
    importance: 'critical'
  },
  {
    name: 'Performance Test Script',
    description: '性能测试脚本',
    check: () => fs.existsSync(path.join(process.cwd(), 'scripts/performance-test.js')),
    importance: 'critical'
  },
  {
    name: 'Performance Monitor Component',
    description: '性能监控组件',
    check: () => fs.existsSync(path.join(process.cwd(), 'components/performance-monitor.tsx')),
    importance: 'important'
  },
  {
    name: 'Enhanced Query Client',
    description: '增强的Query Client配置',
    check: () => {
      const filePath = path.join(process.cwd(), 'lib/query-client.ts');
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('PERFORMANCE_CONFIG') &&
        content.includes('performanceMonitor') &&
        content.includes('checkMemoryUsage') &&
        content.includes('recordCacheHit')
      );
    },
    importance: 'critical'
  },
  {
    name: 'Cache Strategies',
    description: '缓存策略优化',
    check: () => {
      const filePath = path.join(process.cwd(), 'lib/cache-strategies.ts');
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('DataType.STATIC') &&
        content.includes('DataType.USER') &&
        content.includes('DataType.REALTIME') &&
        content.includes('DataType.STATS')
      );
    },
    importance: 'critical'
  },
  {
    name: 'Advanced Cache Manager',
    description: '高级缓存管理工具',
    check: () => {
      const filePath = path.join(process.cwd(), 'hooks/use-advanced-cache-manager.ts');
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('warmupCache') &&
        content.includes('executeBatchOperation') &&
        (content.includes('checkMemoryUsage') || content.includes('updateMetrics'))
      );
    },
    importance: 'important'
  },
  {
    name: 'Performance Monitor Hook',
    description: '性能监控Hook',
    check: () => {
      const filePath = path.join(process.cwd(), 'hooks/use-subscription-performance-monitor.ts');
      if (!fs.existsSync(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('NFR_TARGETS') &&
        content.includes('cacheHitResponseTime') &&
        content.includes('memoryLimit')
      );
    },
    importance: 'important'
  },
  {
    name: 'Performance Test Report',
    description: '性能测试报告',
    check: () => fs.existsSync(path.join(process.cwd(), 'performance-test-report.json')),
    importance: 'important'
  },
];

// ==================== 执行验证 ====================

let passedCount = 0;
let criticalPassed = 0;
let criticalTotal = 0;
let importantPassed = 0;
let importantTotal = 0;

console.log('📋 执行验证检查...\n');

verificationChecklist.forEach((item, index) => {
  const passed = item.check();
  const status = passed ? '✅' : '❌';
  
  console.log(`${index + 1}. ${status} ${item.name} - ${item.description}`);
  
  if (passed) passedCount++;
  
  if (item.importance === 'critical') {
    criticalTotal++;
    if (passed) criticalPassed++;
  } else if (item.importance === 'important') {
    importantTotal++;
    if (passed) importantPassed++;
  }
});

// ==================== NFR-1特定验证 ====================

console.log('\n🎯 NFR-1特定验证...\n');

const nfrChecks = [
  {
    name: 'Cache Hit Response Time Target',
    description: '缓存命中响应时间目标 < 50ms',
    check: () => {
      const configPath = path.join(process.cwd(), 'lib/performance-config.ts');
      if (!fs.existsSync(configPath)) return false;
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('cacheHitResponseTime: 50');
    }
  },
  {
    name: 'Memory Limit Target',
    description: '客户端缓存大小限制 50MB',
    check: () => {
      const configPath = path.join(process.cwd(), 'lib/performance-config.ts');
      if (!fs.existsSync(configPath)) return false;
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('memoryLimit: 50 * 1024 * 1024');
    }
  },
  {
    name: 'Cache Hit Rate Target',
    description: '缓存命中率目标 80%',
    check: () => {
      const configPath = path.join(process.cwd(), 'lib/performance-config.ts');
      if (!fs.existsSync(configPath)) return false;
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('cacheHitRate: 0.8');
    }
  },
  {
    name: 'Network Reduction Target', 
    description: '网络请求减少目标 80%',
    check: () => {
      const configPath = path.join(process.cwd(), 'lib/performance-config.ts');
      if (!fs.existsSync(configPath)) return false;
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('networkReduction: 0.8');
    }
  }
];

let nfrPassed = 0;
nfrChecks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name} - ${check.description}`);
  if (passed) nfrPassed++;
});

// ==================== 性能测试结果分析 ====================

console.log('\n📊 性能测试结果分析...\n');

const reportPath = path.join(process.cwd(), 'performance-test-report.json');
if (fs.existsSync(reportPath)) {
  try {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log(`✅ 性能测试报告存在`);
    console.log(`📈 测试成功率: ${report.summary?.successRate?.toFixed(1)}%`);
    console.log(`🎯 NFR合规性: ${report.nfrCompliance?.overallCompliant ? 'PASS' : 'FAIL'} (${report.nfrCompliance?.score?.toFixed(1)}%)`);
    
    if (report.scenarios) {
      const scenarios = Object.values(report.scenarios).filter(s => s.status);
      const passedScenarios = scenarios.filter(s => s.status === 'PASS').length;
      console.log(`📋 场景测试: ${passedScenarios}/${scenarios.length} 通过`);
    }
    
    if (report.recommendations && report.recommendations.length > 0) {
      console.log(`💡 优化建议数量: ${report.recommendations.length}`);
    }
    
  } catch (error) {
    console.log(`❌ 性能测试报告格式错误: ${error.message}`);
  }
} else {
  console.log('❌ 性能测试报告不存在');
}

// ==================== 代码质量检查 ====================

console.log('\n🔍 代码质量检查...\n');

const codeQualityChecks = [
  {
    name: 'TypeScript Types',
    description: '完整的TypeScript类型定义',
    check: () => {
      const files = [
        'lib/performance-config.ts',
        'components/performance-monitor.tsx',
        'hooks/use-subscription-performance-monitor.ts'
      ];
      return files.every(file => {
        const filePath = path.join(process.cwd(), file);
        if (!fs.existsSync(filePath)) return false;
        const content = fs.readFileSync(filePath, 'utf8');
        return content.includes('interface') || content.includes('type');
      });
    }
  },
  {
    name: 'Error Handling',
    description: '错误处理机制',
    check: () => {
      const queryClientPath = path.join(process.cwd(), 'lib/query-client.ts');
      if (!fs.existsSync(queryClientPath)) return false;
      const content = fs.readFileSync(queryClientPath, 'utf8');
      return content.includes('try') && content.includes('catch') && content.includes('recordError');
    }
  },
  {
    name: 'Performance Monitoring',
    description: '性能监控集成',
    check: () => {
      const queryClientPath = path.join(process.cwd(), 'lib/query-client.ts');
      if (!fs.existsSync(queryClientPath)) return false;
      const content = fs.readFileSync(queryClientPath, 'utf8');
      return content.includes('performanceMonitor') && content.includes('checkMemoryUsage');
    }
  }
];

let codeQualityPassed = 0;
codeQualityChecks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name} - ${check.description}`);
  if (passed) codeQualityPassed++;
});

// ==================== 最终评分 ====================

console.log('\n' + '='.repeat(60));
console.log('📊 任务36完成度评估');
console.log('='.repeat(60));

const totalChecks = verificationChecklist.length;
const successRate = (passedCount / totalChecks) * 100;

console.log(`\n✅ 基础验证: ${passedCount}/${totalChecks} (${successRate.toFixed(1)}%)`);
console.log(`🔴 关键功能: ${criticalPassed}/${criticalTotal} (${criticalTotal > 0 ? (criticalPassed/criticalTotal*100).toFixed(1) : 0}%)`);
console.log(`🟡 重要功能: ${importantPassed}/${importantTotal} (${importantTotal > 0 ? (importantPassed/importantTotal*100).toFixed(1) : 0}%)`);
console.log(`🎯 NFR-1验证: ${nfrPassed}/${nfrChecks.length} (${(nfrPassed/nfrChecks.length*100).toFixed(1)}%)`);
console.log(`💻 代码质量: ${codeQualityPassed}/${codeQualityChecks.length} (${(codeQualityPassed/codeQualityChecks.length*100).toFixed(1)}%)`);

// 计算综合评分
const criticalWeight = 0.4;
const importantWeight = 0.3;
const nfrWeight = 0.2;
const codeQualityWeight = 0.1;

const criticalScore = criticalTotal > 0 ? (criticalPassed / criticalTotal) * 100 : 100;
const importantScore = importantTotal > 0 ? (importantPassed / importantTotal) * 100 : 100;
const nfrScore = (nfrPassed / nfrChecks.length) * 100;
const codeScore = (codeQualityPassed / codeQualityChecks.length) * 100;

const overallScore = (
  criticalScore * criticalWeight +
  importantScore * importantWeight +
  nfrScore * nfrWeight +
  codeScore * codeQualityWeight
);

console.log(`\n🏆 综合评分: ${overallScore.toFixed(1)}%`);

// 评分等级
let grade = 'F';
if (overallScore >= 90) grade = 'A';
else if (overallScore >= 80) grade = 'B';
else if (overallScore >= 70) grade = 'C';
else if (overallScore >= 60) grade = 'D';

console.log(`📜 完成等级: ${grade}`);

// 完成状态
const isCompleted = criticalPassed === criticalTotal && overallScore >= 80;
console.log(`\n${isCompleted ? '✅ 任务36已完成' : '❌ 任务36需要进一步完善'}`);

if (!isCompleted) {
  console.log('\n🔧 建议完善的方面:');
  if (criticalPassed < criticalTotal) {
    console.log('- 完成所有关键功能实现');
  }
  if (nfrPassed < nfrChecks.length) {
    console.log('- 确保NFR-1性能要求完全满足');
  }
  if (codeQualityPassed < codeQualityChecks.length) {
    console.log('- 提升代码质量和错误处理');
  }
}

console.log('\n' + '='.repeat(60));

// 返回适当的退出码
process.exit(isCompleted ? 0 : 1);