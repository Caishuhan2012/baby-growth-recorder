// pages/add/add.js
const app = getApp()

Page({
  data: {
    content: '',
    quickTexts: [
      '今天要做的事',
      '突然想到',
      '明天记得',
      '想法记录',
      '学习笔记',
      '工作安排'
    ]
  },

  onLoad() {
    console.log('添加页面加载')
  },

  // 输入内容变化
  onInput(e) {
    this.setData({
      content: e.detail.value
    })
  },

  // 添加快捷文本
  addQuickText(e) {
    const text = e.currentTarget.dataset.text
    const currentContent = this.data.content
    
    let newContent = ''
    if (currentContent.trim()) {
      // 如果已有内容，换行添加
      newContent = currentContent + '\n\n' + text + '：'
    } else {
      // 如果没有内容，直接添加
      newContent = text + '：'
    }
    
    this.setData({
      content: newContent
    })

    // 触觉反馈
    wx.vibrateShort()
  },

  // 保存记录
  saveRecord() {
    const content = this.data.content.trim()
    
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    // 保存记录
    const success = app.recordManager.addRecord(content)
    
    if (success) {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        this.goBack()
      }, 1000)
    } else {
      wx.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  },

  // 返回上一页
  goBack() {
    // 如果有内容未保存，询问是否确认离开
    if (this.data.content.trim()) {
      wx.showModal({
        title: '确认离开？',
        content: '当前内容未保存，确定要离开吗？',
        confirmText: '离开',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack()
          }
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  // 监听页面返回
  onUnload() {
    // 页面销毁时的清理工作
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '花生记录 - 记录美好生活',
      path: '/pages/index/index'
    }
  }
}) 