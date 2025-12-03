import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Image, Button } from '@tarojs/components'
import { generateImage, hasApiKey } from '../../services/api'
import './index.scss'

// 示例提示词
const EXAMPLE_PROMPTS = [
  '春天来了，花儿开放',
  '我爱我的家',
  '小动物们的快乐一天',
  '保护地球，爱护环境',
  '中秋节快乐',
]

export default function Index() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState('')
  const [error, setError] = useState('')
  const [hasKey, setHasKey] = useState(false)

  // 检查 API Key 配置状态
  useEffect(() => {
    setHasKey(hasApiKey())
  }, [])

  // 跳转到设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
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

    // 调用非流式 API（文生图不支持流式输出）
    try {
      await generateImage(prompt, {
        onStart: () => {
          console.log('开始生成...')
        },
        onComplete: (imageUrl) => {
          setGeneratedImage(imageUrl)
          setIsGenerating(false)
          Taro.showToast({
            title: '生成成功！',
            icon: 'success'
          })
        },
        onError: (err) => {
          setError(err)
          setIsGenerating(false)
        }
      })
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
  const handleSave = () => {
    if (!generatedImage) return

    if (process.env.TARO_ENV === 'h5') {
      try {
        const link = document.createElement('a')
        link.href = generatedImage
        link.download = `handwritten_newspaper_${Date.now()}.png`
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
        filePath: generatedImage,
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
        <Text className="title">✨ AI 手抄报生成器</Text>
        <Text className="subtitle">为宝贝生成精美的手抄报</Text>
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
        <Text className="section-title">📝 输入手抄报主题</Text>
        <Textarea
          className="prompt-input"
          placeholder="例如：春天来了，花儿开放"
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
        {isGenerating ? '🎨 正在生成中...' : '🚀 生成手抄报'}
      </Button>

      {/* 加载状态 */}
      {isGenerating && (
        <View className="loading-section">
          <View className="loading-spinner" />
          <Text className="loading-text">AI 正在为宝贝创作手抄报，请稍候...</Text>
        </View>
      )}

      {/* 错误提示 */}
      {error && (
        <View className="error-section">
          <Text className="error-text">❌ {error}</Text>
        </View>
      )}

      {/* 生成结果 */}
      {generatedImage && (
        <View className="result-section">
          <Text className="section-title">🎉 生成结果</Text>
          <View className="image-wrapper">
            <Image
              className="generated-image"
              src={generatedImage}
              mode="widthFix"
              showMenuByLongpress
            />
          </View>
          <Button className="save-btn" onClick={handleSave}>
            💾 保存图片
          </Button>
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
