/**
 * 配置检查脚本
 * 帮助验证Vercel环境变量配置是否正确
 */

// 检查必需的环境变量
const requiredEnvVars = {
  'WECHAT_APPSECRET': '微信公众号AppSecret',
  'VERCEL_AUTH_TOKEN': 'Vercel认证令牌'
}

console.log('🔍 检查Vercel环境变量配置...\n')

let allConfigured = true

for (const [varName, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[varName]
  
  if (value) {
    console.log(`✅ ${varName} (${description}): 已配置`)
    
    // 验证格式
    if (varName === 'WECHAT_APPSECRET') {
      if (value.length < 30) {
        console.log(`   ⚠️  警告: AppSecret长度可能不正确 (${value.length}字符)`)
      }
    }
    
    if (varName === 'VERCEL_AUTH_TOKEN') {
      if (value === 'default_auth_token_2024') {
        console.log(`   ⚠️  警告: 使用的是默认令牌，建议修改为自定义值`)
      }
    }
  } else {
    console.log(`❌ ${varName} (${description}): 未配置`)
    allConfigured = false
  }
}

console.log('\n' + '='.repeat(50))

if (allConfigured) {
  console.log('🎉 所有环境变量配置完成！')
  console.log('📋 下一步: 部署到Vercel')
} else {
  console.log('⚠️  还有环境变量需要配置')
  console.log('📖 请参考: Vercel环境变量配置指南.md')
}

console.log('\n📝 配置步骤:')
console.log('1. 登录 https://vercel.com')
console.log('2. 选择项目 → Settings → Environment Variables')
console.log('3. 添加上述未配置的变量')
console.log('4. 重新部署项目')

// 如果在Vercel环境中运行，显示更多信息
if (process.env.VERCEL) {
  console.log('\n🌐 Vercel部署信息:')
  console.log(`- 部署URL: ${process.env.VERCEL_URL}`)
  console.log(`- 环境: ${process.env.VERCEL_ENV}`)
  console.log(`- 区域: ${process.env.VERCEL_REGION}`)
} 