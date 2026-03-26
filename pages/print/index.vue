<template>
  <view class="page">

    <!-- 排版参数 -->
    <view class="card">
      <view class="card-title">排版参数</view>

      <view class="param-row">
        <text class="param-label">证件类型</text>
        <text class="param-val">{{ sizeLabel }}</text>
      </view>
      <view class="param-row">
        <text class="param-label">单张尺寸</text>
        <text class="param-val">{{ sizeW }}×{{ sizeH }}px</text>
      </view>
      <view class="param-row">
        <text class="param-label">相纸规格</text>
        <view class="param-select-row">
          <view v-for="p in papers" :key="p.id"
            :class="['paper-chip', selectedPaper.id === p.id ? 'active' : '']"
            @click="selectedPaper = p; computeLayout()">
            <text>{{ p.label }}</text>
          </view>
        </view>
      </view>
      <view class="param-row" v-if="layout">
        <text class="param-label">排列数量</text>
        <text class="param-val highlight">{{ layout.cols }}列 × {{ layout.rows }}行 = {{ layout.total }}张</text>
      </view>
    </view>

    <!-- 排版预览（示意图） -->
    <view class="card">
      <view class="card-title">排版示意</view>
      <view class="layout-preview" v-if="layout">
        <view class="paper-mock" :style="paperMockStyle">
          <view class="photo-mock-grid" :style="gridStyle">
            <view
              v-for="n in layout.total" :key="n"
              class="photo-mock-cell"
              :style="photoMockStyle"
            >
              <image :src="photoPath" mode="scaleToFill" class="photo-mock-img" />
            </view>
          </view>
        </view>
        <text class="preview-hint">示意图（实际输出为高清图）</text>
      </view>
    </view>

    <!-- 操作提示 -->
    <view class="tip-card">
      <text class="tip-icon">💡</text>
      <view>
        <text class="tip-title">打印提示</text>
        <text class="tip-body">生成后将图片发给打印店，说明"{{ selectedPaper.label }}相纸，照片打印，不要裁边"即可。图片含裁剪参考线，打印后按线裁剪。</text>
      </view>
    </view>

    <!-- 生成按钮 -->
    <button class="btn-generate" @click="doGeneratePrint" :disabled="generating">
      {{ generating ? '生成中…' : '生成打印排版图' }}
    </button>

    <!-- 隐藏canvas -->
    <canvas type="2d" id="printCanvas"
      style="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;" />

  </view>
</template>

<script>
import { getCanvasNode, generatePrintLayout, saveToAlbum } from '../../utils/canvas.js'
import { usePhotoStore } from '../../store/photo.js'

// 相纸规格预设（宽×高，300dpi）
const PAPER_PRESETS = [
  { id: '6x4',  label: '6×4寸',  w: 1800, h: 1200, gap: 12 },
  { id: '5x3',  label: '5×3寸',  w: 1500, h: 900,  gap: 10 },
  { id: '7x5',  label: '7×5寸',  w: 2100, h: 1500, gap: 14 },
  { id: 'a4',   label: 'A4纸',   w: 2480, h: 3508, gap: 14 },
]

