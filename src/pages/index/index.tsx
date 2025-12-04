import { useState, useEffect } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { View, Text, Textarea, Image, Button, Picker } from '@tarojs/components'
import { generateImage, hasApiKey, GenerateOptions } from '../../services/api'
import './index.scss'

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
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0) // 默认 A4
  const [isLandscape, setIsLandscape] = useState(false) // 默认纵向
  const [showPreview, setShowPreview] = useState(false) // 图片预览弹窗

  // 检查 API Key 配置状态 - 页面首次加载时
  useEffect(() => {
    setHasKey(hasApiKey())
  }, [])

  // 页面显示时重新检查 API Key 状态（从设置页返回时触发）
  useDidShow(() => {
    setHasKey(hasApiKey())
  })

  // 跳转到设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
  }

  // 获取当前选择的纵横比
  const getAspectRatio = (): string => {
    const paper = PAPER_SIZES[selectedPaperIndex]
    return isLandscape ? paper.landscape : paper.portrait
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
          Taro.showToast({
            title: '生成成功！',
            icon: 'success'
          })
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

      {/* 纸张设置 */}
      <View className="paper-section">
        <Text className="section-title">📐 纸张设置</Text>
        <View className="paper-options">
          {/* 纸张尺寸选择 */}
          <View className="paper-picker">
            <Text className="picker-label">纸张尺寸：</Text>
            <Picker
              mode='selector'
              range={PAPER_SIZES.map(p => p.name)}
              value={selectedPaperIndex}
              onChange={(e) => setSelectedPaperIndex(Number(e.detail.value))}
            >
              <View className="picker-value">
                <Text>{PAPER_SIZES[selectedPaperIndex].name}</Text>
                <Text className="picker-arrow">▼</Text>
              </View>
            </Picker>
          </View>
          {/* 横向/纵向切换 */}
          <View className="orientation-toggle">
            <Text className="picker-label">方向：</Text>
            <View className="toggle-btns">
              <View
                className={`toggle-btn ${!isLandscape ? 'active' : ''}`}
                onClick={() => setIsLandscape(false)}
              >
                <Text>📄 纵向</Text>
              </View>
              <View
                className={`toggle-btn ${isLandscape ? 'active' : ''}`}
                onClick={() => setIsLandscape(true)}
              >
                <Text>📃 横向</Text>
              </View>
            </View>
          </View>
        </View>
        <Text className="ratio-hint">当前比例：{getAspectRatio()}</Text>
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

      {/* 生成结果 - 缩略图预览 */}
      {generatedImage && (
        <View className="result-section">
          <Text className="section-title">🎉 生成结果（点击查看大图）</Text>
          <View className="thumbnail-wrapper" onClick={() => setShowPreview(true)}>
            <Image
              className="thumbnail-image"
              src={generatedImage}
              mode="aspectFit"
            />
            <View className="zoom-hint">
              <Text>🔍 点击查看完整图片</Text>
            </View>
          </View>
          <Button className="save-btn" onClick={handleSave}>
            💾 保存图片
          </Button>
        </View>
      )}

      {/* 图片预览弹窗 */}
      {showPreview && generatedImage && (
        <View className="preview-modal" onClick={() => setShowPreview(false)}>
          <View className="preview-content">
            <Image
              className="preview-image"
              src={generatedImage}
              mode="aspectFit"
              showMenuByLongpress
            />
            <View className="preview-close">
              <Text>✕ 点击任意处关闭</Text>
            </View>
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
