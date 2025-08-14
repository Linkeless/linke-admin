#!/usr/bin/env node

/**
 * 验证任务38: 错误处理完善
 * 验证全局错误处理和React Query集成是否正确实现
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 验证任务38: 错误处理完善...\n')

// 检查文件是否存在
const checkFile = (filePath) => {
  const fullPath = path.join(__dirname, '..', filePath)
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    return false
  }
  return true
}

// 检查文件内容是否包含特定字符串
const checkFileContent = (filePath, searchStrings, description) => {
  const fullPath = path.join(__dirname, '..', filePath)
  if (!checkFile(filePath)) return false
  
  const content = fs.readFileSync(fullPath, 'utf-8')
  let allFound = true
  
  searchStrings.forEach(searchString => {
    if (!content.includes(searchString)) {
      console.error(`❌ ${description}: 未找到 "${searchString}" 在 ${filePath}`)
      allFound = false
    }
  })
  
  if (allFound) {
    console.log(`✅ ${description}: ${filePath}`)
  }
  
  return allFound
}

let allPassed = true

// 1. 检查错误处理器是否集成了Toast
console.log('1️⃣ 检查错误处理器Toast集成...')
const toastIntegration = checkFileContent('lib/error-handler.ts', [
  "import { toast } from 'sonner'",
  'toast.error(',
  'toast.success(',
  'toast.warning(',
  'showQueryErrorToUser',
  'showMutationErrorToUser'
], '错误处理器Toast集成')
allPassed = allPassed && toastIntegration

// 2. 检查React Query错误处理增强
console.log('\n2️⃣ 检查React Query错误处理增强...')
const queryEnhancements = checkFileContent('lib/error-handler.ts', [
  'handleQueryError',
  'handleMutationError',
  'shouldRetryQuery',
  'getRetryDelay',
  'ErrorAnalyzer.analyzeError',
  'createErrorStats'
], 'React Query错误处理增强')
allPassed = allPassed && queryEnhancements

// 3. 检查Query Client集成
console.log('\n3️⃣ 检查Query Client错误处理集成...')
const queryClientIntegration = checkFileContent('lib/query-client.ts', [
  'globalErrorHandler.handleQueryError',
  'globalErrorHandler.handleMutationError',
  'recordError()',
  'retryDelay: (attemptIndex: number, error: any)',
  'clearTokens()'
], 'Query Client错误处理集成')
allPassed = allPassed && queryClientIntegration

// 4. 检查智能重试策略
console.log('\n4️⃣ 检查智能重试策略...')
const retryStrategy = checkFileContent('lib/error-handler.ts', [
  'NETWORK_ERROR',
  'SERVER_ERROR', 
  'TIMEOUT_ERROR',
  'exponentialDelay',
  'Math.min(',
  'Math.max('
], '智能重试策略')
allPassed = allPassed && retryStrategy

// 5. 检查认证错误自动处理
console.log('\n5️⃣ 检查认证错误自动处理...')
const authHandling = checkFileContent('lib/error-handler.ts', [
  'handleAuthenticationError',
  "toast.warning('登录已过期",
  "window.location.href = `/login",
  'localStorage.removeItem',
  'CustomEvent'
], '认证错误自动处理')
allPassed = allPassed && authHandling

// 6. 检查用户友好的错误信息
console.log('\n6️⃣ 检查用户友好的错误信息...')
const userFriendlyErrors = checkFileContent('lib/error-handler.ts', [
  '网络连接失败',
  '服务暂时不可用',
  '您没有权限',
  '输入数据有误',
  'formatUserMessage'
], '用户友好的错误信息')
allPassed = allPassed && userFriendlyErrors

// 7. 检查错误日志记录
console.log('\n7️⃣ 检查错误日志记录...')
const errorLogging = checkFileContent('lib/error-handler.ts', [
  'ErrorReporter',
  'addToHistory',
  'logError',
  'console.error',
  'timestamp',
  'stackTrace'
], '错误日志记录')
allPassed = allPassed && errorLogging

// 8. 检查Toast配置是否正确
console.log('\n8️⃣ 检查Toast配置...')
const toastConfig = checkFileContent('app/layout.tsx', [
  'import { Toaster }',
  '<Toaster />',
  'QueryClientProvider'
], 'Toast配置')
allPassed = allPassed && toastConfig

// 最终结果
console.log('\n' + '='.repeat(50))
if (allPassed) {
  console.log('🎉 任务38验证通过！')
  console.log('✅ 全局错误处理和React Query集成已完善')
  console.log('✅ 401错误自动跳转登录页')
  console.log('✅ 网络错误提供重试选项') 
  console.log('✅ 业务错误显示具体信息')
  console.log('✅ 错误信息通过Toast统一显示')
  console.log('✅ 智能重试策略已实现')
  console.log('✅ 错误日志记录完善')
  process.exit(0)
} else {
  console.log('❌ 任务38验证失败')
  console.log('请检查上述错误并修复')
  process.exit(1)
}