/**
 * Gemini 3 Pro 图像生成 API 服务
 * 使用万界方舟 Gemini API 接口
 * 注意：文生图接口不支持流式输出，仅支持非流式
 */

// API 配置
const API_BASE_URL = 'https://maas-openapi.wanjiedata.com/api/v1beta/models'
const MODEL_NAME = 'gemini-3-pro-image-preview'

// 用户中心 API 配置
const USER_CENTER_BASE_URL = '//api.gmij.win/wjapi/user'
const INVITE_CODE = 'xO9h1BTA'  // 邀请码

// 本地存储 key
const API_KEY_STORAGE = 'gemini_api_key'
const PAPER_SIZE_STORAGE = 'paper_size_index'
const ORIENTATION_STORAGE = 'paper_orientation'
const IMAGE_STYLE_STORAGE = 'image_style'
const SIGNATURE_STORAGE = 'user_signature'
const IMAGE_HISTORY_STORAGE = 'image_history'

// 历史图片最大数量
const MAX_HISTORY_IMAGES = 3

// 风格名称映射
export const STYLE_NAMES: Record<string, string> = {
  handwritten: '手抄报',
  wireframe: '线框图',
  blackboard: '黑板报',
  anime: '动漫',
  custom: '自定义',
}

// 风格选项映射
const STYLE_PROMPTS: Record<string, string> = {
  handwritten: '手抄报风格，手绘感，彩色边框装饰',
  wireframe: '线框图风格，简洁线条，黑白为主',
  blackboard: '黑板报风格，深色背景，粉笔画效果',
  anime: '动漫风格，日系动画，可爱卡通人物',
  custom: '', // 自定义风格不使用系统提示词
}

// Base64 图片前缀模式
const BASE64_PATTERNS = {
  JPEG: '/9j/',      // JPEG 图片的 base64 前缀
  PNG: 'iVBOR',      // PNG 图片的 base64 前缀
  GIF: 'R0lGOD',     // GIF 图片的 base64 前缀
  WEBP: 'UklGR'      // WebP 图片的 base64 前缀
}

/**
 * 获取存储的 API Key
 */
export function getApiKey(): string {
  if (process.env.TARO_ENV === 'h5') {
    return localStorage.getItem(API_KEY_STORAGE) || ''
  }
  // 小程序环境使用 wx.getStorageSync
  try {
    return wx.getStorageSync(API_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

/**
 * 设置 API Key
 */
export function setApiKey(apiKey: string): void {
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(API_KEY_STORAGE, apiKey)
  } else {
    // 小程序环境
    try {
      wx.setStorageSync(API_KEY_STORAGE, apiKey)
    } catch (e) {
      console.error('保存 API Key 失败:', e)
    }
  }
}

/**
 * 检查是否已配置 API Key
 */
export function hasApiKey(): boolean {
  return !!getApiKey()
}

/**
 * 获取纸张尺寸索引
 */
export function getPaperSizeIndex(): number {
  if (process.env.TARO_ENV === 'h5') {
    return parseInt(localStorage.getItem(PAPER_SIZE_STORAGE) || '0', 10)
  }
  try {
    return parseInt(wx.getStorageSync(PAPER_SIZE_STORAGE) || '0', 10)
  } catch {
    return 0
  }
}

/**
 * 设置纸张尺寸索引
 */
export function setPaperSizeIndex(index: number): void {
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(PAPER_SIZE_STORAGE, String(index))
  } else {
    try {
      wx.setStorageSync(PAPER_SIZE_STORAGE, String(index))
    } catch (e) {
      console.error('保存纸张尺寸失败:', e)
    }
  }
}

/**
 * 获取纸张方向（true = 横向, false = 纵向）
 */
export function getPaperOrientation(): boolean {
  if (process.env.TARO_ENV === 'h5') {
    return localStorage.getItem(ORIENTATION_STORAGE) === 'true'
  }
  try {
    return wx.getStorageSync(ORIENTATION_STORAGE) === 'true'
  } catch {
    return false
  }
}

/**
 * 设置纸张方向
 */
export function setPaperOrientation(isLandscape: boolean): void {
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(ORIENTATION_STORAGE, String(isLandscape))
  } else {
    try {
      wx.setStorageSync(ORIENTATION_STORAGE, String(isLandscape))
    } catch (e) {
      console.error('保存纸张方向失败:', e)
    }
  }
}

