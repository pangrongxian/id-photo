<template>
  <view class="page">

    <!-- 步骤条 -->
    <view class="steps-bar">
      <view v-for="(s, i) in stepLabels" :key="i"
        :class="['step-item', currentStep === i ? 'active' : currentStep > i ? 'done' : '']">
        <view class="step-circle">
          <text class="step-circle-text">{{ currentStep > i ? '✓' : i + 1 }}</text>
        </view>
        <text class="step-label">{{ s }}</text>
      </view>
      <view class="step-track" />
    </view>

    <!-- ══════════ STEP 0：选择尺寸 ══════════ -->
    <view v-if="currentStep === 0" class="step-content">

      <!-- 分类tabs -->
      <scroll-view scroll-x class="tab-scroll">
        <view class="tab-list">
          <view v-for="cat in categories" :key="cat"
            :class="['tab-btn', activeCat === cat ? 'active' : '']"
            @click="activeCat = cat">
            <text>{{ cat }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 尺寸列表 -->
      <view class="size-list">
        <view v-for="size in filteredSizes" :key="size.id"
          :class="['size-row', selectedSize && selectedSize.id === size.id ? 'active' : '']"
          @click="selectedSize = size">
          <!-- 比例预览块 -->
          <view class="size-thumb-wrap">
            <view class="size-thumb" :style="thumbStyle(size)" />
          </view>
          <view class="size-info">
            <view class="size-name-row">
              <text class="size-name">{{ size.label }}</text>
              <view class="size-hot-badge" v-if="size.popular"><text>热门</text></view>
            </view>
            <text class="size-meta">{{ size.desc }} · {{ size.w }}×{{ size.h }}px</text>
          </view>
          <view :class="['size-check', selectedSize && selectedSize.id === size.id ? 'checked' : '']">
            <text v-if="selectedSize && selectedSize.id === size.id">✓</text>
          </view>
        </view>
      </view>

      <view class="bottom-bar">
        <button :class="['btn-next', !selectedSize ? 'disabled' : '']" @click="step0Next">
          下一步：AI抠图
        </button>
      </view>
    </view>

    <!-- ══════════ STEP 1：AI抠图 ══════════ -->
    <view v-if="currentStep === 1" class="step-content">

      <!-- 原图预览 -->
      <view class="origin-preview">
        <image class="origin-img" :src="filePath" mode="aspectFit" />
        <view class="origin-tag"><text>原始照片</text></view>
      </view>

      <!-- 处理状态卡 -->
      <view class="process-card">
        <!-- 处理中 -->
        <view v-if="seg.state === 'loading'" class="seg-state">
          <view class="spinner" />
          <text class="seg-title">AI正在识别人像…</text>
          <text class="seg-sub">通常需要 3 ～ 10 秒，请勿关闭页面</text>
          <view class="seg-tips">
            <text class="seg-tip-item" v-for="t in segTips" :key="t">· {{ t }}</text>
          </view>
        </view>

        <!-- 成功 -->
        <view v-if="seg.state === 'done'" class="seg-state">
          <view class="seg-ok-icon"><text>✓</text></view>
          <text class="seg-title">人像识别完成</text>
          <text class="seg-sub">已成功分离人像，可继续操作</text>
          <view class="seg-btn-group">
            <button class="btn-ghost" @click="gotoRefine">手动微调</button>
            <button class="btn-next" @click="currentStep = 2">下一步</button>
          </view>
        </view>

        <!-- 失败 -->
        <view v-if="seg.state === 'error'" class="seg-state">
          <text class="seg-err-icon">✕</text>
          <text class="seg-title">抠图失败</text>
          <text class="seg-sub">{{ seg.errMsg }}</text>
          <button class="btn-retry" @click="doSegment">重新尝试</button>
          <button class="btn-ghost" @click="currentStep = 0">返回重选</button>
        </view>
      </view>
    </view>

    <!-- ══════════ STEP 2：选背景色 ══════════ -->
    <view v-if="currentStep === 2" class="step-content">

      <!-- 实时预览 -->
      <view class="preview-section">
        <view class="preview-label-row">
          <text class="section-label">预览效果</text>
          <text class="preview-size-hint">{{ selectedSize && selectedSize.label }} · {{ selectedColor.label }}背景</text>
        </view>
        <view class="preview-canvas-wrap" :style="{ background: selectedColor.hex }">
          <canvas type="2d" id="previewCanvas" class="preview-canvas"
            :style="{ width: previewW + 'px', height: previewH + 'px' }" />
        </view>
      </view>

      <!-- 颜色选择 -->
      <view class="section-label" style="margin-bottom:16rpx;">选择背景颜色</view>
      <scroll-view scroll-x class="color-scroll">
        <view class="color-list">
          <view v-for="c in bgColors" :key="c.id"
            :class="['color-item', selectedColor.id === c.id ? 'active' : '']"
            @click="onColorSelect(c)">
            <view class="color-swatch" :style="swatchStyle(c)" />
            <text class="color-name">{{ c.label }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="bottom-bar two-btn">
        <button class="btn-ghost-sm" @click="currentStep = 1">上一步</button>
        <button class="btn-next-sm" @click="step2Next">下一步：美化</button>
      </view>
    </view>

    <!-- 隐藏的高清输出 canvas -->
    <!-- ══════════ STEP 3：美化调整 ══════════ -->
    <view v-if="currentStep === 3" class="step-content">
      <!-- 预览区 -->
      <view class="preview-section">
        <view class="preview-label-row">
          <text class="section-label">预览效果</text>
          <view class="float-compare" 
            @touchstart="compareMode = true"
            @touchend="compareMode = false"
            @touchcancel="compareMode = false">
            <text class="icon">◐</text>
            <text>按住对比</text>
          </view>
        </view>
        <view class="preview-canvas-wrap" :style="{ background: selectedColor.hex }">
          <canvas type="2d" id="beautyCanvas" class="preview-canvas"
            :style="{ width: previewW + 'px', height: previewH + 'px' }" />
          <view class="compare-hint" v-if="compareMode">
            <text>对比原图中…</text>
          </view>
        </view>
      </view>

      <!-- 美颜调节面板 -->
      <beauty-panel v-model="beauty" @reset="resetBeauty" @update:modelValue="debouncePreview(true)" />

      <view class="bottom-bar two-btn">
        <button class="btn-ghost-sm" @click="currentStep = 2">上一步</button>
        <button class="btn-next-sm" @click="doGenerate" :disabled="generating">
          {{ generating ? '生成中…' : '生成证件照' }}
        </button>
      </view>
    </view>

    <!-- 隐藏的高清输出 canvas -->
    <canvas type="2d" id="outputCanvas"
      style="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;" />

  </view>
</template>

<script>
import { BG_COLORS, PHOTO_SIZES, DEFAULT_BEAUTY } from '../../utils/config.js'
import { fileToBase64, segmentHuman, detectFace } from '../../utils/baidu.js'
import { getCanvasNode, renderPreview, compositePhoto } from '../../utils/canvas.js'
import { usePhotoStore } from '../../store/photo.js'
import BeautyPanel from '../../components/BeautyPanel/index.vue'

export default {
  name: 'EditorPage',
  components: { BeautyPanel },
  data() {
    return {
      filePath:      '',
      fgBase64:      '',
      currentStep:   0,
      stepLabels:    ['选尺寸', '抠图', '选背景', '美化'],

      // Step 0
      activeCat:     '全部',
      categories:    ['全部', '通用', '出行', '证件', '学历', '考试', '职场'],
      selectedSize:  null,
      preSize:       '',   // 从首页热门快捷入口带入的预选尺寸ID

      // Step 1
      seg: { state: 'loading', errMsg: '' },
      faceInfo: null,
      segTips: [
        '照片越清晰，抠图效果越好',
        '建议使用正面照，光线均匀',
        '背景与人像对比越大越精准',
      ],

      // Step 2
      bgColors:      BG_COLORS,
      selectedColor: BG_COLORS[0],
      previewW:      150,
      previewH:      200,
      previewTimer:  null,

      // Step 3
      beauty: { ...DEFAULT_BEAUTY },
      compareMode: false,
      generating:  false,
    }
  },
  computed: {
    filteredSizes() {
      if (this.activeCat === '全部') return PHOTO_SIZES
      return PHOTO_SIZES.filter(s => s.category === this.activeCat)
    },
  },
  onLoad(options) {
    this.filePath = decodeURIComponent(options.filePath || '')
    this.preSize  = options.preSize || ''

    // 如果有预选尺寸，自动选中
    if (this.preSize) {
      const found = PHOTO_SIZES.find(s => s.id === this.preSize)
      if (found) this.selectedSize = found
    }
  },
  methods: {
    // ── 尺寸预览缩略图样式 ──
    thumbStyle(size) {
      const maxW = 48, maxH = 56
      const ratio = size.w / size.h
      let w, h
      if (ratio >= 1) { w = maxW; h = maxW / ratio }
      else            { h = maxH; w = maxH * ratio }
      return { width: w + 'rpx', height: h + 'rpx', background: '#2e2b24', borderRadius: '4rpx' }
    },

    // ── Step 0 → 1 ──
    step0Next() {
      if (!this.selectedSize) return
      // 计算预览尺寸（保持比例，最高260px）
      const ratio = this.selectedSize.w / this.selectedSize.h
      if (ratio >= 1) { this.previewW = 200; this.previewH = Math.round(200 / ratio) }
      else            { this.previewH = 260; this.previewW = Math.round(260 * ratio)  }
      this.currentStep = 1
      this.doSegment()
    },

    // ── 抠图 ──
    async doSegment() {
      this.seg = { state: 'loading', errMsg: '' }
      try {
        const { base64 } = await fileToBase64(this.filePath)
        this.fgBase64 = await segmentHuman(base64)

        // 补充人脸检测逻辑，用于智能构图
        try {
          this.faceInfo = await detectFace(base64)
        } catch (e) {
          console.error('人脸检测失败，将使用默认居中构图', e)
        }

        this.seg.state = 'done'
      } catch (e) {
        this.seg = { state: 'error', errMsg: e.message || '未知错误，请重试' }
      }
    },

    // ── 颜色选择 ──
    onColorSelect(color) {
      this.selectedColor = color
      this.debouncePreview()
    },

    // ── 防抖预览渲染（避免频繁切换颜色重复渲染）──
    debouncePreview(isBeauty = false) {
      if (this.previewTimer) clearTimeout(this.previewTimer)
      this.previewTimer = setTimeout(() => this.doPreview(isBeauty), 80)
    },

    async doPreview(isBeauty = false) {
      if (!this.fgBase64) return
      try {
        const canvasId = isBeauty ? 'beautyCanvas' : 'previewCanvas'
        const canvas = await getCanvasNode(canvasId, this)
        await renderPreview({
          fgBase64:  this.fgBase64,
          bgRgb:     this.selectedColor.rgb,
          displayW:  this.previewW,
          displayH:  this.previewH,
          canvas,
          faceInfo:  this.faceInfo,
          beauty:    isBeauty ? this.beauty : null,
        })
      } catch (e) {}
    },

    // ── 进入颜色页时初始化预览 ──
    onEnterColorStep() {
      this.$nextTick(() => setTimeout(() => this.doPreview(false), 300))
    },

    onEnterBeautyStep() {
      this.$nextTick(() => setTimeout(() => this.doPreview(true), 300))
    },

    // ── Step 2 → 3 ──
    step2Next() {
      this.currentStep = 3
    },

    // 颜色swatch样式
    swatchStyle(c) {
      return {
        background: c.hex,
        border: c.id === 'white' ? '2rpx solid #3a3520' : 'none',
      }
    },

    // ── Step 3: Beauty ──
    resetBeauty() {
      this.beauty = { ...DEFAULT_BEAUTY }
      this.doPreview(true)
    },

    gotoRefine() {
      uni.navigateTo({ url: '/pages/refine/index' })
    },

    // ── Step 3 → 生成 ──
    async doGenerate() {
      if (this.generating) return
      this.generating = true
      uni.showLoading({ title: '生成中…', mask: true })

      try {
        const canvas = await getCanvasNode('outputCanvas', this)

        uni.showLoading({ title: '生成高清图中…', mask: true })
        const outputPath = await compositePhoto({
          fgBase64: this.fgBase64, // 直接使用前景，美颜在 compositePhoto 中处理
          bgRgb:    this.selectedColor.rgb,
          targetW:  this.selectedSize.w,
          targetH:  this.selectedSize.h,
          canvas,
          faceInfo: this.faceInfo,
          beauty:   this.beauty,
        })

        uni.hideLoading()

        const photoStore = usePhotoStore()
        photoStore.setResultData({
          outputPath,
          selectedSize:  this.selectedSize,
          selectedColor: this.selectedColor,
          beauty:        { ...this.beauty },
        })

        uni.navigateTo({ url: `/pages/result/index` })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '生成失败', icon: 'none' })
      } finally {
        this.generating = false
      }
    },
  },
  watch: {
    currentStep(val) {
      if (val === 2) this.onEnterColorStep()
      if (val === 3) this.onEnterBeautyStep()
    },
  },
}
</script>

