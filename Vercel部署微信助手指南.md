# Vercel部署微信助手指南

## 🎯 部署目标
在Vercel上部署微信消息处理服务，实现：**微信消息 → Vercel API → 小程序云函数 → AI处理 → 小程序显示**

## 📋 架构方案

### 🏗️ 技术架构
```
用户微信 → 微信服务器 → Vercel API Routes → httpReceiver云函数 → 小程序云开发
    📱        🌐            🔗              ☁️              📲
```

### 🔧 核心组件
1. **api/wechat-handler.js** - Vercel微信消息处理器
2. **cloudfunctions/httpReceiver** - 云函数HTTP接收器
3. **cloudfunctions/aiProcessor** - AI处理器（已存在）

## 🚀 部署步骤

### 第一步：配置Vercel环境变量

在Vercel项目设置中添加以下环境变量：

```bash
# 微信公众号配置
WECHAT_APPSECRET=你的微信AppSecret

# 云函数HTTP触发器URL
CLOUD_HTTP_URL=https://你的环境ID.tcb.qcloud.la/httpReceiver

# Vercel与云函数通信的认证令牌
VERCEL_AUTH_TOKEN=your_custom_auth_token_2024
```

### 第二步：部署云函数

1. **部署httpReceiver云函数**
   ```bash
   # 在微信开发者工具中
   右键 cloudfunctions/httpReceiver 文件夹
   选择：上传并部署：云端安装依赖
   ```

2. **开启HTTP触发器**
   ```bash
   # 右键 httpReceiver 云函数
   开启HTTP访问服务
   复制HTTP触发路径
   ```

3. **配置云函数环境变量**
   ```bash
   # 在云开发控制台 → 云函数 → httpReceiver → 环境变量
   VERCEL_AUTH_TOKEN=your_custom_auth_token_2024
   ```

### 第三步：创建数据库集合

在云开发控制台创建以下集合：

1. **message_logs** - 消息处理日志
2. **pending_images** - 待处理图片（可能已存在）
3. **growth_records** - 成长记录（已存在）

### 第四步：配置微信公众号

1. **服务器配置**
   - URL: `https://你的Vercel域名.vercel.app/api/wechat-handler`
   - Token: `babyGrowthRecord2024`
   - 消息加解密方式：明文模式

2. **验证配置**
   - 保存配置时微信会验证
   - 确保Vercel部署成功
   - 检查日志确认验证通过

### 第五步：部署到Vercel

1. **确认文件结构**
   ```
   ├── api/
   │   ├── wechat.js              # 原有API（保留）
   │   └── wechat-handler.js      # 新的Vercel处理器
   ├── cloudfunctions/
   │   ├── httpReceiver/          # HTTP接收器云函数
   │   │   ├── index.js
   │   │   └── package.json
   │   └── aiProcessor/           # AI处理器（已存在）
   └── package.json               # 已添加axios依赖
   ```

2. **推送到Git并部署**
   ```bash
   git add .
   git commit -m "添加Vercel微信助手支持"
   git push origin main
   ```

3. **Vercel自动部署**
   - Vercel会自动检测更改并部署
   - 检查部署日志确认成功

## 🔍 测试流程

### 测试1：API端点验证
```bash
curl https://你的域名.vercel.app/api/wechat-handler
# 应返回微信验证相关信息
```

### 测试2：微信验证
1. 在微信公众号后台保存服务器配置
2. 查看Vercel函数日志
3. 确认验证成功

### 测试3：消息处理
1. 向公众号发送：`帮助`
2. 检查Vercel日志
3. 检查云函数日志
4. 确认收到回复

### 测试4：图片+文本组合
1. 发送宝宝照片
2. 发送文字描述
3. 检查小程序是否显示新记录

## 📊 监控和调试

### Vercel日志查看
```bash
# 在Vercel Dashboard
Functions → View Function Logs
查看实时运行日志
```

### 云函数日志查看
```bash
# 在云开发控制台
云函数 → httpReceiver → 日志
查看云函数执行日志
```

### 数据库检查
```bash
# 在云开发控制台查看数据
message_logs - 检查消息是否正确记录
pending_images - 检查图片是否正确处理
growth_records - 检查AI处理结果
```

## 🔧 配置文件示例

### vercel.json
```json
{
  "functions": {
    "api/wechat-handler.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "WECHAT_APPSECRET": "@wechat-appsecret",
    "CLOUD_HTTP_URL": "@cloud-http-url",
    "VERCEL_AUTH_TOKEN": "@vercel-auth-token"
  }
}
```

### 环境变量模板
```bash
# .env.local (本地开发)
WECHAT_APPSECRET=your_wechat_appsecret_here
CLOUD_HTTP_URL=https://env-xxx.tcb.qcloud.la/httpReceiver
VERCEL_AUTH_TOKEN=your_custom_auth_token_2024
```

## 🚨 常见问题排查

### 问题1：微信验证失败
```
原因：Token不匹配或URL不正确
解决：检查Token配置，确认Vercel部署成功
```

### 问题2：消息无响应
```
原因：云函数调用失败或配置错误
解决：检查CLOUD_HTTP_URL和认证令牌
```

### 问题3：图片处理失败
```
原因：云存储权限或微信AppSecret配置问题
解决：检查环境变量配置，验证微信API权限
```

### 问题4：AI处理失败
```
原因：aiProcessor云函数问题
解决：检查aiProcessor云函数状态和日志
```

## 📈 性能优化

### 1. Vercel函数优化
- 设置合理的maxDuration
- 使用异步处理避免超时
- 添加错误重试机制

### 2. 云函数优化
- 优化云函数冷启动
- 添加缓存机制
- 减少数据库查询次数

### 3. 监控告警
- 配置Vercel监控
- 设置云函数告警
- 监控API响应时间

## 🔄 数据流程图

```
微信用户发送消息
    ↓
微信服务器推送到Vercel
    ↓
api/wechat-handler.js 处理
    ↓
解析消息并立即回复用户
    ↓
异步调用httpReceiver云函数
    ↓
云函数处理数据并调用AI
    ↓
结果存储到云数据库
    ↓
小程序实时显示新记录
```

## 🎉 部署完成检查清单

- [ ] Vercel环境变量配置完成
- [ ] httpReceiver云函数部署成功
- [ ] HTTP触发器开启并获取URL
- [ ] 云函数环境变量配置完成
- [ ] 数据库集合创建完成
- [ ] 微信公众号配置验证通过
- [ ] Vercel部署成功
- [ ] 微信验证测试通过
- [ ] 消息处理测试通过
- [ ] 图片+文本测试通过
- [ ] 小程序显示新记录

---

🎯 **恭喜！** 完成所有配置后，你的Vercel微信助手就可以正常工作了！用户向公众号发送消息将自动处理并在小程序中显示AI生成的成长记录。 