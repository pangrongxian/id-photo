<template>
  <view class="page">

    <!-- 成功头部 -->
    <view class="success-header">
      <view class="check-circle"><text class="check-icon">✓</text></view>
      <text class="success-title">证件照制作完成</text>
      <text class="success-sub">{{ sizeLabel }} · {{ colorLabel }}背景 · {{ sizeW }}×{{ sizeH }}px</text>
    </view>

    <!-- 照片展示 -->
    <view class="photo-card">
      <view class="photo-bg" :style="{ background: colorHex }">
        <image class="photo-img" :src="photoPath" mode="aspectFit" @click="previewPhoto" />
      </view>
      <text class="photo-tap-hint">点击图片可全屏预览</text>
    </view>

    <!-- 次级操作按钮 -->
    <view class="action-group">
      <button class="btn-secondary" @click="goPrint" hover-class="btn-hover">
        <view class="btn-icon-wrap"><text class="btn-icon">🖨️</text></view>
        <view class="btn-text-wrap">
          <text class="btn-main-text2">生成打印排版图</text>
          <text class="btn-sub-text2">多张排版到6×4寸相纸</text>
        </view>
                <view class="btn-arrow"></view>
      </button>

      <button class="btn-secondary" open-type="share" hover-class="btn-hover">
        <view class="btn-icon-wrap"><text class="btn-icon">🎁</text></view>
        <view class="btn-text-wrap">
          <text class="btn-main-text2">分享给朋友</text>
          <text class="btn-sub-text2">推荐好用的证件照工具</text>
        </view>
                <view class="btn-arrow"></view>
      </button>
    </view>

    <!-- 规格 -->
    <view class="card">
      <view class="card-title">输出规格</view>
      <view class="spec-row">
        <text class="spec-key">证件类型</text>
        <text class="spec-val">{{ sizeLabel }}</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">图片尺寸</text>
        <text class="spec-val">{{ sizeW }} × {{ sizeH }} 像素</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">分辨率</text>
        <text class="spec-val">300 DPI（印刷级）</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">背景颜色</text>
        <view class="spec-color-row">
          <view class="spec-swatch" :style="{ background: colorHex, border: colorHex === '#FFFFFF' ? '1rpx solid rgba(255,255,255,0.2)' : 'none' }" />
          <text class="spec-val">{{ colorLabel }}</text>
        </view>
      </view>
      <view class="spec-row" v-if="hasBeauty">
        <text class="spec-key">美化调整</text>
        <text class="spec-val">已应用</text>
      </view>
    </view>

    <!-- 打印指南 -->
    <view class="card">
      <view class="card-title">如何打印？</view>
      <view class="guide-list">
        <view class="guide-item" v-for="(g, i) in guides" :key="i">
          <view class="guide-num"><text>{{ i + 1 }}</text></view>
          <view class="guide-text-wrap">
            <text class="guide-label">{{ g.label }}</text>
            <text class="guide-sub">{{ g.sub }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 重新制作 -->
    <button class="btn-remake" @click="remake" hover-class="btn-hover">重新制作</button>

    <!-- Banner广告 -->
    <view class="ad-wrap">
      <ad unit-id="your-banner-unit-id" ad-type="banner" class="ad-banner" />
    </view>

    <!-- 底部悬浮保存按钮 -->
    <view class="sticky-bottom">
      <button class="btn-save" @click="savePhoto" hover-class="btn-save-hover">
        <text class="btn-save-icon">💾</text>
        <view class="btn-save-text-wrap">
          <text class="btn-save-main">保存到相册</text>
          <text class="btn-save-sub">免费 · 高清 · 无水印</text>
        </view>
      </button>
    </view>

  </view>
</template>

<script>
import { saveToAlbum } from '../../utils/canvas.js'
import { adManager } from '../../utils/ad.js'
import { usePhotoStore } from '../../store/photo.js'

export default {
  name: 'ResultPage',
  data() {
    return {
      photoPath:  '',
      sizeLabel:  '',
      sizeW:      0,
      sizeH:      0,
      colorHex:   '#FFFFFF',
      colorLabel: '白色',
      hasBeauty:  false,
      guides: [
        { label: '保存排版图',  sub: '点击"生成打印排版图"，排好版后保存到相册' },
        { label: '传给打印店',  sub: '通过微信发送图片，或使用美团闪印等上门服务' },
        { label: '告知规格',    sub: '6×4寸相纸，照片打印，不要裁边' },
        { label: '裁剪使用',    sub: '打印后沿参考线裁剪即可' },
      ],
    }
  },
  onLoad() {
    const photoStore = usePhotoStore()
    this.photoPath  = photoStore.outputPath        || ''
    this.sizeLabel  = photoStore.selectedSize?.label || ''
    this.sizeW      = photoStore.selectedSize?.w     || 0
    this.sizeH      = photoStore.selectedSize?.h     || 0
    this.colorHex   = photoStore.selectedColor?.hex  || '#FFFFFF'
    this.colorLabel = photoStore.selectedColor?.label || '白色'

    const b = photoStore.beauty || {}
    this.hasBeauty = b.brightness !== 0 || b.contrast !== 0 || b.smooth !== 0 || b.sharpen !== 0
  },
  onShareAppMessage() {
    return {
      title: '免费证件照制作，AI抠图一键换背景，无水印！',
      path:  '/pages/index/index',
    }
  },
  methods: {
    previewPhoto() {
      if (this.photoPath) {
        uni.previewImage({ urls: [this.photoPath], current: this.photoPath })
      }
    },
    async savePhoto() {
      if (!this.photoPath) { uni.showToast({ title: '照片未生成', icon: 'none' }); return }

      try {
        // 调用激励视频广告
        await adManager.show('your-reward-ad-unit-id')

        // 用户看完广告，执行保存逻辑
        uni.showLoading({ title: '保存中…', mask: true })
        await saveToAlbum(this.photoPath)
        uni.hideLoading()
        uni.showToast({ title: '已保存到相册 ✓', icon: 'none', duration: 2000 })
        this.addFileToHistory(); // 保存成功后，添加到历史记录

      } catch (e) {
        uni.hideLoading()
        if (e && e.message && e.message !== '已取消') {
          uni.showToast({ title: e.message, icon: 'none' })
        }
      }
    },
    goPrint() {
      const photoStore = usePhotoStore()
      if (!photoStore.outputPath || !photoStore.selectedSize) {
        uni.showToast({ title: '请先生成证件照', icon: 'none' }); return
      }
      uni.navigateTo({ url: '/pages/print/index' })
    },
    remake() {
      // 返回到首页（editor + beauty + result 共3页，delta=3）
      // 现在首页是工具聚合页，证件照首页是 id-photo/index
      uni.navigateBack({ delta: 3 })
    },
    addFileToHistory() {
      const fileRecord = {
        tempFilePath: this.photoPath,
        type: this.sizeLabel,
        timestamp: Date.now()
      };

      let history = uni.getStorageSync('processed_files') || [];
      // 避免重复添加完全相同的记录
      const existingIndex = history.findIndex(item => item.tempFilePath === fileRecord.tempFilePath);
      if (existingIndex > -1) {
        history.splice(existingIndex, 1);
      }

      history.unshift(fileRecord);

      // 保持最多20条记录
      if (history.length > 20) {
        history = history.slice(0, 20);
      }

      uni.setStorageSync('processed_files', history);
    }
  },
}
</script>

<style scoped>
page { background: #000000; }
.page { background: #000000; min-height: 100vh; padding: 40rpx 28rpx 240rpx; }

/* 成功头部 */
.success-header { text-align: center; margin-bottom: 48rpx; }
.check-circle {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: rgba(52, 199, 89, 0.1); border: 2rpx solid #34C759;
  display: flex; align-items: center; justify-content: center; margin: 0 auto 24rpx;
  box-shadow: 0 0 32rpx rgba(52, 199, 89, 0.2);
  animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.check-icon    { font-size: 64rpx; color: #34C759; }
.success-title { display: block; font-size: 44rpx; font-weight: 900; color: #E6C875; margin-bottom: 12rpx; letter-spacing: 2rpx; }
.success-sub   { display: block; font-size: 24rpx; color: #8E8E93; }

/* 照片展示 */
.photo-card { text-align: center; margin-bottom: 40rpx; }
.photo-bg   {
  display: inline-flex; justify-content: center; align-items: center;
  padding: 24rpx; border-radius: 24rpx; min-width: 280rpx; min-height: 340rpx;
  transition: background 0.3s ease;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
}
.photo-img      { width: 240rpx; height: 320rpx; border-radius: 8rpx; }
.photo-tap-hint { display: block; font-size: 22rpx; color: #8E8E93; margin-top: 20rpx; }

/* 次级操作按钮 */
.action-group { display: flex; flex-direction: column; gap: 20rpx; margin-bottom: 40rpx; }
.btn-secondary {
  display: flex; align-items: center; gap: 24rpx;
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx; padding: 32rpx 28rpx; text-align: left;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
  transition: all 0.25s ease;
}
.btn-hover { transform: scale(0.96); background: rgba(255, 255, 255, 0.08); }
.btn-icon-wrap {
  width: 80rpx; height: 80rpx; border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.03);
  display: flex; align-items: center; justify-content: center;
}
.btn-icon        { font-size: 40rpx; }
.btn-text-wrap   { flex: 1; }
.btn-main-text2  { display: block; font-size: 30rpx; font-weight: 700; color: #E8E0D0; margin-bottom: 6rpx; }
.btn-sub-text2   { display: block; font-size: 22rpx; color: #8E8E93; }
.btn-arrow {
  width: 14rpx;
  height: 14rpx;
  border-top: 4rpx solid #8E8E93;
  border-right: 4rpx solid #8E8E93;
  transform: rotate(45deg);
}

/* 卡片 */
.card {
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx; padding: 32rpx 28rpx; margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}
.card-title {
  font-size: 28rpx; font-weight: 700; color: #E6C875; letter-spacing: 2rpx;
  margin-bottom: 24rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

/* 规格 */
.spec-row { display: flex; justify-content: space-between; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05); }
.spec-row:last-child { border-bottom: none; padding-bottom: 0; }
.spec-key       { font-size: 26rpx; color: #8E8E93; }
.spec-val       { font-size: 26rpx; color: #E8E0D0; font-weight: 500; }
.spec-color-row { display: flex; align-items: center; gap: 12rpx; }
.spec-swatch    { width: 36rpx; height: 36rpx; border-radius: 50%; }

/* 打印指南 */
.guide-list { display: flex; flex-direction: column; gap: 24rpx; }
.guide-item { display: flex; align-items: flex-start; gap: 20rpx; }
.guide-num  {
  width: 48rpx; height: 48rpx; border-radius: 50%; flex-shrink: 0;
  background: rgba(230, 200, 117, 0.1); display: flex; align-items: center; justify-content: center;
}
.guide-num text  { font-size: 24rpx; color: #E6C875; font-weight: 700; }
.guide-text-wrap { flex: 1; }
.guide-label     { display: block; font-size: 28rpx; color: #E8E0D0; font-weight: 600; margin-bottom: 6rpx; }
.guide-sub       { display: block; font-size: 24rpx; color: #8E8E93; line-height: 1.5; }

/* 重新制作 */
.btn-remake {
  width: 100%; background: rgba(255, 255, 255, 0.05); color: #E8E0D0;
  border: 1rpx solid rgba(255, 255, 255, 0.1); border-radius: 24rpx; padding: 28rpx;
  font-size: 30rpx; font-weight: 600; margin-bottom: 40rpx;
  transition: all 0.25s ease;
}

/* 广告 */
.ad-wrap { border-radius: 24rpx; overflow: hidden; margin-bottom: 40rpx; }
.ad-banner { width: 100%; }

/* 底部悬浮保存按钮 */
.sticky-bottom {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 24rpx 32rpx 64rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent);
  backdrop-filter: blur(10px); z-index: 100;
}
.btn-save {
  display: flex; align-items: center; justify-content: center; gap: 20rpx;
  background: linear-gradient(135deg, #E6C875, #C89D3C);
  border: none; border-radius: 24rpx; padding: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(230, 200, 117, 0.3);
  transition: all 0.25s ease;
}
.btn-save-hover { transform: scale(0.96); box-shadow: 0 4rpx 12rpx rgba(230, 200, 117, 0.2); }
.btn-save-icon { font-size: 48rpx; }
.btn-save-text-wrap { text-align: left; }
.btn-save-main { display: block; font-size: 32rpx; font-weight: 800; color: #1a1400; letter-spacing: 2rpx; }
.btn-save-sub { display: block; font-size: 22rpx; color: rgba(26, 20, 0, 0.6); margin-top: 4rpx; font-weight: 600; }
</style>
