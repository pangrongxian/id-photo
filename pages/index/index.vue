<template>
  <view class="page">
    <!-- 顶部标题区 -->
    <view class="header">
      <text class="title">AI 影像工具箱</text>
      <text class="subtitle">{{ greeting }}，需要处理照片吗？</text>
    </view>

    <!-- Bento Grid 布局工具区 -->
    <view class="bento-grid">
      
      <!-- 核心工具：智能证件照 (大卡片) -->
      <view class="bento-item bento-large" @click="navTo('/pages/id-photo/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient id-photo-bg"></view>
        <view class="bento-content bento-content-horizontal">
          <view class="bento-text bento-text-horizontal">
            <text class="bento-title">智能证件照</text>
            <text class="bento-desc">行业标杆，发丝级抠图换底，支持百种规格，高清无损排版。</text>
          </view>
          <view class="bento-icon-wrap large-icon-wrap float-anim">
            <text class="bento-icon">📸</text>
          </view>
        </view>
        <view class="bento-arrow">➔</view>
      </view>

      <!-- 趣味爆款：二次元化身 (中卡片) -->
      <view class="bento-item bento-medium" @click="navTo('/pages/anime/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient anime-bg"></view>
        <view class="bento-content">
          <view class="bento-icon-wrap float-anim" style="animation-delay: 0.2s;">
            <text class="bento-icon">🪄</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">二次元化身</text>
            <text class="bento-desc">一秒破壁，专属动漫头像</text>
          </view>
        </view>
      </view>

      <!-- 趣味爆款：魔法老照片 (中卡片) -->
      <view class="bento-item bento-medium" @click="navTo('/pages/colorize/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient colorize-bg"></view>
        <view class="bento-content">
          <view class="bento-icon-wrap float-anim" style="animation-delay: 0.4s;">
            <text class="bento-icon">🕰️</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">魔法老照片</text>
            <text class="bento-desc">AI上色，黑白记忆重现</text>
          </view>
        </view>
      </view>

      <!-- 实用工具：AI 抠图 (小卡片) -->
      <view class="bento-item bento-small" @click="navTo('/pages/matting/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient matting-bg"></view>
        <view class="bento-content bento-content-row">
          <view class="bento-icon-wrap small-icon-wrap">
            <text class="bento-icon">✂️</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">AI 抠图</text>
            <text class="bento-desc">精准提取</text>
          </view>
        </view>
      </view>

      <!-- 实用工具：画质增强 (小卡片) -->
      <view class="bento-item bento-small" @click="navTo('/pages/enhance/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient enhance-bg"></view>
        <view class="bento-content bento-content-row">
          <view class="bento-icon-wrap small-icon-wrap">
            <text class="bento-icon">✨</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">画质增强</text>
            <text class="bento-desc">模糊变清晰</text>
          </view>
      </view>
    </view>
    <!-- 结束 bento-grid -->
    </view>

    <!-- 专业生产力 & 创意工坊 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">✨ 高级玩法</text>
      </view>
      <view class="pro-tools-grid">
        
        <!-- 智能去水印 -->
        <view class="pro-tool-card" @click="navTo('/pages/eraser/index?type=watermark')" hover-class="chip-hover">
          <view class="pro-tool-icon-bg bg-blue">
            <text class="pro-tool-icon">💧</text>
          </view>
          <view class="pro-tool-text">
            <text class="pro-tool-title">智能去水印</text>
            <text class="pro-tool-desc">一键擦除图片杂物与水印</text>
          </view>
        </view>

        <!-- 魔法去路人 -->
        <view class="pro-tool-card" @click="navTo('/pages/eraser/index?type=eraser')" hover-class="chip-hover">
          <view class="pro-tool-icon-bg bg-purple">
            <text class="pro-tool-icon">🧹</text>
          </view>
          <view class="pro-tool-text">
            <text class="pro-tool-title">魔法去路人</text>
            <text class="pro-tool-desc">智能涂鸦，完美剔除背景路人</text>
          </view>
        </view>

      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text class="footer-text">更多 AI 工具持续更新中...</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      greeting: '您好'
    }
  },
  onShow() {
    this.updateGreeting();
  },
  methods: {
    updateGreeting() {
      const hour = new Date().getHours();
      if (hour < 5) this.greeting = '夜深了';
      else if (hour < 11) this.greeting = '早上好';
      else if (hour < 13) this.greeting = '中午好';
      else if (hour < 18) this.greeting = '下午好';
      else this.greeting = '晚上好';
    },
    navTo(url) {
      uni.navigateTo({ url })
    }
  }
}
</script>

