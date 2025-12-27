/**
 * Gemini 3 Pro 图像生成 API 服务
 * 注意：文生图接口不支持流式输出，仅支持非流式
 */

// API 配置
const API_BASE_URL = '/api/v1beta/models'
const MODEL_NAME = 'gemini-3-pro-image-preview'

// 用户中心 API 配置
const USER_CENTER_BASE_URL = '//api.gmij.win/wjapi/user'
const INVITE_CODE = 'xO9h1BTA'  // 邀请码

// 本地存储 key
const API_KEY_STORAGE = 'gemini_api_key'

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
 * 生成手抄报提示词增强
 */
function enhancePrompt(userPrompt: string): string {
  return `请为幼儿园小朋友生成一张精美的手抄报图片。主题是：${userPrompt}

要求：
- 画面色彩鲜艳、活泼可爱，适合儿童
- 包含可爱的卡通元素和装饰边框
- 内容适合幼儿园年龄段的孩子
- 图片风格要温馨、童趣
- 可以包含一些简单的文字区域供孩子填写
- 整体布局美观、有创意`
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
 * 调用 Gemini 3 Pro 生成图像
 * 注意：文生图接口不支持流式输出，使用非流式请求
 */
export async function generateImage(
  prompt: string,
  callbacks: GenerateCallbacks
): Promise<void> {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    callbacks.onError?.('请先配置 API Key')
    return
  }

  callbacks.onStart?.()

  const enhancedPrompt = enhancePrompt(prompt)

  try {
    const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          aspectRatio: '2:3'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Gemini API 返回格式: candidates[0].content.parts[*]
    const parts = data.candidates?.[0]?.content?.parts || []
    let imageUrl: string | null = null

    for (const part of parts) {
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
    const errorMessage = error instanceof Error ? error.message : '生成失败，请重试'
    callbacks.onError?.(errorMessage)
  }
}

/**
 * 非流式调用（备用方案，与 generateImage 相同，因为文生图不支持流式）
 */
export async function generateImageNonStream(
  prompt: string,
  callbacks: GenerateCallbacks
): Promise<void> {
  const apiKey = getApiKey()
  
  if (!apiKey) {
    callbacks.onError?.('请先配置 API Key')
    return
  }

  callbacks.onStart?.()

  const enhancedPrompt = enhancePrompt(prompt)

  try {
    const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          aspectRatio: '2:3'
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Gemini API 返回格式: candidates[0].content.parts[*]
    const parts = data.candidates?.[0]?.content?.parts || []
    let imageUrl: string | null = null

    for (const part of parts) {
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
    const errorMessage = error instanceof Error ? error.message : '生成失败，请重试'
    callbacks.onError?.(errorMessage)
  }
}

/**
 * 用户注册/登录 API 响应类型
 */
export interface UserApiResponse {
  success: boolean
  message: string
  code: number
  result: {
    apiKey?: string
  } | null
  timestamp: number
}

/**
 * 注册新用户
 * @param phone 手机号码
 * @returns 用户注册响应
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

    // Always try to parse JSON response, even for HTTP errors
    // The API returns error details in JSON format
    const data = await response.json()
    return data
  } catch (error) {
    console.error('getUserKey error:', error)
    
    // Check if it's a CORS or network error
    const errorMessage = error instanceof Error ? error.message : '查询失败'
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
