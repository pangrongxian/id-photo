# AI 影像工具箱 — 开发文档

## 项目概述

基于 UniApp 构建的微信小程序，包含 6 大核心图像处理功能。
设计风格：暗金质感，工具感强，符合目标用户（20-40岁职场人群）审美。

---

## 目录结构

```
ai-image-toolbox/
├── pages.json              # 页面路由配置
├── App.vue                 # 全局样式 & 生命周期
├── pages/
│   ├── index/              # 首页（工具导航）
│   ├── id-photo/           # 证件照制作 ★ 核心
│   ├── cutout/             # AI 抠图
│   ├── enhance/            # 画质增强
│   ├── compress/           # 图片压缩（纯前端Canvas）
│   ├── format/             # 格式转换（纯前端Canvas）
│   └── photo-edit/         # 照片修图（纯前端Canvas）
```

---

## 技术架构

### 纯前端可实现（无需后端）

| 功能 | 技术方案 | 核心 API |
|------|---------|---------|
| 图片压缩 | Canvas 重绘 + quality 参数 | `canvasToTempFilePath(quality)` |
| 格式转换 | Canvas 重绘 + fileType 参数 | `canvasToTempFilePath(fileType)` |
| 照片修图 | CSS filter 预览 + Canvas 导出 | CSS filter + Canvas |
| 证件照合成 | Canvas 背景色 + 图像叠加 | `createCanvasContext` |

### 需要 API 服务（推荐方案）

| 功能 | 推荐服务 | 费用参考 | 接入方式 |
|------|---------|---------|---------|
| AI 抠图 | 腾讯云人像分割 | ¥0.001/次 | 微信云函数（隐藏密钥）|
| 画质增强 | 腾讯云图像增强 | ¥0.002/次 | 微信云函数 |
| 证件照背景去除 | 百度人体分析 | ¥0.002/次 | 微信云函数 |

### 微信云函数调用示例

```javascript
// 云函数：background-remove/index.js
const cloud = require('wx-server-sdk')
const axios = require('axios')

exports.main = async (event) => {
  const { imageBase64 } = event
  // 调用腾讯云人像分割
  const result = await axios.post(
    'https://tci.tencentcloudapi.com/',
    { Action: 'SegmentPortraitPic', Image: imageBase64 },
    { headers: { /* 鉴权信息 */ } }
  )
  return result.data
}

// 小程序端调用
wx.cloud.callFunction({
  name: 'background-remove',
  data: { imageBase64: base64String },
  success: (res) => { /* 处理结果 */ }
})
```

---

## 变现策略配置

### 广告位 ID 替换清单

在以下位置替换 `your-ad-unit-id`：

```
pages/id-photo/index.vue  - 处理等待期广告（插屏）
pages/id-photo/index.vue  - 保存按钮上方（激励视频）
pages/cutout/index.vue    - 处理等待期（Banner）
pages/compress/index.vue  - 结果页（Banner）
pages/enhance/index.vue   - 处理等待期（Banner）
pages/format/index.vue    - 结果页（Banner）
```

### 广告类型选择

| 页面 | 广告类型 | 位置 | 预计 CPM |
|------|---------|------|---------|
| 证件照保存 | 激励视频 | 保存按钮触发 | ¥30–50 |
| AI处理等待页 | 插屏/Banner | 处理中自动展示 | ¥20–30 |
| 结果页 | Banner | 底部固定 | ¥10–15 |

### 激励视频广告代码（证件照保存）

```javascript
showRewardAd() {
  const rewardAd = wx.createRewardedVideoAd({
    adUnitId: 'adunit-xxxxxxxxxxxxxxxx'  // 替换为真实ID
  })
  rewardAd.onClose((res) => {
    if (res?.isEnded) {
      this.doSave()  // 看完广告才保存
    } else {
      uni.showToast({ title: '请观看完整广告', icon: 'none' })
    }
  })
  rewardAd.onError(() => this.doSave())  // 广告失败时放行
  rewardAd.load().then(() => rewardAd.show()).catch(() => this.doSave())
}
```

---

## 关键功能实现细节

