// ============================================================
// 全局配置 v2.0
// ============================================================

// 百度AI API配置
// 申请地址：https://ai.baidu.com → 人体分析 → 人像分割
export const BAIDU_CONFIG = {
  API_KEY: '',           // 百度AI API_KEY，本地填入，不提交
  SECRET_KEY: '',        // 百度AI SECRET_KEY，本地填入，不提交

  // 新增：图像特效专用 Key
  EFFECTS_API_KEY: '',   // 百度特效 API_KEY，本地填入，不提交
  EFFECTS_SECRET_KEY: '', // 百度特效 SECRET_KEY，本地填入，不提交

  // 火山引擎配置 (Inpainting 涂抹消除)
  VOLC_AK: '',           // 火山引擎 AccessKey，本地填入，不提交
  VOLC_SK: '',           // 火山引擎 SecretKey，本地填入，不提交
  VOLC_HOST: 'visual.volcengineapi.com',

  TOKEN_URL: 'https://aip.baidubce.com/oauth/2.0/token',
  SEGMENT_URL: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/body_seg',
  DETECT_URL: 'https://aip.baidubce.com/rest/2.0/face/v3/detect',
  BEAUTY_URL: 'https://aip.baidubce.com/rest/2.0/image-process/v1/face_beautify',
  ENHANCE_URL: 'https://aip.baidubce.com/rest/2.0/image-process/v1/image_quality_enhance',
  ANIME_URL: 'https://aip.baidubce.com/rest/2.0/image-process/v1/selfie_anime',
  COLORIZE_URL: 'https://aip.baidubce.com/rest/2.0/image-process/v1/colourize',
  INPAINT_URL: 'https://aip.baidubce.com/rest/2.0/image-process/v1/inpainting',
}

// 背景颜色（扩展到10种）
export const BG_COLORS = [
  { id: 'white', label: '白色', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { id: 'red', label: '红色', hex: '#C00000', rgb: [192, 0, 0] },
  { id: 'blue', label: '蓝色', hex: '#005FFF', rgb: [0, 95, 255] },
  { id: 'darkblue', label: '深蓝', hex: '#003399', rgb: [0, 51, 153] },
  { id: 'skyblue', label: '天蓝', hex: '#67B7D1', rgb: [103, 183, 209] },
  { id: 'lightblue', label: '浅蓝', hex: '#A8D8EA', rgb: [168, 216, 234] },
  { id: 'gray', label: '浅灰', hex: '#F0F0F0', rgb: [240, 240, 240] },
  { id: 'darkgray', label: '深灰', hex: '#808080', rgb: [128, 128, 128] },
  { id: 'green', label: '绿色', hex: '#009900', rgb: [0, 153, 0] },
  { id: 'pink', label: '粉色', hex: '#FF9999', rgb: [255, 153, 153] },
]

// 证件照尺寸（全量25种，按300dpi换算px）
export const PHOTO_SIZES = [
  // 通用
  { id: 's1', label: '一寸', desc: '25×35mm', w: 295, h: 413, category: '通用', popular: true },
  { id: 's2', label: '二寸', desc: '35×49mm', w: 413, h: 579, category: '通用', popular: true },
  { id: 's3', label: '小二寸', desc: '35×45mm', w: 413, h: 531, category: '通用', popular: false },
  { id: 's4', label: '大一寸', desc: '33×48mm', w: 390, h: 567, category: '通用', popular: false },
  // 出行
  { id: 's5', label: '护照', desc: '33×48mm', w: 390, h: 567, category: '出行', popular: true },
  { id: 's6', label: '美签/加签', desc: '51×51mm', w: 600, h: 600, category: '出行', popular: true },
  { id: 's7', label: '英签', desc: '35×45mm', w: 413, h: 531, category: '出行', popular: false },
  { id: 's8', label: '申根签证', desc: '35×45mm', w: 413, h: 531, category: '出行', popular: false },
  { id: 's9', label: '日本签证', desc: '35×45mm', w: 413, h: 531, category: '出行', popular: false },
  // 证件
  { id: 's10', label: '身份证', desc: '26×32mm', w: 307, h: 378, category: '证件', popular: true },
  { id: 's11', label: '驾照', desc: '22×32mm', w: 260, h: 378, category: '证件', popular: false },
  { id: 's12', label: '社保卡', desc: '26×32mm', w: 307, h: 378, category: '证件', popular: false },
  { id: 's13', label: '港澳通行证', desc: '35×45mm', w: 413, h: 531, category: '证件', popular: false },
  { id: 's14', label: '台湾通行证', desc: '35×45mm', w: 413, h: 531, category: '证件', popular: false },
  // 学历
  { id: 's15', label: '毕业证', desc: '33×48mm', w: 390, h: 567, category: '学历', popular: true },
  { id: 's16', label: '学生证', desc: '25×35mm', w: 295, h: 413, category: '学历', popular: false },
  { id: 's17', label: '学信网', desc: '35×45mm', w: 413, h: 531, category: '学历', popular: false },
  // 考试
  { id: 's18', label: '考研报名', desc: '35×45mm', w: 413, h: 531, category: '考试', popular: true },
  { id: 's19', label: '考公报名', desc: '35×45mm', w: 413, h: 531, category: '考试', popular: true },
  { id: 's20', label: '教师资格', desc: '33×48mm', w: 390, h: 567, category: '考试', popular: false },
  { id: 's21', label: '普通话考试', desc: '35×45mm', w: 413, h: 531, category: '考试', popular: false },
  { id: 's22', label: '司法考试', desc: '35×45mm', w: 413, h: 531, category: '考试', popular: false },
  { id: 's23', label: '医师资格', desc: '35×45mm', w: 413, h: 531, category: '考试', popular: false },
  // 职场
  { id: 's24', label: '简历照', desc: '35×45mm', w: 413, h: 531, category: '职场', popular: true },
  { id: 's25', label: '职称评审', desc: '33×48mm', w: 390, h: 567, category: '职场', popular: false },
]

// 打印排版：标准6×4寸相纸，300dpi
export const PRINT_PAPER = { w: 1800, h: 1200, gap: 12 }

// 美颜默认参数
export const DEFAULT_BEAUTY = {
  brightness: 0,   // 亮度：-100 ～ +100
  contrast: 0,   // 对比度：-100 ～ +100
  smooth: 0,   // 磨皮：0 ～ 100
  sharpen: 0,   // 锐化：0 ～ 100
}