/**
 * 获取图片风格
 */
export function getImageStyle(): string {
  if (process.env.TARO_ENV === 'h5') {
    return localStorage.getItem(IMAGE_STYLE_STORAGE) || 'handwritten'
  }
  try {
    return wx.getStorageSync(IMAGE_STYLE_STORAGE) || 'handwritten'
  } catch {
    return 'handwritten'
  }
}

/**
 * 设置图片风格
 */
export function setImageStyle(style: string): void {
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(IMAGE_STYLE_STORAGE, style)
  } else {
    try {
      wx.setStorageSync(IMAGE_STYLE_STORAGE, style)
    } catch (e) {
      console.error('保存图片风格失败:', e)
    }
  }
}

/**
 * 获取用户签名
 */
export function getSignature(): string {
  if (process.env.TARO_ENV === 'h5') {
    return localStorage.getItem(SIGNATURE_STORAGE) || ''
  }
  try {
    return wx.getStorageSync(SIGNATURE_STORAGE) || ''
  } catch {
    return ''
  }
}

/**
 * 设置用户签名
 */
export function setSignature(signature: string): void {
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(SIGNATURE_STORAGE, signature)
  } else {
    try {
      wx.setStorageSync(SIGNATURE_STORAGE, signature)
    } catch (e) {
      console.error('保存用户签名失败:', e)
    }
  }
}

/**
 * 解析 data URL，提取 MIME 类型和 base64 数据
 */
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return {
    mimeType: match[1],
    data: match[2]
  }
}

/**
 * 保存 base64 图片到本地文件（仅小程序环境）
 * 返回本地文件路径
 */
function saveImageToLocalFile(imageUrl: string): string {
  if (process.env.TARO_ENV === 'h5') {
    // H5 环境直接返回原 URL
    return imageUrl
  }

  // 小程序环境：检查是否是 base64 data URL
  const parsed = parseDataUrl(imageUrl)
  if (!parsed) {
    // 不是 base64，可能已经是文件路径
    return imageUrl
  }

  // 保存到永久文件
  const fs = wx.getFileSystemManager()
  const ext = parsed.mimeType.split('/')[1] || 'png'
  const filePath = `${wx.env.USER_DATA_PATH}/history_${Date.now()}.${ext}`

  try {
    fs.writeFileSync(filePath, parsed.data, 'base64')
    return filePath
  } catch (e) {
    console.error('保存图片到本地文件失败:', e)
    // 失败时返回原 URL（可能会导致存储配额问题，但至少不会丢失图片）
    return imageUrl
  }
}

/**
 * 历史图片类型
 */
export interface HistoryImage {
  id: string
  url: string
  createdAt: number
}

/**
 * 获取历史图片
 */
