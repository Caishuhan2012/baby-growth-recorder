# Vercel环境变量配置指南

## 概述
本指南将帮助您在Vercel平台上配置所需的环境变量，以确保微信消息处理功能正常运行。

## 需要配置的环境变量

### 1. WECHAT_APPSECRET
- **说明**: 微信公众号的AppSecret
- **用途**: 用于获取微信access_token，下载微信图片等API调用
- **如何获取**: 
  1. 登录微信公众平台 (https://mp.weixin.qq.com)
  2. 进入【开发 → 基本配置】
  3. 找到AppSecret，如果没有则点击【重置】生成新的
  4. **注意**: AppSecret只显示一次，请妥善保存

### 2. VERCEL_AUTH_TOKEN
- **说明**: Vercel与云函数之间的认证令牌
- **用途**: 防止恶意请求，确保只有Vercel能调用云函数
- **建议值**: 设置为一个随机字符串，例如：`baby_growth_2024_auth_token_xyz123`

## 配置步骤

### 第一步：配置Vercel环境变量

1. **登录Vercel平台**
   - 访问 https://vercel.com
   - 登录您的账户

2. **找到项目设置**
   - 在Dashboard中找到您的项目
   - 点击项目名称进入项目详情
   - 点击【Settings】选项卡

3. **配置环境变量**
   - 在设置页面找到【Environment Variables】
   - 点击【Add】添加新的环境变量

4. **添加WECHAT_APPSECRET**
   ```
   Name: WECHAT_APPSECRET
   Value: [您的微信公众号AppSecret]
   Environment: Production, Preview, Development (全选)
   ```

5. **添加VERCEL_AUTH_TOKEN**
   ```
   Name: VERCEL_AUTH_TOKEN
   Value: baby_growth_2024_auth_token_xyz123
   Environment: Production, Preview, Development (全选)
   ```

### 第二步：配置云函数环境变量

1. **进入小程序云开发控制台**
   - 登录微信开发者工具
   - 选择您的小程序项目
   - 点击【云开发】按钮

2. **配置httpReceiver云函数**
   - 在云函数列表中找到httpReceiver
   - 点击函数名称进入详情
   - 点击【配置】选项卡

3. **添加环境变量**
   ```
   VERCEL_AUTH_TOKEN: baby_growth_2024_auth_token_xyz123
   ```
   **注意**: 此值必须与Vercel中的VERCEL_AUTH_TOKEN完全一致

### 第三步：重新部署

1. **重新部署Vercel项目**
   - 回到Vercel项目页面
   - 点击【Deployments】选项卡
   - 点击【Redeploy】重新部署

2. **重新部署云函数**
   - 在微信开发者工具中
   - 右键点击httpReceiver文件夹
   - 选择【上传并部署：云端安装依赖】

## 配置验证

### 检查Vercel环境变量
```bash
# 在Vercel项目的函数日志中应该能看到环境变量
console.log('WECHAT_APPSECRET:', process.env.WECHAT_APPSECRET ? '已配置' : '未配置')
console.log('VERCEL_AUTH_TOKEN:', process.env.VERCEL_AUTH_TOKEN ? '已配置' : '未配置')
```

### 检查云函数环境变量
```javascript
// 在云函数日志中应该能看到环境变量
console.log('VERCEL_AUTH_TOKEN:', process.env.VERCEL_AUTH_TOKEN ? '已配置' : '未配置')
```

## 常见问题

### 1. 环境变量不生效
**解决方法**: 
- 确保选择了正确的环境（Production/Preview/Development）
- 重新部署项目
- 检查变量名称是否正确（区分大小写）

### 2. 微信AppSecret获取失败
**解决方法**:
- 确保您有微信公众号的管理员权限
- 如果之前生成过AppSecret，需要重置后重新获取
- 检查AppSecret是否包含特殊字符需要转义

### 3. 云函数调用失败
**解决方法**:
- 检查VERCEL_AUTH_TOKEN是否在两端配置一致
- 确保云函数已重新部署
- 检查云函数日志是否有错误信息

## 下一步

环境变量配置完成后，您可以：
1. 部署项目到Vercel获取正式URL
2. 在微信公众号中配置服务器URL
3. 测试完整的消息处理流程

## 安全提示

- **绝不要**在代码中硬编码敏感信息
- **定期更换**VERCEL_AUTH_TOKEN提高安全性
- **妥善保管**微信AppSecret，避免泄露
- **启用**微信公众号的IP白名单功能（可选） 