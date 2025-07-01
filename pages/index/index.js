const app = getApp()

Page({
  data: {
    inputValue: '',
    records: [],
    showDeleteModal: false,
    deleteTarget: null
  },

  onLoad() {
    console.log('首页加载')
    this.loadRecords()
  },

  onShow() {
    // 页面显示时重新加载记录，以防从其他页面编辑后返回
    this.loadRecords()
  },

  // 加载所有记录
  loadRecords() {
    try {
      const records = app.recordManager.getAllRecords()
      const processedRecords = records.map(record => ({
        ...record,
        timeText: this.formatTimeText(record.createTime)
      }))
      this.setData({
        records: processedRecords
      })
    } catch (e) {
      console.error('加载记录失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  },

  // 格式化时间显示
  formatTimeText(date) {
    if (typeof date === 'string') {
      date = new Date(date)
    }
    
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return app.formatTime(date)
    }
  },

  // 输入框内容变化
  onInput(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  // 跳转到添加页面
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },

  // 添加记录
  addRecord() {
    const content = this.data.inputValue.trim()
    if (!content) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      })
      return
    }

    const success = app.recordManager.addRecord(content)
    if (success) {
      this.setData({
        inputValue: ''
      })
      this.loadRecords()
      wx.showToast({
        title: '记录成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '记录失败',
        icon: 'error'
      })
    }
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  // 显示删除确认框
  showDeleteConfirm(e) {
    const id = e.currentTarget.dataset.id
    const index = e.currentTarget.dataset.index
    
    // 震动反馈
    wx.vibrateShort()
    
    this.setData({
      showDeleteModal: true,
      deleteTarget: { id, index }
    })
  },

  // 隐藏删除确认框
  hideDeleteModal() {
    this.setData({
      showDeleteModal: false,
      deleteTarget: null
    })
  },

  // 阻止模态框关闭
  preventClose() {
    // 阻止事件冒泡
  },

  // 确认删除
  confirmDelete() {
    const { deleteTarget } = this.data
    if (!deleteTarget) return

    const success = app.recordManager.deleteRecord(deleteTarget.id)
    if (success) {
      this.loadRecords()
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }

    this.hideDeleteModal()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRecords()
    wx.stopPullDownRefresh()
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '花生记录 - 简单记录美好生活',
      path: '/pages/index/index'
    }
  }
}) 