export function getImageHistory(): HistoryImage[] {
  if (process.env.TARO_ENV === 'h5') {
    const data = localStorage.getItem(IMAGE_HISTORY_STORAGE)
    return data ? JSON.parse(data) : []
  }
  try {
    const data = wx.getStorageSync(IMAGE_HISTORY_STORAGE)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 添加图片到历史记录（最多保存3张）
 */
export function addImageToHistory(imageUrl: string): HistoryImage {
  // 先保存图片到本地文件（小程序环境），获取文件路径
  const savedUrl = saveImageToLocalFile(imageUrl)
  
  const history = getImageHistory()
  const newImage: HistoryImage = {
    id: `img_${Date.now()}`,
    url: savedUrl,  // 存储文件路径而不是 base64 数据
    createdAt: Date.now()
  }
  
  // 添加到开头，保持最新的在前面
  history.unshift(newImage)
  
  // 只保留最近的 MAX_HISTORY_IMAGES 张
  const trimmedHistory = history.slice(0, MAX_HISTORY_IMAGES)
  
  // 删除被移除的图片文件（小程序环境）
  if (process.env.TARO_ENV !== 'h5' && history.length > MAX_HISTORY_IMAGES) {
    const removedImages = history.slice(MAX_HISTORY_IMAGES)
    const fs = wx.getFileSystemManager()
    removedImages.forEach(img => {
      // 只删除本地文件路径（以 USER_DATA_PATH 开头的）
      if (img.url.startsWith(wx.env.USER_DATA_PATH)) {
        try {
          fs.unlinkSync(img.url)
        } catch (e) {
          console.warn('删除旧图片文件失败:', e)
        }
      }
    })
  }
  
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(IMAGE_HISTORY_STORAGE, JSON.stringify(trimmedHistory))
  } else {
    try {
      wx.setStorageSync(IMAGE_HISTORY_STORAGE, JSON.stringify(trimmedHistory))
    } catch (e) {
      console.error('保存历史图片失败:', e)
    }
  }
  
  return newImage
}

/**
 * 删除历史图片
 */
export function deleteImageFromHistory(imageId: string): void {
  const history = getImageHistory()
  
  // 找到要删除的图片
  const imageToDelete = history.find(img => img.id === imageId)
  
  // 删除物理文件（小程序环境）
  if (process.env.TARO_ENV !== 'h5' && imageToDelete) {
    // 只删除本地文件路径（以 USER_DATA_PATH 开头的）
    if (imageToDelete.url.startsWith(wx.env.USER_DATA_PATH)) {
      const fs = wx.getFileSystemManager()
      try {
        fs.unlinkSync(imageToDelete.url)
      } catch (e) {
        console.warn('删除图片文件失败:', e)
      }
    }
  }
  
  const filteredHistory = history.filter(img => img.id !== imageId)
  
  if (process.env.TARO_ENV === 'h5') {
    localStorage.setItem(IMAGE_HISTORY_STORAGE, JSON.stringify(filteredHistory))
  } else {
    try {
      wx.setStorageSync(IMAGE_HISTORY_STORAGE, JSON.stringify(filteredHistory))
    } catch (e) {
      console.error('删除历史图片失败:', e)
    }
  }
}

/**
 * 获取用户友好的错误信息
 */
function getFriendlyErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return '生成失败，请重试'
  }
  
  // 提供更友好的错误信息
  if (error.message === 'Failed to fetch') {
    return '网络请求失败，请检查网络连接或 API Key 是否正确'
  } else if (error.message.includes('NetworkError')) {
    return '网络错误，请检查网络连接'
  } else if (error.message.includes('CORS')) {
    return '跨域请求被阻止，请联系管理员'
  }
  
  return error.message
}

/**
 * 根据文件路径或类型推断 MIME 类型
 */
export function getMimeTypeFromPath(filePath: string, fileType?: string): string {
  // 如果有明确的文件类型，优先使用
  if (fileType) {
    return fileType
  }
  
  // 根据文件扩展名推断
  const lowerPath = filePath.toLowerCase()
  if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
    return 'image/jpeg'
  } else if (lowerPath.endsWith('.png')) {
    return 'image/png'
  } else if (lowerPath.endsWith('.gif')) {
    return 'image/gif'
  } else if (lowerPath.endsWith('.webp')) {
    return 'image/webp'
  }
  
  // 默认返回 PNG
  return 'image/png'
}

/**
 * 生成手抄报提示词增强
 */
function enhancePrompt(userPrompt: string, hasBaseImage: boolean = false): string {
  const style = getImageStyle()
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.handwritten
  const signature = getSignature()
  
  // 如果是自定义风格，直接使用用户输入，不添加系统提示词
  if (style === 'custom') {
    return userPrompt
  }
  
  // 如果有基础图片（图生图模式）
  if (hasBaseImage) {
    let prompt = `请基于提供的图片进行修改和创作。修改要求：${userPrompt}

风格要求：${stylePrompt}

要求：
- 保留原图的主要元素和构图
- 根据修改要求进行相应的调整和优化
- 画面色彩鲜艳、活泼可爱，适合儿童
- 内容适合幼儿园年龄段的孩子
- 图片风格要温馨、童趣
- 整体布局美观、有创意`

    // 如果有签名，添加签名要求
    if (signature.trim()) {
      prompt += `
- 请在图片右下角用艺术字体添加签名：${signature} @Gemini 3`
    }

    return prompt
  }
  
  // 文生图模式（原有逻辑）
  let prompt = `请为幼儿园小朋友生成一张精美的图片。主题是：${userPrompt}

风格要求：${stylePrompt}

要求：
- 画面色彩鲜艳、活泼可爱，适合儿童
- 包含可爱的卡通元素和装饰边框
- 内容适合幼儿园年龄段的孩子
- 图片风格要温馨、童趣
- 可以包含一些简单的文字区域供孩子填写
- 整体布局美观、有创意`

  // 如果有签名，添加签名要求
  if (signature.trim()) {
    prompt += `
- 请在图片右下角用艺术字体添加签名：${signature} @Gemini 3`
  }

  return prompt
}

