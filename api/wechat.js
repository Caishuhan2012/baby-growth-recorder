const crypto = require('crypto')

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'

export default function handler(req, res) {
  const { method, query, headers, url } = req
  
  // 强制设置200状态码和正确的响应头
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // 记录详细日志
  console.log(`=== 微信接口请求开始 ===`)
  console.log(`时间: ${new Date().toISOString()}`)
  console.log(`方法: ${method}`)
  console.log(`URL: ${url}`)
  console.log(`Query:`, query)
  console.log(`Headers:`, JSON.stringify(headers, null, 2))
  
  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    console.log('🔧 处理OPTIONS预检请求')
    console.log('=== 微信接口请求结束 ===\n')
    return res.status(200).end()
  }
  
  // 处理GET请求（微信验证）
  if (method === 'GET') {
    console.log('🔍 处理微信验证请求')
    
    const { signature, timestamp, nonce, echostr } = query
    
    console.log('验证参数详情:')
    console.log(`- signature: ${signature || 'undefined'}`)
    console.log(`- timestamp: ${timestamp || 'undefined'}`) 
    console.log(`- nonce: ${nonce || 'undefined'}`)
    console.log(`- echostr: ${echostr || 'undefined'}`)
    
    // 如果没有任何验证参数，说明是直接访问
    if (!signature && !timestamp && !nonce && !echostr) {
      console.log('❌ 直接访问，无验证参数')
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('WeChat verification endpoint. Please configure in WeChat backend.')
    }
    
    // 检查是否有完整的验证参数
    if (!signature || !timestamp || !nonce || !echostr) {
      console.log('❌ 验证参数不完整')
      console.log(`- 缺少参数: ${!signature ? 'signature ' : ''}${!timestamp ? 'timestamp ' : ''}${!nonce ? 'nonce ' : ''}${!echostr ? 'echostr' : ''}`)
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('Missing verification parameters')
    }
    
    // 验证签名
    try {
      console.log('🔐 开始签名验证')
      const token = WECHAT_TOKEN
      const arr = [token, timestamp, nonce].sort()
      const str = arr.join('')
      const sha1 = crypto.createHash('sha1').update(str).digest('hex')
      
      console.log('签名计算详情:')
      console.log(`- Token: ${token}`)
      console.log(`- 参数数组: [${arr.join(', ')}]`)
      console.log(`- 拼接字符串: ${str}`)
      console.log(`- 计算SHA1: ${sha1}`)
      console.log(`- 微信签名: ${signature}`)
      console.log(`- 验证结果: ${signature === sha1}`)
      
      if (signature === sha1) {
        console.log('✅ 验证成功！返回 echostr')
        console.log(`✅ 返回内容: ${echostr}`)
        console.log('=== 微信接口请求结束 ===\n')
        return res.status(200).send(echostr)
      } else {
        console.log('❌ 签名验证失败')
        console.log('=== 微信接口请求结束 ===\n')
        return res.status(200).send('Signature verification failed')
      }
    } catch (error) {
      console.error('💥 验证过程异常:', error)
      console.error('💥 错误堆栈:', error.stack)
      console.log('=== 微信接口请求结束 ===\n')
      return res.status(200).send('Internal server error')
    }
  } 
  
  // 处理POST请求（接收消息）
  else if (method === 'POST') {
    console.log('📨 处理微信消息推送')
    console.log('=== 微信接口请求结束 ===\n')
    return res.status(200).send('success')
  } 
  
  // 不支持的方法
  else {
    console.log(`❌ 不支持的请求方法: ${method}`)
    console.log('=== 微信接口请求结束 ===\n')
    return res.status(200).send(`Method ${method} not allowed`)
  }
} 