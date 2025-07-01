# 花生记录 - 开发指南

## 🎯 项目概述

"花生记录"是一个极简的随手记录微信小程序，参考了"黑猩猩随手记"的设计理念。

### 核心特性
- 极简设计，专注记录
- 本地存储，保护隐私  
- 快速便捷，打开即用
- 流畅体验，优雅交互

## 🏗 技术架构

### 技术栈
- 微信小程序原生框架
- JavaScript ES6+
- WXSS样式
- 本地存储API

### 数据结构
```javascript
// 记录对象
{
  id: Number,        // 时间戳ID
  content: String,   // 记录内容
  createTime: Date,  // 创建时间
  updateTime: Date   // 更新时间
}
```

## 🚀 快速开始

### 1. 环境准备
1. 下载[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 申请小程序账号获取AppID
3. 导入项目到开发工具

### 2. 配置修改
1. 修改`project.config.json`中的`appid`
2. 替换`images/`文件夹中的TabBar图标
3. 根据需要调整主题色和样式

### 3. 本地调试
- 使用开发者工具预览
- 真机调试测试功能
- 检查各项功能正常运行

## 📱 功能说明

### 首页 (index)
- 快速记录输入框
- 记录列表展示
- 长按删除操作
- 下拉刷新列表

### 添加页 (add)  
- 大文本输入框
- 快捷文本模板
- 字数实时统计
- 离开确认提醒

### 详情页 (detail)
- 记录内容查看
- 内联编辑功能
- 复制分享操作
- 删除确认机制

## 🎨 设计规范

### 色彩规范
- 主色：#FF6B35 (橙红色)
- 背景：#F5F5F5 (浅灰色)
- 卡片：#FFFFFF (白色)
- 文字：#333333 (深灰色)

### 字体规范
- 标题：36rpx, 字重600
- 副标题：28rpx, 字重500  
- 正文：32rpx, 字重400
- 辅助：28rpx, 字重400

## 🔧 开发技巧

### 调试方法
```javascript
// 控制台调试
console.log('数据:', data)

// 存储调试
console.log('本地数据:', wx.getStorageSync('peanut_records'))

// 错误处理
try {
  // 操作代码
} catch (e) {
  console.error('操作失败:', e)
}
```

### 性能优化
- 使用wx:if条件渲染
- 避免频繁setData操作
- 图片资源压缩优化
- 合理使用组件生命周期

## 📦 发布流程

### 1. 代码检查
- 功能完整性测试
- 兼容性验证
- 性能优化检查
- 代码规范审核

### 2. 提交审核
1. 开发者工具上传代码
2. 公众平台提交审核
3. 填写版本信息
4. 等待审核结果

### 3. 发布上线
- 审核通过后发布
- 监控运行状态
- 收集用户反馈
- 持续优化改进

## 🔄 扩展建议

### 功能扩展
- 搜索记录功能
- 标签分类系统
- 数据导出功能
- 夜间模式支持

### 技术升级
- 云端数据同步
- 协作编辑功能
- AI智能分类
- 数据统计分析

## 📚 参考资源

- [微信小程序开发文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)
- [开发者社区](https://developers.weixin.qq.com/community/minihome)

---

**让记录变得简单而美好！** 🥜✨ 