/**
 * 检测内容是否包含图片数据，并返回图片URL
 */
function extractImageFromContent(content: string): string | null {
  if (!content) return null

  // 检查是否是完整的 data URL
  if (content.includes('data:image')) {
    return content
  }

  // 检查是否是 base64 编码的图片（通过常见图片格式的魔数前缀检测）
  for (const [format, prefix] of Object.entries(BASE64_PATTERNS)) {
    if (content.startsWith(prefix)) {
      const mimeType = format === 'JPEG' ? 'jpeg' : format.toLowerCase()
      return `data:image/${mimeType};base64,${content}`
    }
  }

  // 检查是否是 markdown 图片格式 ![alt](url)
  const imgMatch = content.match(/!\[.*?\]\((.*?)\)/)
  if (imgMatch) {
    return imgMatch[1]
  }

  // 检查是否是直接的图片 URL
  const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)(\?[^\s"'<>]*)?/i)
  if (urlMatch) {
    return urlMatch[0]
  }

  return null
}

/**
 * 图像生成回调类型
 */
export interface GenerateCallbacks {
  onStart?: () => void
  onProgress?: (imageUrl: string) => void
  onComplete?: (imageUrl: string) => void
  onError?: (error: string) => void
}

/**
 * 图像生成选项
 */
export interface GenerateOptions {
  aspectRatio?: string  // 如 '2:3', '3:2', '1:1', '16:9', '9:16'
  baseImage?: string    // base64 格式的基础图片（用于图生图）
  baseImageMimeType?: string  // 图片的 MIME 类型，如 'image/png', 'image/jpeg'
}

/**
 * 调用 Gemini 3 Pro 生成图像
 * 注意：文生图接口不支持流式输出，使用非流式请求
 */
export async function generateImage(
  prompt: string,
  callbacks: GenerateCallbacks,
  options?: GenerateOptions
): Promise<void> {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    callbacks.onError?.('请先配置 API Key')
    return
  }

  callbacks.onStart?.()

  const hasBaseImage = !!(options?.baseImage)
  const enhancedPrompt = enhancePrompt(prompt, hasBaseImage)
  const aspectRatio = options?.aspectRatio || '2:3'

  try {
    // 构建请求的 parts 数组
    const requestParts: any[] = []
    
    // 如果有基础图片，先添加图片
    if (options?.baseImage && options?.baseImageMimeType) {
      requestParts.push({
        inlineData: {
          mimeType: options.baseImageMimeType,
          data: options.baseImage
        }
      })
    }
    
    // 添加文本提示词
    requestParts.push({
      text: enhancedPrompt
    })

    const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [
          {
            parts: requestParts
          }
        ],
        generationConfig: {
          responseModalities: ['Image'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: '1K'
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Gemini API 返回格式: candidates[0].content.parts[*]
    const responseParts = data.candidates?.[0]?.content?.parts || []
    let imageUrl: string | null = null

    for (const part of responseParts) {
      // 检查是否是图片数据 (inlineData)
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png'
        imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
        break
      }
      // 检查是否是文本内容中包含图片
      if (part.text) {
        const extractedUrl = extractImageFromContent(part.text)
        if (extractedUrl) {
          imageUrl = extractedUrl
          break
        }
      }
    }

    if (imageUrl) {
      callbacks.onComplete?.(imageUrl)
    } else {
      callbacks.onError?.('未能生成图片，请重试')
    }
  } catch (error) {
    callbacks.onError?.(getFriendlyErrorMessage(error))
  }
}

/**
 * 非流式调用（备用方案，与 generateImage 相同，因为文生图不支持流式）
 */
export async function generateImageNonStream(
  prompt: string,
  callbacks: GenerateCallbacks,
  options?: GenerateOptions
): Promise<void> {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    callbacks.onError?.('请先配置 API Key')
    return
  }

  callbacks.onStart?.()

  const hasBaseImage = !!(options?.baseImage)
  const enhancedPrompt = enhancePrompt(prompt, hasBaseImage)
  const aspectRatio = options?.aspectRatio || '2:3'

  try {
    // 构建请求的 parts 数组
    const requestParts2: any[] = []
    
    // 如果有基础图片，先添加图片
    if (options?.baseImage && options?.baseImageMimeType) {
      requestParts2.push({
        inlineData: {
          mimeType: options.baseImageMimeType,
          data: options.baseImage
        }
      })
    }
    
    // 添加文本提示词
    requestParts2.push({
      text: enhancedPrompt
    })

    const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [
          {
            parts: requestParts2
          }
        ],
        generationConfig: {
          responseModalities: ['Image'],
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: '1K'
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Gemini API 返回格式: candidates[0].content.parts[*]
    const responseParts2 = data.candidates?.[0]?.content?.parts || []
    let imageUrl: string | null = null

    for (const part of responseParts2) {
      // 检查是否是图片数据 (inlineData)
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png'
        imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
        break
      }
      // 检查是否是文本内容中包含图片
      if (part.text) {
        const extractedUrl = extractImageFromContent(part.text)
        if (extractedUrl) {
          imageUrl = extractedUrl
          break
        }
      }
    }

    if (imageUrl) {
      callbacks.onComplete?.(imageUrl)
    } else {
      callbacks.onError?.('未能生成图片，请重试')
    }
  } catch (error) {
    callbacks.onError?.(getFriendlyErrorMessage(error))
  }
}

