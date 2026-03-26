<template>
  <view class="page">

    <view class="header">
      <view class="header-content">
        <text class="header-title">证件照制作</text>
        <view class="header-badge">
          <text class="badge-dot"></text>
          <text class="header-desc">AI 智能抠图 · 免费无水印</text>
        </view>
      </view>
    </view>

    <!-- 主上传区域 -->
    <view class="upload-section" hover-class="card-hover" @click="choosePhoto">
      <view class="upload-card">
        <view class="upload-icon-box">
          <view class="icon-circle">
            <text class="plus-icon">＋</text>
          </view>
          <view class="ripple"></view>
        </view>
        <view class="upload-text">
          <text class="main-tip">点击上传照片</text>
          <text class="sub-tip">建议使用正面免冠照，背景干净效果更佳</text>
        </view>
      </view>
    </view>

    <!-- 热门尺寸快捷入口 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">热门证件类型</text>
        <text class="section-more" @click="showAllSizes">查看全部</text>
      </view>
      <view class="hot-grid">
        <view
          class="hot-item"
          v-for="s in hotSizes" :key="s.id"
          hover-class="item-hover"
          @click="choosePhotoForSize(s)"
        >
          <view class="hot-preview-wrap">
            <view class="hot-preview" :style="hotPreviewStyle(s)" />
          </view>
          <view class="hot-info">
            <text class="hot-name">{{ s.label }}</text>
            <text class="hot-desc">{{ s.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 使用步骤 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">制作流程</text>
      </view>
      <view class="step-flow">
        <view class="step-flow-item" v-for="(step, index) in steps" :key="index">
          <view class="step-icon-wrap">
            <text class="step-icon">{{ step.icon }}</text>
          </view>
          <text class="step-title">{{ step.title }}</text>
          <view class="step-line" v-if="index < steps.length - 1"></view>
        </view>
      </view>
    </view>

    <view class="footer-action">
      <button class="btn-main" hover-class="btn-hover" @click="choosePhoto">
        立即开始制作
      </button>
    </view>

    <ad unit-id="your-banner-unit-id" ad-type="banner" class="ad-banner" />

  </view>
</template>

<script>
import { PHOTO_SIZES } from '../../utils/config.js'

export default {
  name: 'IndexPage',
  data() {
    return {
      hotSizes: PHOTO_SIZES.filter(s => s.popular).slice(0, 4),
      steps: [
        { icon: '📸', title: '上传照片' },
        { icon: '✂️', title: 'AI抠图' },
        { icon: '🎨', title: '选底色' },
        { icon: '✨', title: '美化保存' },
      ],
    }
  },
  methods: {
    choosePhoto(preSize = null) {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const filePath = res.tempFilePaths[0]
          // 确保 preSize 是一个对象并且有 id 属性
          const sizeParam = (preSize && typeof preSize === 'object' && preSize.id) ? `&preSize=${preSize.id}` : ''
          uni.navigateTo({
            url: `/pages/editor/index?filePath=${encodeURIComponent(filePath)}${sizeParam}`,
          })
        },
        fail(err) {
          if (err.errMsg && !err.errMsg.includes('cancel')) {
            uni.showToast({ title: '选择图片失败', icon: 'none' })
          }
        },
      })
    },
    choosePhotoForSize(size) {
      // 这里传递的是完整的 size 对象
      this.choosePhoto(size)
    },
    hotPreviewStyle(size) {
      const maxW = 48, maxH = 64
      const ratio = size.w / size.h
      let w, h
      if (ratio > 1) { w = maxW; h = maxW / ratio }
      else           { h = maxH; w = maxH * ratio }
      return { 
        width: w + 'rpx', 
        height: h + 'rpx', 
        boxShadow: '0 4rpx 12rpx rgba(0,0,0,0.5)',
        background: 'linear-gradient(135deg, #3A3A3C, #1C1C1E)'
      }
    },
    showAllSizes() {
      uni.navigateTo({ url: '/pages/sizes/index' })
    },
  },
}
</script>

<style lang="scss" scoped>
.page {
  padding: 40rpx 32rpx 200rpx;
  min-height: 100vh;
}

