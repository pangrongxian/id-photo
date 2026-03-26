<template>
  <view class="page">

    <!-- 预览区 -->
    <view class="preview-wrap">
      <view class="preview-bg" :style="{ background: colorHex }">
        <canvas type="2d" id="beautyCanvas" class="beauty-canvas"
          :style="{ width: previewW + 'px', height: previewH + 'px' }" />
      </view>
      <view class="compare-hint" v-if="compareMode">
        <text>对比原图中…</text>
      </view>
      
      <!-- 悬浮对比按钮 -->
      <view class="float-compare" 
        @touchstart="compareMode = true"
        @touchend="compareMode = false"
        @touchcancel="compareMode = false">
        <text class="icon">◐</text>
        <text>按住对比</text>
      </view>
    </view>

    <!-- 顶部操作栏 (原对比按钮位置，现只保留重置) -->
    <view class="top-actions">
      <view class="action-spacer"></view>
      <button class="btn-reset" @click="resetBeauty">
        <text class="icon">↺</text> 重置参数
      </button>
    </view>

    <!-- 美颜调节面板 -->
    <view class="panel">

      <view class="panel-title">美化调整</view>

      <view class="adjust-item" v-for="item in adjustItems" :key="item.key">
        <view class="adjust-header">
          <text class="adjust-icon">{{ item.icon }}</text>
          <text class="adjust-label">{{ item.label }}</text>
          <text :class="['adjust-val', beauty[item.key] !== 0 ? 'active' : '']">
            {{ beauty[item.key] > 0 ? '+' : '' }}{{ beauty[item.key] }}
          </text>
        </view>
        <view class="slider-wrap">
          <text class="slider-edge">{{ item.min }}</text>
          <slider
            class="adjust-slider"
            :value="beauty[item.key]"
            :min="item.min" :max="item.max" :step="item.step"
            activeColor="#c9a84c" backgroundColor="#2e2b24" block-color="#e8c96a"
            @change="(e) => onSliderChange(item.key, e)"
            @changing="(e) => onSliderChanging(item.key, e)"
          />
          <text class="slider-edge">{{ item.max }}</text>
        </view>
        <text class="adjust-desc">{{ item.desc }}</text>
      </view>

    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="btn-ghost-sm" @click="goBack">上一步</button>
      <button class="btn-next-sm" @click="doGenerate" :disabled="generating">
        {{ generating ? '生成中…' : '生成证件照' }}
      </button>
    </view>

    <!-- 高清输出用的隐藏canvas -->
    <canvas type="2d" id="outputCanvas"
      style="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;" />

  </view>
</template>

<script>
import { DEFAULT_BEAUTY } from '../../utils/config.js'
import { getCanvasNode, renderPreview, compositePhoto } from '../../utils/canvas.js'

export default {
  name: 'BeautyPage',
  data() {
    return {
      // 从globalData读取
      fgBase64:     '',
      selectedSize: null,
      selectedColor: null,
      colorHex:     '#FFFFFF',
      colorRgb:     [255, 255, 255],

      // 预览尺寸
      previewW: 150,
      previewH: 200,

      // 美颜参数
      beauty: { ...DEFAULT_BEAUTY },

      // 状态
      compareMode: false,
      generating:  false,
      debounceTimer: null,

      // 调节项配置
      adjustItems: [
        {
          key: 'brightness', icon: '☀️', label: '亮度',
          min: -80, max: 80, step: 5,
          desc: '调亮可改善证件照曝光不足，偏暗的照片可适当调高',
        },
        {
          key: 'contrast', icon: '◑', label: '对比度',
          min: -50, max: 80, step: 5,
          desc: '提高对比度让照片更立体，但过高会显得不自然',
        },
        {
          key: 'smooth', icon: '✨', label: '磨皮',
          min: 0, max: 60, step: 5,
          desc: '轻微磨皮可以改善皮肤质感，建议不超过30',
        },
        {
          key: 'sharpen', icon: '🔍', label: '锐化',
          min: 0, max: 80, step: 5,
          desc: '轻微锐化使照片更清晰，手机拍摄的照片可适当提高',
        },
      ],
    }
  },
  onLoad() {
    // 从全局数据读取（editor页通过globalData传递）
    const g = getApp().globalData || {}
    this.fgBase64      = g.fgBase64      || ''
    this.selectedSize  = g.selectedSize  || null
    this.selectedColor = g.selectedColor || null

    if (this.selectedColor) {
      this.colorHex = this.selectedColor.hex
      this.colorRgb = this.selectedColor.rgb
    }

    if (this.selectedSize) {
      const ratio = this.selectedSize.w / this.selectedSize.h
      if (ratio >= 1) { this.previewW = 200; this.previewH = Math.round(200 / ratio) }
      else            { this.previewH = 260; this.previewW = Math.round(260 * ratio)  }
    }
  },
  onReady() {
    // 页面渲染完成后初始化预览
    setTimeout(() => this.doPreview(), 300)
  },
  methods: {
    // 滑块松开时更新（change事件）
    onSliderChange(key, e) {
      this.beauty[key] = e.detail.value
      this.doPreview()
    },
    // 滑块拖动中防抖更新
    onSliderChanging(key, e) {
      this.beauty[key] = e.detail.value
      this.debouncePreview()
    },

    debouncePreview() {
      if (this.debounceTimer) clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => this.doPreview(), 100)
    },

    async doPreview() {
      if (!this.fgBase64) return
      try {
        const canvas = await getCanvasNode('beautyCanvas', this)
        await renderPreview({
          fgBase64: this.fgBase64,
          bgRgb:    this.colorRgb,
          displayW: this.previewW,
          displayH: this.previewH,
          canvas,
          beauty:   this.beauty,
        })
      } catch (e) {}
    },

    resetBeauty() {
      this.beauty = { ...DEFAULT_BEAUTY }
      this.doPreview()
    },

    goBack() {
      uni.navigateBack()
    },

    // 生成最终高清证件照
    async doGenerate() {
      if (this.generating || !this.fgBase64 || !this.selectedSize) return
      this.generating = true
      uni.showLoading({ title: '生成中…', mask: true })

      try {
        const canvas = await getCanvasNode('outputCanvas', this)
        const outputPath = await compositePhoto({
          fgBase64: this.fgBase64,
          bgRgb:    this.colorRgb,
          targetW:  this.selectedSize.w,
          targetH:  this.selectedSize.h,
          canvas,
          beauty:   this.beauty,
        })

        uni.hideLoading()

        // 同步结果数据到globalData，结果页读取
        const g = getApp().globalData || {}
        g.outputPath   = outputPath
        g.selectedSize  = this.selectedSize
        g.selectedColor = this.selectedColor
        g.beauty        = { ...this.beauty }

        uni.navigateTo({
          url: `/pages/result/index`,
        })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '生成失败，请重试', icon: 'none' })
      } finally {
        this.generating = false
      }
    },
  },
}
</script>

