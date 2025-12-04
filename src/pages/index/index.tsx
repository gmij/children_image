import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Textarea, Image, Button } from '@tarojs/components'
import { 
  generateImage, hasApiKey, GenerateOptions, 
  getPaperSizeIndex, getPaperOrientation, 
  getImageStyle, STYLE_NAMES,
  getImageHistory, addImageToHistory, deleteImageFromHistory, HistoryImage
} from '../../services/api'
import './index.scss'

// 历史图片最大数量
const MAX_HISTORY_IMAGES = 3

// 示例提示词
const EXAMPLE_PROMPTS = [
  '春天来了，花儿开放',
  '我爱我的家',
  '小动物们的快乐一天',
  '保护地球，爱护环境',
  '中秋节快乐',
]

// 纸张尺寸选项 (宽:高)
const PAPER_SIZES = [
  { name: 'A4 纸', ratio: '210:297', portrait: '2:3', landscape: '3:2' },
  { name: 'A3 纸', ratio: '297:420', portrait: '2:3', landscape: '3:2' },
  { name: '正方形', ratio: '1:1', portrait: '1:1', landscape: '1:1' },
  { name: '16:9 屏幕', ratio: '16:9', portrait: '9:16', landscape: '16:9' },
  { name: '4:3 屏幕', ratio: '4:3', portrait: '3:4', landscape: '4:3' },
]

