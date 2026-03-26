<template>
  <view class="page">
    <!-- 顶部标题区 -->
    <view class="header">
      <text class="title">AI 影像工具箱</text>
      <text class="subtitle">一站式智能图像处理</text>
    </view>

    <!-- Bento Grid 布局工具区 -->
    <view class="bento-grid">
      
      <!-- 核心工具：智能证件照 (大卡片) -->
      <view class="bento-item bento-large" @click="navTo('/pages/id-photo/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient id-photo-bg"></view>
        <view class="bento-content">
          <view class="bento-icon-wrap">
            <text class="bento-icon">📸</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">智能证件照</text>
            <text class="bento-desc">AI 抠图换底色，支持多种规格，一键生成高清证件照及排版图。</text>
          </view>
        </view>
        <view class="bento-arrow"></view>
      </view>

      <!-- 次级工具：AI 抠图 (中卡片) -->
      <view class="bento-item bento-medium" @click="navTo('/pages/matting/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient matting-bg"></view>
        <view class="bento-content">
          <view class="bento-icon-wrap">
            <text class="bento-icon">✂️</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">AI 抠图</text>
            <text class="bento-desc">发丝级精准抠图，轻松提取主体</text>
          </view>
        </view>
      </view>

      <!-- 次级工具：画质增强 (中卡片) -->
      <view class="bento-item bento-medium" @click="navTo('/pages/enhance/index')" hover-class="bento-hover">
        <view class="bento-bg-gradient enhance-bg"></view>
        <view class="bento-content">
          <view class="bento-icon-wrap">
            <text class="bento-icon">✨</text>
          </view>
          <view class="bento-text">
            <text class="bento-title">画质增强</text>
            <text class="bento-desc">老照片修复，模糊图片变清晰</text>
          </view>
        </view>
      </view>

    </view>

    <!-- 最近文件 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">最近文件</text>
        <text v-if="recentFiles.length > 0" class="section-action" @click="clearHistory">清空历史</text>
      </view>
      <scroll-view class="recent-files-scroll" scroll-x>
        <view class="recent-files-list">
          <view v-if="recentFiles.length === 0" class="empty-tip">
            <text class="empty-icon">�</text>
            <text class="empty-text">暂无最近文件，快去创作吧</text>
          </view>
          <view
            class="recent-item"
            v-for="(file, index) in recentFiles"
            :key="index"
            @click="openRecent(file)"
            hover-class="bento-hover"
          >
            <image class="recent-preview" :src="file.tempFilePath" mode="aspectFill" />
            <view class="recent-info">
              <text class="recent-title">{{ file.type || '证件照' }}</text>
              <text class="recent-time">{{ formatTime(file.timestamp) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
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
      recentFiles: []
    }
  },
  onShow() {
    this.loadRecentFiles();
  },
  methods: {
    navTo(url) {
      uni.navigateTo({ url })
    },
    loadRecentFiles() {
      const files = uni.getStorageSync('processed_files') || [];
      this.recentFiles = files.sort((a, b) => b.timestamp - a.timestamp);
    },
    openRecent(file) {
      // 这里假设点击最近文件是跳转到结果页，您可以根据实际需求修改
      uni.navigateTo({ url: `/pages/result/index?tempFilePath=${encodeURIComponent(file.tempFilePath)}` });
    },
    clearHistory() {
      uni.showModal({
        title: '确认操作',
        content: '确定要清空所有历史记录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('processed_files');
            this.recentFiles = [];
            uni.showToast({ title: '已清空', icon: 'success' });
          }
        }
      });
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${hours}:${minutes}`;
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
  opacity: 0.15; pointer-events: none;
}
.id-photo-bg { background: radial-gradient(circle at top right, #E6C875, transparent 70%); }
.matting-bg  { background: radial-gradient(circle at bottom right, #34C759, transparent 70%); }
.enhance-bg  { background: radial-gradient(circle at bottom left, #0A84FF, transparent 70%); }

/* 卡片内容布局 */
.bento-content {
  position: relative; z-index: 1;
  padding: 32rpx; height: 100%; box-sizing: border-box;
  display: flex; flex-direction: column;
}
.bento-icon-wrap {
  width: 80rpx; height: 80rpx; border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24rpx;
}
.bento-icon { font-size: 40rpx; }
.bento-text { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; }
.bento-title { font-size: 32rpx; font-weight: 700; color: #E8E0D0; margin-bottom: 8rpx; }
.bento-desc { font-size: 22rpx; color: #8E8E93; line-height: 1.5; }

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

/* 最近文件 Section */
.section { margin-bottom: 48rpx; }
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24rpx; padding: 0 8rpx;
}
.section-title { font-size: 36rpx; font-weight: 700; color: #E8E0D0; }
.section-action { font-size: 24rpx; color: #8E8E93; }

.recent-files-scroll { width: 100%; }
.recent-files-list { display: flex; gap: 24rpx; padding-bottom: 16rpx; }

.empty-tip {
  width: 100%;
  height: 240rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: #1C1C1E; border-radius: 32rpx;
  border: 1rpx dashed rgba(255, 255, 255, 0.1);
}
.empty-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 26rpx; color: #8E8E93; }

.recent-item {
  width: 240rpx; height: 240rpx;
  flex-shrink: 0;
  position: relative;
  background: #1C1C1E; border-radius: 32rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}
.recent-preview {
  width: 100%; height: 100%;
}
.recent-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 16rpx; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}
.recent-title { display: block; font-size: 24rpx; font-weight: 600; color: #E8E0D0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.recent-time { display: block; font-size: 20rpx; color: #8E8E93; }

/* 底部 */
.footer { margin-top: 64rpx; text-align: center; }
.footer-text { font-size: 22rpx; color: #48484A; }
</style>