export default {
  name: 'PrintPage',
  data() {
    return {
      photoPath:     '',
      sizeLabel:     '',
      sizeW:         0,
      sizeH:         0,
      papers:        PAPER_PRESETS,
      selectedPaper: PAPER_PRESETS[0],
      layout:        null,
      generating:    false,
    }
  },
  computed: {
    // 相纸示意图样式（缩放到屏幕宽度）
    paperMockStyle() {
      const maxW = 580   // rpx，示意图最大宽度
      const ratio = this.selectedPaper.w / this.selectedPaper.h
      const mockW = maxW
      const mockH = Math.round(maxW / ratio)
      return { width: mockW + 'rpx', height: mockH + 'rpx' }
    },
    gridStyle() {
      if (!this.layout) return {}
      return {
        display: 'grid',
        gridTemplateColumns: `repeat(${this.layout.cols}, 1fr)`,
        gap: '4rpx',
        padding: '8rpx',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
      }
    },
    photoMockStyle() {
      return { borderRadius: '2rpx', overflow: 'hidden' }
    },
  },
  onLoad() {
    const photoStore = usePhotoStore()
    this.photoPath = photoStore.outputPath        || ''
    this.sizeLabel = photoStore.selectedSize?.label || ''
    this.sizeW     = photoStore.selectedSize?.w     || 295
    this.sizeH     = photoStore.selectedSize?.h     || 413
    this.computeLayout()
  },
  methods: {
    computeLayout() {
      const p      = this.selectedPaper
      const margin = 47
      const usableW = p.w - margin * 2
      const usableH = p.h - margin * 2
      const cols    = Math.floor((usableW + p.gap) / (this.sizeW + p.gap))
      const rows    = Math.floor((usableH + p.gap) / (this.sizeH + p.gap))
      const total   = Math.max(0, cols * rows)
      this.layout   = { cols, rows, total }
    },

    async doGeneratePrint() {
      if (this.generating) return
      if (!this.photoPath) { uni.showToast({ title: '未找到证件照，请重新制作', icon: 'none' }); return }
      if (!this.layout || this.layout.total === 0) {
        uni.showToast({ title: '当前尺寸无法排版，请换相纸规格', icon: 'none' }); return
      }

      this.generating = true
      uni.showLoading({ title: '生成排版图…', mask: true })

      try {
        const canvas = await getCanvasNode('printCanvas', this)
        const result = await generatePrintLayout({
          photoPath: this.photoPath,
          photoW:    this.sizeW,
          photoH:    this.sizeH,
          paper:     this.selectedPaper,
          canvas,
        })

        uni.hideLoading()

        // 先预览
        uni.previewImage({
          urls:    [result.path],
          current: result.path,
        })

        // 弹窗确认保存
        uni.showModal({
          title:       '排版图生成成功',
          content:     `共排列 ${result.total} 张，是否保存到相册？`,
          confirmText: '保存相册',
          cancelText:  '取消',
          success: async (res) => {
            if (res.confirm) {
              try {
                await saveToAlbum(result.path)
                uni.showToast({ title: '排版图已保存 ✓', icon: 'none' })
              } catch (e) {
                uni.showToast({ title: '保存失败', icon: 'none' })
              }
            }
          },
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

.card {
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx; padding: 32rpx 28rpx; margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
}
.card-title {
  font-size: 28rpx; font-weight: 700; color: #E6C875; letter-spacing: 2rpx;
  margin-bottom: 24rpx; padding-bottom: 20rpx; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}

/* 参数行 */
.param-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20rpx 0; border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);
}
.param-row:last-child { border-bottom: none; padding-bottom: 0; }
.param-label { font-size: 26rpx; color: #8E8E93; }
.param-val   { font-size: 26rpx; color: #E8E0D0; font-weight: 500; }
.param-val.highlight { color: #E6C875; font-weight: 700; }
.param-select-row { display: flex; gap: 16rpx; flex-wrap: wrap; justify-content: flex-end; }
.paper-chip {
  background: rgba(255, 255, 255, 0.05); border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 16rpx; padding: 12rpx 24rpx;
  transition: all 0.25s ease;
}
.paper-chip text { font-size: 24rpx; color: #8E8E93; transition: all 0.25s ease; }
.paper-chip.active { 
  background: rgba(230, 200, 117, 0.1); 
  border-color: #E6C875; 
  transform: scale(1.05);
  box-shadow: 0 4rpx 12rpx rgba(230, 200, 117, 0.2);
}
.paper-chip.active text { color: #E6C875; font-weight: 600; }

/* 排版示意 */
.layout-preview { display: flex; flex-direction: column; align-items: center; gap: 24rpx; }
.paper-mock {
  background: #f8f8f8; border: 1rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 8rpx; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 0 20rpx rgba(0, 0, 0, 0.1), 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
}
.photo-mock-cell { background: #ddd; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1); }
.photo-mock-img  { width: 100%; height: 100%; display: block; }
.preview-hint    { font-size: 22rpx; color: #8E8E93; }

/* 提示卡 */
.tip-card {
  display: flex; gap: 20rpx; align-items: flex-start;
  background: rgba(230, 200, 117, 0.05); border: 1rpx solid rgba(230, 200, 117, 0.15);
  border-radius: 24rpx; padding: 24rpx; margin-bottom: 40rpx;
}
.tip-icon  { font-size: 40rpx; flex-shrink: 0; }
.tip-title { display: block; font-size: 26rpx; color: #E6C875; font-weight: 700; margin-bottom: 8rpx; }
.tip-body  { display: block; font-size: 24rpx; color: #8E8E93; line-height: 1.6; }

/* 按钮 */
.btn-generate {
  width: 100%; background: linear-gradient(135deg, #E6C875, #C89D3C);
  color: #1a1400; border: none; border-radius: 24rpx; padding: 32rpx;
  font-size: 32rpx; font-weight: 800; letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(230, 200, 117, 0.3);
  transition: all 0.25s ease;
}
.btn-generate:active { transform: scale(0.96); box-shadow: 0 4rpx 12rpx rgba(230, 200, 117, 0.2); }
.btn-generate[disabled] { opacity: 0.6; box-shadow: none; }
</style>
