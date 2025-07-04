# 🚀 快速配置Vercel - 5分钟完成

## 第一步：获取微信AppSecret (2分钟)

1. 打开浏览器，访问: https://mp.weixin.qq.com
2. 使用微信扫码登录
3. 点击左侧菜单【开发】→【基本配置】
4. 找到"AppSecret(应用密钥)"
5. 如果显示"已设置"，点击【重置】按钮
6. 复制新生成的AppSecret（32位字符串）
7. **立即保存**到记事本，这个值只显示一次！

## 第二步：配置Vercel环境变量 (3分钟)

### 打开Vercel项目
1. 浏览器访问: https://vercel.com/dashboard
2. 找到您的项目，点击项目名称
3. 点击顶部的【Settings】选项卡
4. 在左侧菜单点击【Environment Variables】

### 添加第一个变量：WECHAT_APPSECRET
```
Name: WECHAT_APPSECRET
Value: [刚才复制的32位AppSecret]
Environment: ✅ Production ✅ Preview ✅ Development (三个都要勾选)
```
点击【Save】

### 添加第二个变量：VERCEL_AUTH_TOKEN
```
Name: VERCEL_AUTH_TOKEN  
Value: baby_growth_2024_auth_token_xyz123
Environment: ✅ Production ✅ Preview ✅ Development (三个都要勾选)
```
点击【Save】

### 重新部署
1. 点击顶部的【Deployments】选项卡
2. 点击最新部署右侧的【⋯】按钮
3. 选择【Redeploy】
4. 等待部署完成（通常1-2分钟）

## 验证配置

部署完成后，您会看到类似这样的URL：
```
https://your-project-name.vercel.app
```

**保存这个URL！**这就是您要在微信公众号中配置的服务器地址。

## 🎯 下一步

配置完成后，告诉我您的Vercel部署URL，我们继续配置微信公众号！

## 🆘 遇到问题？

### AppSecret找不到？
- 确保您是公众号的管理员
- 如果是新注册的公众号，可能需要先完成认证

### Vercel配置界面找不到？
- 确保您已经连接了GitHub仓库到Vercel
- 如果没有项目，需要先从GitHub导入项目

### 部署失败？
- 检查环境变量名称是否正确（区分大小写）
- 确保AppSecret没有多余的空格 