.header {
  margin-bottom: 60rpx;
  .header-title {
    font-size: 64rpx;
    font-weight: 800;
    background: $uni-main-gradient;
    -webkit-background-clip: text;
    color: transparent;
    letter-spacing: 2rpx;
  }
  .header-badge {
    display: flex;
    align-items: center;
    margin-top: 12rpx;
    background: rgba(255, 255, 255, 0.05);
    padding: 6rpx 20rpx;
    border-radius: 40rpx;
    width: fit-content;
  }
  .badge-dot {
    width: 8rpx;
    height: 8rpx;
    background: $uni-color-primary;
    border-radius: 50%;
    margin-right: 12rpx;
    box-shadow: 0 0 8rpx $uni-color-primary;
  }
  .header-desc {
    font-size: 24rpx;
    color: $uni-text-color-grey;
  }
}

.upload-section {
  @include premium-card;
  padding: 80rpx 40rpx;
  margin-bottom: 48rpx;
  position: relative;
  overflow: hidden;
  @include press-effect;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, rgba(230, 200, 117, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  
  .upload-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    z-index: 1;
  }
  
  .upload-icon-box {
    position: relative;
    width: 160rpx;
    height: 160rpx;
    margin-bottom: 40rpx;
    
    .icon-circle {
      width: 100%;
      height: 100%;
      background: $uni-main-gradient;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      position: relative;
      box-shadow: 0 12rpx 32rpx rgba(230, 200, 117, 0.4), inset 0 4rpx 12rpx rgba(255, 255, 255, 0.5);
    }
    
    .plus-icon {
      font-size: 72rpx;
      color: #1a1400;
      font-weight: bold;
      text-shadow: 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
    }
    
    .ripple {
      position: absolute;
      top: -10rpx; left: -10rpx; right: -10rpx; bottom: -10rpx;
      border: 2rpx solid rgba(230, 200, 117, 0.6);
      border-radius: 50%;
      animation: pulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      z-index: 1;
    }
  }
  
  .main-tip {
    font-size: 40rpx;
    font-weight: 800;
    color: #fff;
    display: block;
    margin-bottom: 16rpx;
    letter-spacing: 2rpx;
  }
  .sub-tip {
    font-size: 26rpx;
    color: $uni-text-color-grey;
  }
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.8; border-width: 4rpx; }
  100% { transform: scale(1.5); opacity: 0; border-width: 1rpx; }
}

.section {
  margin-bottom: 48rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    padding: 0 4rpx;
  }
  .section-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #fff;
  }
  .section-more {
    font-size: 24rpx;
    color: $uni-text-color-grey;
    display: flex;
    align-items: center;
    &::after {
      content: '';
      display: inline-block;
      width: 12rpx;
      height: 12rpx;
      border-top: 3rpx solid $uni-text-color-grey;
      border-right: 3rpx solid $uni-text-color-grey;
      transform: rotate(45deg);
      margin-left: 8rpx;
    }
  }
}

.hot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.hot-item {
  @include premium-card;
  padding: 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  position: relative;
  overflow: hidden;
  @include press-effect;
  
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border: 1rpx solid rgba(230, 200, 117, 0.1);
    border-radius: inherit;
    pointer-events: none;
  }
  
  .hot-preview-wrap {
    width: 80rpx;
    height: 100rpx;
    background: rgba(0,0,0,0.3);
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 2rpx 8rpx rgba(255,255,255,0.05);
  }
  
  .hot-name {
    font-size: 28rpx;
    font-weight: 600;
    color: #fff;
    display: block;
  }
  .hot-desc {
    font-size: 22rpx;
    color: $uni-text-color-grey;
    margin-top: 6rpx;
  }
}

.step-flow {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32rpx 20rpx;
  @include premium-card;
  background: rgba(28, 28, 30, 0.6);
}

.step-flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
  position: relative;
  z-index: 2;
}

.step-icon {
  font-size: 40rpx;
}

.step-title {
  font-size: 24rpx;
  color: #E8E0D0;
  font-weight: 500;
}

.step-line {
  position: absolute;
  top: 44rpx;
  left: 50%;
  width: 100%;
  height: 2rpx;
  background: linear-gradient(90deg, rgba(230, 200, 117, 0.2) 0%, rgba(230, 200, 117, 0) 100%);
  z-index: 1;
}

.footer-action {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 40rpx 32rpx 60rpx;
  background: linear-gradient(to top, #121212 80%, transparent);
  z-index: 10;
}

.btn-main {
  width: 100%;
  height: 100rpx;
  line-height: 100rpx;
  background: $uni-main-gradient;
  border-radius: 50rpx;
  color: #1a1400;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 24rpx rgba(230, 200, 117, 0.2);
  @include press-effect;
}

.ad-banner {
  margin-top: 40rpx;
  border-radius: 16rpx;
  overflow: hidden;
}
</style>