<style scoped>
page { background: #0f0e0c; }
.page { background: #0f0e0c; min-height: 100vh; padding-bottom: 160rpx; }

/* 步骤条 */
.steps-bar {
  display: flex; align-items: flex-start; justify-content: center;
  padding: 32rpx 28rpx 40rpx; position: relative; gap: 0;
}
.step-track {
  position: absolute; top: 52rpx; left: 20%; right: 20%;
  height: 4rpx; background: rgba(255, 255, 255, 0.05); z-index: 0;
  border-radius: 2rpx;
}
.step-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12rpx; z-index: 1;
}
.step-circle {
  width: 48rpx; height: 48rpx; border-radius: 50%;
  background: #1C1C1E; border: 2rpx solid rgba(255, 255, 255, 0.1);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.step-circle-text { font-size: 20rpx; color: #8E8E93; transition: all 0.3s ease; }
.step-label       { font-size: 22rpx; color: #8E8E93; transition: all 0.3s ease; }
.step-item.active .step-circle { 
  background: linear-gradient(135deg, #E6C875, #C89D3C); 
  border-color: transparent; 
  box-shadow: 0 0 16rpx rgba(230, 200, 117, 0.4);
  transform: scale(1.1);
}
.step-item.active .step-circle-text { color: #1a1400; font-weight: 700; }
.step-item.active .step-label { color: #E6C875; font-weight: 600; }
.step-item.done .step-circle  { 
  background: rgba(52, 199, 89, 0.1); 
  border-color: #34C759; 
}
.step-item.done .step-circle-text { color: #34C759; }

.step-content { padding: 0 28rpx; }

/* Tab */
.tab-scroll  { margin-bottom: 20rpx; }
.tab-list    { display: flex; gap: 12rpx; padding-bottom: 4rpx; }
.tab-btn     {
  display: inline-flex; padding: 10rpx 28rpx; flex-shrink: 0;
  background: #1a1815; border: 1rpx solid #2e2b24; border-radius: 40rpx;
}
.tab-btn text     { font-size: 24rpx; color: #8a8070; }
.tab-btn.active   { background: rgba(201,168,76,.14); border-color: #c9a84c; }
.tab-btn.active text { color: #e8c96a; }

/* 尺寸列表 */
.size-list { display: flex; flex-direction: column; gap: 12rpx; margin-bottom: 120rpx; }
.size-row  {
  display: flex; align-items: center; gap: 20rpx;
  background: #1a1815; border: 1rpx solid #2e2b24; border-radius: 16rpx; padding: 20rpx;
}
.size-row.active { border-color: #c9a84c; background: rgba(201,168,76,.07); }
.size-thumb-wrap { width: 80rpx; display: flex; justify-content: center; align-items: center; flex-shrink: 0; }
.size-info  { flex: 1; }
.size-name-row { display: flex; align-items: center; gap: 10rpx; margin-bottom: 6rpx; }
.size-name  { font-size: 28rpx; color: #e8e0d0; font-weight: 600; }
.size-hot-badge {
  background: rgba(201,168,76,.15); border: 1rpx solid #7a6530;
  border-radius: 6rpx; padding: 2rpx 8rpx;
}
.size-hot-badge text { font-size: 18rpx; color: #c9a84c; }
.size-meta  { font-size: 22rpx; color: #4a4540; }
.size-check {
  width: 44rpx; height: 44rpx; border-radius: 50%;
  border: 2rpx solid #2e2b24; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.size-check text  { font-size: 22rpx; color: #6ab87a; }
.size-check.checked { border-color: #6ab87a; background: rgba(106,184,122,.12); }

/* 抠图状态 */
.origin-preview {
  background: #1a1815; border: 1rpx solid #2e2b24; border-radius: 20rpx;
  padding: 28rpx; display: flex; justify-content: center; margin-bottom: 20rpx; position: relative;
}
.origin-img { width: 300rpx; height: 380rpx; border-radius: 8rpx; }
.origin-tag {
  position: absolute; bottom: 36rpx; left: 50%; transform: translateX(-50%);
  background: rgba(15,14,12,.7); border-radius: 8rpx; padding: 4rpx 16rpx;
}
.origin-tag text { font-size: 20rpx; color: #8a8070; }

.process-card {
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05); border-radius: 32rpx;
  padding: 80rpx 40rpx; text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}
.seg-state { display: flex; flex-direction: column; align-items: center; gap: 20rpx; }
.seg-btn-group { display: flex; gap: 20rpx; width: 100%; margin-top: 20rpx; }
.seg-btn-group .btn-ghost { flex: 1; background: transparent; color: #c9a84c; border: 1rpx solid #c9a84c; padding: 24rpx; font-size: 28rpx; }
.seg-btn-group .btn-next { flex: 1.5; background: #c9a84c; color: #1a1400; border: none; padding: 24rpx; font-size: 28rpx; font-weight: 700; }
.spinner {
  width: 100rpx; height: 100rpx; border-radius: 50%;
  border: 6rpx solid rgba(255, 255, 255, 0.05); border-top-color: #E6C875;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  box-shadow: 0 0 20rpx rgba(230, 200, 117, 0.2);
}
@keyframes spin { to { transform: rotate(360deg); } }
.seg-ok-icon {
  width: 120rpx; height: 120rpx; border-radius: 50%;
  background: rgba(52, 199, 89, 0.1); border: 2rpx solid #34C759;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 32rpx rgba(52, 199, 89, 0.2);
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.seg-ok-icon text { font-size: 56rpx; color: #34C759; }
.seg-err-icon     { font-size: 72rpx; color: #FF453A; }
.seg-title  { font-size: 34rpx; color: #E8E0D0; font-weight: 700; letter-spacing: 2rpx; }
.seg-sub    { font-size: 24rpx; color: #8E8E93; }
.seg-tips   { 
  display: flex; flex-direction: column; gap: 12rpx; margin-top: 16rpx;
  background: rgba(255, 255, 255, 0.03); padding: 24rpx 32rpx; border-radius: 16rpx;
}
.seg-tip-item { font-size: 22rpx; color: #8E8E93; text-align: left; }

/* 预览 */
.preview-section { margin-bottom: 28rpx; }
.preview-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14rpx; }
.section-label { font-size: 26rpx; font-weight: 700; color: #c9a84c; }
.preview-size-hint { font-size: 20rpx; color: #4a4540; }
.preview-canvas-wrap {
  border-radius: 16rpx; display: flex; justify-content: center; align-items: center;
  padding: 32rpx; min-height: 320rpx;
}
.preview-canvas { display: block; }

/* 颜色选择 */
.color-scroll { margin-bottom: 32rpx; }
.color-list   { display: flex; gap: 20rpx; padding-bottom: 16rpx; padding-top: 8rpx; }
.color-item   {
  display: flex; flex-direction: column; align-items: center; gap: 12rpx;
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05); border-radius: 20rpx;
  padding: 20rpx 16rpx; flex-shrink: 0; min-width: 120rpx;
  transition: all 0.25s ease;
}
.color-item.active { 
  border-color: #E6C875; 
  background: rgba(230, 200, 117, 0.08);
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 24rpx rgba(230, 200, 117, 0.15);
}
.color-swatch { 
  width: 72rpx; height: 72rpx; border-radius: 50%; 
  transition: all 0.25s ease;
}
.color-item.active .color-swatch {
  box-shadow: 0 0 0 4rpx rgba(230, 200, 117, 0.3);
}
.color-name   { font-size: 22rpx; color: #8E8E93; transition: all 0.25s ease; }
.color-item.active .color-name { color: #E6C875; font-weight: 600; }

/* 底部按钮 */
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 20rpx 28rpx 48rpx;
  background: linear-gradient(to top, #0f0e0c 70%, transparent);
}
.bottom-bar.two-btn { display: flex; gap: 16rpx; }
.btn-next {
  width: 100%; background: linear-gradient(135deg, #7a6530, #c9a84c);
  color: #1a1400; border: none; border-radius: 18rpx; padding: 32rpx;
  font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx;
}
.btn-next.disabled { opacity: 0.4; }
.btn-next-sm {
  flex: 2; background: linear-gradient(135deg, #7a6530, #c9a84c);
  color: #1a1400; border: none; border-radius: 18rpx; padding: 28rpx;
  font-size: 28rpx; font-weight: 700;
}
.btn-ghost-sm {
  flex: 1; background: transparent; color: #8a8070;
  border: 1rpx solid #2e2b24; border-radius: 18rpx; padding: 28rpx; font-size: 28rpx;
}
.btn-retry {
  width: 100%; background: #c9a84c; color: #1a1400;
  border: none; border-radius: 16rpx; padding: 28rpx; font-size: 28rpx; font-weight: 700;
}
.btn-ghost {
  width: 100%; background: transparent; color: #8a8070;
  border: 1rpx solid #2e2b24; border-radius: 16rpx; padding: 24rpx; font-size: 26rpx;
}
</style>