### 1. 证件照规格尺寸表

```javascript
const PHOTO_SPECS = [
  { id: 'yicun',    label: '一寸',   mm: '25×35',  px300dpi: '295×413' },
  { id: 'ercun',    label: '二寸',   mm: '35×49',  px300dpi: '413×579' },
  { id: 'passport', label: '护照',   mm: '33×48',  px300dpi: '390×567' },
  { id: 'visa_us',  label: '美签',   mm: '51×51',  px300dpi: '600×600' },
  { id: 'visa_eu',  label: '申根签', mm: '35×45',  px300dpi: '413×531' },
  { id: 'jiakao',   label: '驾照',   mm: '22×32',  px300dpi: '260×378' },
  { id: 'shenfenz',  label: '身份证', mm: '26×32',  px300dpi: '307×378' },
  { id: 'shebao',   label: '社保',   mm: '26×32',  px300dpi: '307×378' },
  { id: 'kaoyantop',label: '考研',   mm: '25×35',  px300dpi: '295×413' },
]
```

### 2. 图片压缩最佳实践

```javascript
// 不同场景推荐压缩率
const COMPRESS_PRESETS = {
  wechat_share: 60,   // 微信分享（<200KB）
  web_upload: 75,     // 网站上传（<500KB）
  print: 90,          // 打印用途（高质量）
  storage: 80,        // 本地存储
}

// Canvas 压缩核心代码
async compressImage(src, quality, maxWidth = 1080) {
  const imgInfo = await uni.getImageInfo({ src })
  let { width, height } = imgInfo
  if (width > maxWidth) {
    height = Math.round(height * maxWidth / width)
    width = maxWidth
  }
  const ctx = uni.createCanvasContext('compressCanvas', this)
  ctx.drawImage(src, 0, 0, width / 2, height / 2)
  return new Promise(resolve => {
    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'compressCanvas',
        fileType: 'jpg',
        quality: quality / 100,
        success: resolve
      }, this)
    })
  })
}
```

### 3. 照片修图 CSS Filter 对应关系

```javascript
// adjustValues → CSS filter 转换
getCssFilter(values) {
  const { brightness, contrast, saturation, warmth } = values
  return [
    `brightness(${1 + brightness / 100})`,
    `contrast(${1 + contrast / 100})`,
    `saturate(${1 + saturation / 100})`,
    warmth > 0 ? `sepia(${warmth / 200})` : `hue-rotate(${warmth / 3}deg)`
  ].join(' ')
}
```

---

## 上线前检查清单

- [ ] 替换所有 `your-ad-unit-id` 为真实广告单元 ID
- [ ] 配置微信云函数并部署（AI抠图、画质增强）
- [ ] 申请相册读写权限（`scope.writePhotosAlbum`）
- [ ] 申请相机权限（`scope.camera`）
- [ ] 配置合法域名白名单（API调用域名）
- [ ] 设置分享图片（`onShareAppMessage`）
- [ ] 配置流量主（需满足微信流量主门槛：月活500+）
- [ ] 提交小程序类目：工具 → 图片处理

---

## 冷启动运营建议

### 第一阶段（0-1000 DAU）
1. 证件照功能主打"搜索流量"，目标关键词：证件照制作、一寸照、蓝底照
2. 在高考、考研、招聘季（3-4月、9-10月）加大推广
3. 结果页"分享给朋友"按钮引导自然裂变

### 第二阶段（扩量期）
1. 图片压缩功能做"微信图片太大发不出去"场景的关键词
2. 制作对比效果视频投放小红书、抖音
3. 与职场类公众号合作内容置换

### 预估收入模型
| DAU | 广告曝光次数/天 | 广告月收入（CPM¥15） | API成本/月 | 净利润/月 |
|-----|--------------|-------------------|-----------|---------|
| 5,000 | 15,000 | ¥6,750 | ¥300 | ¥6,450 |
| 20,000 | 60,000 | ¥27,000 | ¥1,200 | ¥25,800 |
| 50,000 | 150,000 | ¥67,500 | ¥3,000 | ¥64,500 |
