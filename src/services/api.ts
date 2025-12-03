/**
 * Gemini 3 Pro 图像生成 API 服务
 * 使用万界方舟 OpenAI 兼容接口
 */

// API 配置
const API_BASE_URL = 'https://maas-openapi.wanjiedata.com/api/v1'
const MODEL_NAME = 'gemini-3-pro-image-preview'

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
 * 使用流式响应
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
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        stream: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    // 处理流式响应
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取响应流')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let lastImageUrl = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      
      // 解析 SSE 格式的数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          
          if (data === '[DONE]') {
            continue
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content || ''
            
            // 使用统一的图片提取方法
            const imageUrl = extractImageFromContent(content)
            if (imageUrl) {
              lastImageUrl = imageUrl
              callbacks.onProgress?.(imageUrl)
            }
          } catch (parseError) {
            // SSE 流中可能有不完整的 JSON 数据，这是正常的，继续处理
            console.debug('SSE 数据解析跳过:', parseError)
          }
        }
      }
    }

    if (lastImageUrl) {
      callbacks.onComplete?.(lastImageUrl)
    } else {
      callbacks.onError?.('未能生成图片，请重试')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '生成失败，请重试'
    callbacks.onError?.(errorMessage)
  }
}

/**
 * 非流式调用（备用方案）
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
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 请求失败: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // 使用统一的图片提取方法
    const imageUrl = extractImageFromContent(content)

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