<style scoped>
page { background: #000000; }
.page { background: #000000; min-height: 100vh; padding: 60rpx 32rpx 120rpx; }

/* 头部 */
.header { margin-bottom: 48rpx; padding-left: 8rpx; }
.title { display: block; font-size: 56rpx; font-weight: 900; color: #E8E0D0; margin-bottom: 12rpx; letter-spacing: 2rpx; }
.subtitle { display: block; font-size: 28rpx; color: #8E8E93; }

/* Bento Grid 布局 */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  grid-auto-rows: minmax(160rpx, auto);
  margin-bottom: 64rpx; /* 为最近文件模块留出空间 */
}

/* 基础卡片样式 */
.bento-item {
  position: relative;
  background: #1C1C1E;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 40rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.bento-hover {
  transform: scale(0.96);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 背景渐变层 */
.bento-bg-gradient {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  opacity: 0.15; pointer-events: none; transition: opacity 0.3s ease;
}
.bento-hover .bento-bg-gradient { opacity: 0.25; }

.id-photo-bg { background: radial-gradient(circle at top right, #E6C875, transparent 70%); }
.anime-bg    { background: radial-gradient(circle at bottom right, #34C759, transparent 70%); }
.colorize-bg { background: radial-gradient(circle at bottom left, #FF9F0A, transparent 70%); }
.matting-bg  { background: radial-gradient(circle at top left, #30A852, transparent 60%); }
.enhance-bg  { background: radial-gradient(circle at top right, #0A84FF, transparent 60%); }

/* 卡片类型与排版 */
.bento-large { grid-column: span 2; min-height: 260rpx; }
.bento-medium { min-height: 280rpx; }
.bento-small { min-height: 160rpx; }

/* 内部 flex */
.bento-content {
  position: relative; z-index: 1;
  padding: 32rpx; height: 100%; box-sizing: border-box;
  display: flex; flex-direction: column;
}
.bento-content-horizontal { flex-direction: row; align-items: center; justify-content: space-between; }
.bento-content-row { flex-direction: row; align-items: center; gap: 24rpx; padding: 24rpx; }

/* Icon 包裹器 */
.bento-icon-wrap {
  width: 80rpx; height: 80rpx; border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24rpx; flex-shrink: 0;
}
.large-icon-wrap { width: 120rpx; height: 120rpx; border-radius: 40rpx; background: rgba(230,200,117,0.1); margin-bottom: 0; }
.large-icon-wrap .bento-icon { font-size: 60rpx; }
.small-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 20rpx; margin-bottom: 0; }
.bento-icon { font-size: 40rpx; }
.small-icon-wrap .bento-icon { font-size: 32rpx; }

/* 缓动漂浮动画 */
@keyframes floatAnim {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
  100% { transform: translateY(0); }
}
.float-anim { animation: floatAnim 4s ease-in-out infinite; }

/* 文案 */
.bento-text { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
.bento-text-horizontal { justify-content: center; padding-right: 32rpx; }
.bento-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; margin-bottom: 8rpx; }
.bento-desc { font-size: 22rpx; color: #8E8E93; line-height: 1.5; }

/* 箭头 */
.bento-arrow { position: absolute; right: 32rpx; bottom: 32rpx; color: #E6C875; font-size: 28rpx; opacity: 0.5; }

/* 大卡片 (跨两列) */
.bento-large {
  grid-column: span 2;
  min-height: 320rpx;
}
.bento-large .bento-content {
  flex-direction: row; align-items: center; gap: 32rpx;
}
.bento-large .bento-icon-wrap {
  width: 120rpx; height: 120rpx; border-radius: 32rpx; margin-bottom: 0;
  background: linear-gradient(135deg, rgba(230, 200, 117, 0.2), rgba(200, 157, 60, 0.1));
  border: 1rpx solid rgba(230, 200, 117, 0.3);
}
.bento-large .bento-icon { font-size: 64rpx; }
.bento-large .bento-text { justify-content: center; }
.bento-large .bento-title { font-size: 40rpx; color: #E6C875; margin-bottom: 12rpx; }
.bento-large .bento-desc { font-size: 24rpx; }
.bento-arrow {
  position: absolute;
  right: 40rpx;
  top: 50%;
  transform: translateY(-50%) rotate(45deg);
  width: 16rpx;
  height: 16rpx;
  border-top: 4rpx solid rgba(255, 255, 255, 0.3);
  border-right: 4rpx solid rgba(255, 255, 255, 0.3);
}

/* 中卡片 (占一列) */
.bento-medium {
  grid-column: span 1;
  min-height: 280rpx;
}

/* 快捷直达 & 探索发现 Section */
.section { margin-bottom: 48rpx; }
.section-header {
  margin-bottom: 24rpx; padding: 0 8rpx;
}
.section-title { font-size: 36rpx; font-weight: 700; color: #E8E0D0; }

/* 高级玩法网格 */
.pro-tools-grid {
  display: flex; flex-direction: column; gap: 24rpx;
}
.pro-tool-card {
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.05);
  border-radius: 32rpx; padding: 32rpx;
  display: flex; align-items: center; gap: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}
.chip-hover { transform: scale(0.97); box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.4); border-color: rgba(255, 255, 255, 0.1); }

.pro-tool-icon-bg {
  width: 96rpx; height: 96rpx; border-radius: 28rpx;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.bg-purple { background: linear-gradient(135deg, rgba(175, 82, 222, 0.2), rgba(175, 82, 222, 0.05)); border: 1rpx solid rgba(175, 82, 222, 0.3); }
.bg-blue   { background: linear-gradient(135deg, rgba(10, 132, 255, 0.2), rgba(10, 132, 255, 0.05)); border: 1rpx solid rgba(10, 132, 255, 0.3); }
.bg-orange { background: linear-gradient(135deg, rgba(255, 149, 0, 0.2), rgba(255, 149, 0, 0.05)); border: 1rpx solid rgba(255, 149, 0, 0.3); }

.pro-tool-icon { font-size: 48rpx; }
.pro-tool-text { display: flex; flex-direction: column; gap: 8rpx; }
.pro-tool-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; }
.pro-tool-desc { font-size: 24rpx; color: #8E8E93; }

/* 探索 Banner */
.banner-section { margin-top: 64rpx; }
.explore-banner {
  position: relative; height: 200rpx; border-radius: 32rpx; overflow: hidden;
  background: #1C1C1E; border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex; align-items: center; padding: 0 40rpx;
  transition: all 0.2s ease;
}
.explore-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(175,82,222,0.2), rgba(10,132,255,0.1));
  pointer-events: none;
}
.banner-hover { transform: scale(0.98); box-shadow: 0 8rpx 32rpx rgba(175,82,222,0.2); }
.explore-content { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 8rpx; }
.explore-tag { 
  align-self: flex-start;
  background: linear-gradient(90deg, #FF9F0A, #FF453A);
  color: #FFF; font-size: 20rpx; font-weight: 900; padding: 4rpx 16rpx; border-radius: 12rpx;
}
.explore-title { font-size: 34rpx; font-weight: 800; color: #FFFFFF; }
.explore-sub { font-size: 24rpx; color: #A0A0A5; }
.explore-decoration {
  position: absolute; right: 40rpx; top: 50%; transform: translateY(-50%);
  font-size: 80rpx; opacity: 0.8;
  animation: floatAnim 3s infinite ease-in-out;
}

/* 底部 */
.footer { margin-top: 64rpx; text-align: center; }
.footer-text { font-size: 22rpx; color: #48484A; }
</style>