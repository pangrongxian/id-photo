// ============================================================
// 百度AI人像分割 API 封装 v2.0
// ============================================================
import { BAIDU_CONFIG } from './config.js'

let _token = ''
let _tokenExpire = 0

/**
 * 获取 Access Token（带本地缓存，30天有效）
 */
export async function getBaiduToken() {
  const now = Date.now()
  if (_token && now < _tokenExpire) return _token

  try {
    const cached = uni.getStorageSync('bd_tk')
    if (cached && cached.e > now) {
      _token = cached.t
      _tokenExpire = cached.e
      return _token
    }
  } catch (e) {}

  return new Promise((resolve, reject) => {
    uni.request({
      url: BAIDU_CONFIG.TOKEN_URL,
      method: 'POST',
      data: `grant_type=client_credentials&client_id=${BAIDU_CONFIG.API_KEY}&client_secret=${BAIDU_CONFIG.SECRET_KEY}`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      success(res) {
        if (res.data && res.data.access_token) {
          _token = res.data.access_token
          _tokenExpire = now + (res.data.expires_in - 86400) * 1000
          try { uni.setStorageSync('bd_tk', { t: _token, e: _tokenExpire }) } catch (e) {}
          resolve(_token)
        } else {
          reject(new Error('Token获取失败，请检查API Key配置'))
        }
      },
      fail() { reject(new Error('网络连接失败，请检查网络后重试')) },
    })
  })
}

/**
 * 人像分割（抠图）
 * @param {string} base64 - 图片base64（不含前缀data:...）
 * @returns {Promise<string>} - 前景图base64（带透明通道PNG）
 */
export async function segmentHuman(base64) {
  const token = await getBaiduToken()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BAIDU_CONFIG.SEGMENT_URL}?access_token=${token}`,
      method: 'POST',
      data: `image=${encodeURIComponent(base64)}&type=foreground&refine=true`,
      header: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
      success(res) {
        if (res.data && res.data.foreground) {
          resolve(res.data.foreground)
        } else {
          // 百度常见错误码处理
          const code = res.data?.error_code
          const msg  = res.data?.error_msg || '抠图失败'
          if (code === 110 || code === 111) {
            _token = ''; _tokenExpire = 0  // token过期，清除缓存
            reject(new Error('认证过期，请重试'))
          } else if (code === 18) {
            reject(new Error('每日免费额度已用完，请明天再试'))
          } else {
            reject(new Error(msg))
          }
        }
      },
      fail() { reject(new Error('网络请求失败，请检查网络后重试')) },
    })
  })
}

/**
 * 本地图片路径 → base64（同时返回宽高）
 */
export function fileToBase64(filePath) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success(imgInfo) {
        const fs = uni.getFileSystemManager()
        fs.readFile({
          filePath,
          encoding: 'base64',
          success(res) { resolve({ base64: res.data, width: imgInfo.width, height: imgInfo.height }) },
          fail()       { reject(new Error('读取图片失败')) },
        })
      },
      fail() { reject(new Error('获取图片信息失败')) },
    })
  })
}