/**
 * 用户 API 响应类型
 */
export interface UserApiResponse {
  success: boolean
  message?: string
  code?: number
  result?: {
    apiKey?: string
    phone?: string
    [key: string]: any
  } | null
  timestamp?: number
}

/**
 * 注册用户
 * @param phone 手机号码
 * @returns 注册响应
 */
export async function registerUser(phone: string): Promise<UserApiResponse> {
  try {
    const response = await fetch(`${USER_CENTER_BASE_URL}/registerUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inviteCode: INVITE_CODE,
        phone: phone
      })
    })

    // Always try to parse JSON response, even for HTTP errors
    // The API returns error details in JSON format
    const data = await response.json()
    return data
  } catch (error) {
    console.error('registerUser error:', error)
    
    // Check if it's a CORS or network error
    const errorMessage = error instanceof Error ? error.message : '注册失败'
    const isCorsOrNetworkError = errorMessage.includes('fetch') || 
                                  errorMessage.includes('CORS') || 
                                  errorMessage.includes('Network') ||
                                  errorMessage.includes('Failed to fetch')
    
    // If it's a network error or JSON parse error, return a structured error response
    return {
      success: false,
      message: isCorsOrNetworkError 
        ? '网络连接失败，请检查网络或尝试使用小程序访问'
        : errorMessage,
      code: 500,
      result: null,
      timestamp: Date.now()
    }
  }
}

/**
 * 根据手机号查询用户 API Key
 * @param phone 手机号码
 * @returns 用户查询响应
 */
export async function getUserKey(phone: string): Promise<UserApiResponse> {
  try {
    const response = await fetch(
      `${USER_CENTER_BASE_URL}/getUserKey?phone=${encodeURIComponent(phone)}&inviteCode=${encodeURIComponent(INVITE_CODE)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    const data = await response.json()
    return data
  } catch (error) {
    console.error('getUserKey error:', error)
    
    const errorMessage = error instanceof Error ? error.message : '查询失败'
    const isCorsOrNetworkError = errorMessage.includes('fetch') || 
                                  errorMessage.includes('CORS') || 
                                  errorMessage.includes('Network') ||
                                  errorMessage.includes('Failed to fetch')
    
    return {
      success: false,
      message: isCorsOrNetworkError 
        ? '网络连接失败，请检查网络或尝试使用小程序访问'
        : errorMessage,
      code: 500,
      result: null,
      timestamp: Date.now()
    }
  }
}
