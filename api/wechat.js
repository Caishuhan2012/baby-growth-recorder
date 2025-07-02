const crypto = require('crypto')

// 微信公众号配置
const WECHAT_TOKEN = 'babyGrowthRecord2024'

export default function handler(req, res) {
  const { method, query } = req
  
  console.log(`微信接口请求: ${method}`)
  console.log('Query参数:', query)
  console.log('Headers:', req.headers)
  
  // 只处理GET请求的验证
  if (method === 'GET') {
    const { signature, timestamp, nonce, echostr } = query
    
    console.log('微信验证参数:')
    console.log('- signature:', signature)
    console.log('- timestamp:', timestamp) 
    console.log('- nonce:', nonce)
    console.log('- echostr:', echostr)
    
    // 必须有所有验证参数
    if (!signature || !timestamp || !nonce || !echostr) {
      console.log('❌ 缺少验证参数')
      // 微信验证失败时返回错误信息，但还是200状态码
      res.status(200).send('error: missing parameters')
      return
    }
    
    try {
      // 验证签名
      const token = WECHAT_TOKEN
      const arr = [token, timestamp, nonce].sort()
      const str = arr.join('')
      const sha1 = crypto.createHash('sha1').update(str).digest('hex')
      
      console.log('签名计算过程:')
      console.log('- Token:', token)
      console.log('- 排序后数组:', arr)
      console.log('- 拼接字符串:', str)
      console.log('- 计算SHA1:', sha1)
      console.log('- 微信签名:', signature)
      console.log('- 验证结果:', signature === sha1)
      
      if (signature === sha1) {
        console.log('✅ 验证成功，返回echostr:', echostr)
        res.status(200).send(echostr)
      } else {
        console.log('❌ 签名验证失败')
        res.status(200).send('error: signature verification failed')
      }
    } catch (error) {
      console.error('验证过程出错:', error)
      res.status(200).send('error: internal server error')
    }
  } else if (method === 'POST') {
    // POST请求处理消息
    console.log('收到POST消息请求')
    res.status(200).send('success')
  } else {
    console.log('不支持的请求方法:', method)
    res.status(200).send('error: method not allowed')
  }
} 