export default function Index() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false) // 全屏预览
  const [currentStyle, setCurrentStyle] = useState('handwritten') // 当前风格
  const [historyImages, setHistoryImages] = useState<HistoryImage[]>([]) // 历史图片
  const [previewHistoryImage, setPreviewHistoryImage] = useState<string | null>(null) // 预览历史图片

  // 检查 API Key 配置状态 - 页面首次加载时
  useEffect(() => {
    setHasKey(hasApiKey())
    setCurrentStyle(getImageStyle())
    setHistoryImages(getImageHistory())
  }, [])

  // 页面显示时重新检查 API Key 状态和风格（从设置页返回时触发）
  useDidShow(() => {
    setHasKey(hasApiKey())
    setCurrentStyle(getImageStyle())
    setHistoryImages(getImageHistory())
  })

  // 跳转到设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
  }

  // 获取当前选择的纵横比（从存储读取）
  const getAspectRatio = (): string => {
    const paperIndex = getPaperSizeIndex()
    const isLandscape = getPaperOrientation()
    const paper = PAPER_SIZES[paperIndex]
    return isLandscape ? paper.landscape : paper.portrait
  }

  // 获取风格名称
  const getStyleName = (): string => {
    return STYLE_NAMES[currentStyle] || '手抄报'
  }

  // 关闭全屏预览并保存到历史
  const closeFullscreenAndSave = () => {
    if (generatedImage) {
      const newImage = addImageToHistory(generatedImage)
      setHistoryImages(prev => [newImage, ...prev].slice(0, 3))
    }
    setShowFullscreen(false)
    setGeneratedImage('')
  }

  // 删除历史图片
  const handleDeleteHistory = (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          deleteImageFromHistory(imageId)
          setHistoryImages(prev => prev.filter(img => img.id !== imageId))
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }

  // 生成图片
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Taro.showToast({
        title: '请输入提示词',
        icon: 'none'
      })
      return
    }

    if (!hasApiKey()) {
      Taro.showModal({
        title: '提示',
        content: '请先配置 API Key',
        confirmText: '去配置',
        success: (res) => {
          if (res.confirm) {
            goToSettings()
          }
        }
      })
      return
    }

    setIsGenerating(true)
    setError('')
    setGeneratedImage('')

    const options: GenerateOptions = {
      aspectRatio: getAspectRatio()
    }

    // 调用非流式 API（文生图不支持流式输出）
    try {
      await generateImage(prompt, {
        onStart: () => {
          console.log('开始生成...')
        },
        onComplete: (imageUrl) => {
          setGeneratedImage(imageUrl)
          setIsGenerating(false)
          setShowFullscreen(true) // 生成完成后直接显示全屏
        },
        onError: (err) => {
          setError(err)
          setIsGenerating(false)
        }
      }, options)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
      setIsGenerating(false)
    }
  }

  // 使用示例提示词
  const useExample = (example: string) => {
    setPrompt(example)
  }

  // 保存图片
  const handleSave = (imageUrl: string) => {
    if (!imageUrl) return

    if (process.env.TARO_ENV === 'h5') {
      try {
        const link = document.createElement('a')
        link.href = imageUrl
        link.download = `${getStyleName()}_${Date.now()}.png`
        link.click()
        Taro.showToast({
          title: '已下载！',
          icon: 'success'
        })
      } catch {
        Taro.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    } else {
      // 小程序环境
      Taro.saveImageToPhotosAlbum({
        filePath: imageUrl,
        success: () => {
          Taro.showToast({
            title: '保存成功！',
            icon: 'success'
          })
        },
        fail: () => {
          Taro.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      })
    }
  }

  return (
    <View className="container">
      {/* 头部标题 */}
      <View className="header">
        <Text className="title">✨ AI {getStyleName()}生成器</Text>
        <Text className="subtitle">为宝贝生成精美的{getStyleName()}</Text>
        <View className="settings-btn" onClick={goToSettings}>
          <Text className="settings-icon">⚙️</Text>
        </View>
      </View>

      {/* API Key 提示 */}
      {!hasKey && (
        <View className="api-tip" onClick={goToSettings}>
          <Text className="tip-text">⚠️ 请先配置 API Key 才能使用</Text>
        </View>
      )}

      {/* 输入区域 */}
      <View className="input-section">
        <Text className="section-title">📝 输入{getStyleName()}主题</Text>
        <Textarea
          className="prompt-input"
          placeholder={`例如：春天来了，花儿开放`}
          value={prompt}
          onInput={(e) => setPrompt(e.detail.value)}
          maxlength={200}
          disabled={isGenerating}
        />
        <View className="char-count">
          <Text>{prompt.length}/200</Text>
        </View>
      </View>

      {/* 示例提示词 */}
      <View className="examples-section">
        <Text className="section-title">💡 试试这些主题</Text>
        <View className="examples">
          {EXAMPLE_PROMPTS.map((example, index) => (
            <View
              key={index}
              className="example-tag"
              onClick={() => useExample(example)}
            >
              <Text>{example}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 生成按钮 */}
      <Button
        className={`generate-btn ${isGenerating ? 'loading' : ''}`}
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? '🎨 正在生成中...' : `🚀 生成${getStyleName()}`}
      </Button>

      {/* 加载状态 */}
      {isGenerating && (
        <View className="loading-section">
          <View className="loading-spinner" />
          <Text className="loading-text">AI 正在为宝贝创作{getStyleName()}，请稍候...</Text>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View className="error-section">
          <Text className="error-text">❌ {error}</Text>
        </View>
      )}

      {/* 历史图片区域 */}
      {historyImages.length > 0 && (
        <View className="history-section">
          <Text className="section-title">📸 历史图片（最多保存3张）</Text>
          <View className="history-list">
            {historyImages.map((img) => (
              <View key={img.id} className="history-item">
                <Image
                  className="history-thumbnail"
                  src={img.url}
                  mode="aspectFill"
                  onClick={() => setPreviewHistoryImage(img.url)}
                />
                <View 
                  className="history-delete"
                  onClick={(e) => handleDeleteHistory(e, img.id)}
                >
                  <Text>×</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 全屏预览 - 新生成的图片 */}
      {showFullscreen && generatedImage && (
        <View className="fullscreen-overlay">
          <View className="fullscreen-close" onClick={closeFullscreenAndSave}>
            <Text>×</Text>
          </View>
          <View className="fullscreen-content">
            <Image
              className="fullscreen-image"
              src={generatedImage}
              mode="aspectFit"
              showMenuByLongpress
            />
          </View>
          <View className="fullscreen-actions">
            <Button className="save-btn-fullscreen" onClick={() => handleSave(generatedImage)}>
              💾 保存图片
            </Button>
          </View>
        </View>
      )}

      {/* 历史图片预览 */}
      {previewHistoryImage && (
        <View className="fullscreen-overlay" onClick={() => setPreviewHistoryImage(null)}>
          <View className="fullscreen-close" onClick={() => setPreviewHistoryImage(null)}>
            <Text>×</Text>
          </View>
          <View className="fullscreen-content">
            <Image
              className="fullscreen-image"
              src={previewHistoryImage}
              mode="aspectFit"
              showMenuByLongpress
            />
          </View>
          <View className="fullscreen-actions">
            <Button className="save-btn-fullscreen" onClick={() => handleSave(previewHistoryImage)}>
              💾 保存图片
            </Button>
          </View>
        </View>
      )}

      {/* 底部说明 */}
      <View className="footer">
        <Text className="footer-text">
          Powered by Gemini 3 Pro | 专为幼儿园妈妈设计 ❤️
        </Text>
      </View>
    </View>
  )
}
