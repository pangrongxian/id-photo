// ============================================================
// 微信广告统一管理器 v1.0
// ============================================================

class RewardedVideoAdManager {
  constructor() {
    this.ad = null
    this.adUnitId = ''
    this.isLoading = false
    this._resolve = null
    this._reject = null
  }

  create(adUnitId) {
    this.adUnitId = adUnitId
    this.ad = uni.createRewardedVideoAd({ adUnitId })

    this.ad.onLoad(() => {
      this.isLoading = false
      console.log('激励视频广告加载成功')
    })

    this.ad.onError((err) => {
      this.isLoading = false
      console.error('激励视频广告加载失败', err)
      if (this._reject) {
        this._reject(new Error('广告拉取失败，请稍后再试'))
      }
    })

    this.ad.onClose((res) => {
      if (res && res.isEnded) {
        console.log('激励视频广告完整播放')
        if (this._resolve) {
          this._resolve()
        }
      } else {
        console.log('激励视频广告提前关闭')
        if (this._reject) {
          this._reject(new Error('需要完整观看才能保存哦'))
        }
      }
    })
  }

  show(adUnitId) {
    if (this.isLoading) {
      return Promise.reject(new Error('广告正在加载中，请勿频繁点击'))
    }

    if (!this.ad || this.adUnitId !== adUnitId) {
      this.create(adUnitId)
    }

    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject

      uni.showLoading({ title: '广告加载中…', mask: true })
      this.isLoading = true

      this.ad.load()
        .then(() => {
          uni.hideLoading()
          this.ad.show()
        })
        .catch(err => {
          uni.hideLoading()
          this.isLoading = false
          console.error('调用 ad.load() 失败', err)
          this._reject(new Error('广告展示失败'))
        })
    })
  }
}

// 导出一个单例
export const adManager = new RewardedVideoAdManager()