<style scoped>
page { background: #000000; }
.page { background: #000000; min-height: 100vh; padding: 28rpx 28rpx 160rpx; }

/* 预览 */
.preview-wrap {
  display: flex; justify-content: center; margin-bottom: 20rpx; position: relative;
}
.preview-bg {
  border-radius: 24rpx; padding: 28rpx;
  display: flex; justify-content: center; align-items: center;
  min-width: 280rpx; min-height: 320rpx;
  transition: background 0.3s ease;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.4);
}
.beauty-canvas { display: block; border-radius: 8rpx; }
.compare-hint {
  position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; border-radius: 24rpx;
  z-index: 10;
}
.compare-hint text { font-size: 28rpx; color: #E8E0D0; font-weight: 600; letter-spacing: 2rpx; }

/* 悬浮对比按钮 (Glassmorphism) */
.float-compare {
  position: absolute; right: 24rpx; bottom: 24rpx;
  background: rgba(28, 28, 30, 0.6);
  backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 40rpx; padding: 16rpx 32rpx;
  display: flex; align-items: center; gap: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
  z-index: 20; transition: all 0.2s ease;
}
.float-compare:active { transform: scale(0.95); background: rgba(28, 28, 30, 0.8); }
.float-compare .icon { font-size: 32rpx; color: #E6C875; }
.float-compare text:last-child { font-size: 24rpx; color: #E8E0D0; font-weight: 600; }

/* 顶部操作栏 */
.top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28rpx; }
.action-spacer { flex: 1; }
.btn-reset {
  background: rgba(255, 255, 255, 0.05); border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 32rpx; padding: 12rpx 28rpx; font-size: 24rpx; color: #8E8E93;
  display: flex; align-items: center; gap: 8rpx; margin: 0; line-height: 1.5;
  transition: all 0.2s ease;
}
.btn-reset:active { transform: scale(0.95); background: rgba(255, 255, 255, 0.1); }
.btn-reset .icon { font-size: 26rpx; }

/* 面板 */
.panel {
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx; padding: 32rpx 28rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}
.panel-title {
  font-size: 28rpx; font-weight: 700; color: #E6C875; letter-spacing: 2rpx;
  margin-bottom: 32rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

/* 调节项 */
.adjust-item { margin-bottom: 32rpx; padding-bottom: 32rpx; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05); }
.adjust-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.adjust-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.adjust-icon  { font-size: 32rpx; }
.adjust-label { font-size: 28rpx; color: #E8E0D0; font-weight: 600; flex: 1; }
.adjust-val   { 
  font-size: 28rpx; color: #8E8E93; font-family: monospace; 
  min-width: 60rpx; text-align: right; transition: color 0.3s ease;
}
.adjust-val.active { color: #E6C875; font-weight: 700; }
.slider-wrap  { display: flex; align-items: center; gap: 16rpx; margin-bottom: 12rpx; }
.slider-edge  { font-size: 22rpx; color: #8E8E93; flex-shrink: 0; min-width: 40rpx; text-align: center; }
.adjust-slider { flex: 1; margin: 0 10rpx; }
.adjust-desc  { font-size: 22rpx; color: #8E8E93; line-height: 1.6; }

/* 底部 */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; gap: 20rpx;
  padding: 24rpx 32rpx 64rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.9) 60%, transparent);
  backdrop-filter: blur(10px); z-index: 100;
}
.btn-next-sm {
  flex: 2; background: linear-gradient(135deg, #E6C875, #C89D3C);
  color: #1a1400; border: none; border-radius: 24rpx; padding: 28rpx;
  font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(230, 200, 117, 0.3);
  transition: all 0.2s ease;
}
.btn-next-sm:active { transform: scale(0.98); box-shadow: 0 4rpx 12rpx rgba(230, 200, 117, 0.2); }
.btn-next-sm[disabled] { opacity: 0.6; box-shadow: none; }
.btn-ghost-sm {
  flex: 1; background: rgba(255, 255, 255, 0.05); color: #E8E0D0;
  border: 1rpx solid rgba(255, 255, 255, 0.1); border-radius: 24rpx; padding: 28rpx; 
  font-size: 30rpx; font-weight: 600; transition: all 0.2s ease;
}
.btn-ghost-sm:active { transform: scale(0.98); background: rgba(255, 255, 255, 0.1); }
</style>
