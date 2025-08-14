#!/usr/bin/env node

/**
 * 验证任务32：迁移服务器组件
 * 
 * 检查所有服务器组件是否已正确迁移到使用 React Query hooks
 */

const fs = require('fs')
const path = require('path')

// 待检查的组件文件
const componentsToCheck = [
  'components/servers/shadowsocks-servers/create-server-dialog.tsx',
  'components/servers/shadowsocks-servers/edit-server-dialog.tsx',
  'components/servers/shadowsocks-servers/server-detail-dialog.tsx',
  'components/servers/shadowsocks-servers/shadowsocks-server-mobile-card.tsx',
  'components/servers/server-groups/create-server-group-dialog.tsx',
  'components/servers/server-groups/edit-server-group-dialog.tsx',
  'components/servers/server-groups/server-group-detail-dialog.tsx',
]

// 应该存在的导入
const expectedImports = {
  'create-server-dialog.tsx': [
    '@/hooks/mutations/use-server-mutations',
    'useCreateServer'
  ],
  'edit-server-dialog.tsx': [
    '@/hooks/mutations/use-server-mutations',
    '@/hooks/queries/use-servers',
    'useUpdateServer',
    'serverQueryUtils'
  ],
  'server-detail-dialog.tsx': [
    '@/hooks/queries/use-servers',
    'serverQueryUtils'
  ],
  'shadowsocks-server-mobile-card.tsx': [
    '@/hooks/queries/use-servers',
    'serverQueryUtils'
  ],
  'create-server-group-dialog.tsx': [
    '@/hooks/mutations/use-server-mutations',
    '@/hooks/queries/use-servers',
    'useCreateServerGroup',
    'serverQueryUtils'
  ],
  'edit-server-group-dialog.tsx': [
    '@/hooks/mutations/use-server-mutations',
    '@/hooks/queries/use-servers',
    'useUpdateServerGroup',
    'serverQueryUtils'
  ],
  'server-group-detail-dialog.tsx': [
    '@/hooks/queries/use-servers',
    'serverQueryUtils'
  ]
}

// 不应该存在的导入（直接的服务调用）
const deprecatedImports = [
  'shadowsocksServerService',
  'serverGroupService',
  '@/lib/shadowsocks-service',
  '@/lib/server-group-service'
]

function checkComponent(filePath) {
  const fullPath = path.join(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    return false
  }
  
  const content = fs.readFileSync(fullPath, 'utf8')
  const fileName = path.basename(filePath)
  const expected = expectedImports[fileName]
  
  let success = true
  
  console.log(`\n🔍 检查组件: ${filePath}`)
  
  // 检查应该存在的导入
  if (expected) {
    for (const expectedImport of expected) {
      if (!content.includes(expectedImport)) {
        console.error(`❌ 缺少导入: ${expectedImport}`)
        success = false
      } else {
        console.log(`✅ 找到导入: ${expectedImport}`)
      }
    }
  }
  
  // 检查不应该存在的导入
  for (const deprecatedImport of deprecatedImports) {
    if (content.includes(deprecatedImport)) {
      console.error(`❌ 发现已弃用的导入: ${deprecatedImport}`)
      success = false
    }
  }
  
  // 检查是否使用了 mutation hooks
  if (fileName.includes('create-') || fileName.includes('edit-')) {
    if (!content.includes('.mutate(') && !content.includes('.isPending')) {
      console.error(`❌ 未找到 mutation 调用`)
      success = false
    } else {
      console.log(`✅ 找到 mutation 调用`)
    }
  }
  
  // 检查是否移除了直接的API调用
  if (content.includes('await shadowsocksServerService') || 
      content.includes('await serverGroupService')) {
    console.error(`❌ 仍然包含直接的服务调用`)
    success = false
  } else {
    console.log(`✅ 已移除直接的服务调用`)
  }
  
  return success
}

function main() {
  console.log('🚀 开始验证任务32：迁移服务器组件\n')
  console.log('检查所有服务器组件是否已正确迁移到使用 React Query hooks...\n')
  
  let allPassed = true
  
  for (const component of componentsToCheck) {
    const passed = checkComponent(component)
    if (!passed) {
      allPassed = false
    }
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (allPassed) {
    console.log('✅ 任务32验证成功！所有服务器组件已正确迁移')
    console.log('✅ 所有组件都使用了 React Query hooks')
    console.log('✅ 移除了直接的 API 服务调用')
    console.log('✅ 遵循了统一的开发模式')
    process.exit(0)
  } else {
    console.log('❌ 任务32验证失败！部分组件未正确迁移')
    console.log('❌ 请检查上述错误并修复')
    process.exit(1)
  }
}

main()