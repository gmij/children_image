import { useState, useEffect, useMemo, useCallback } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea, Button, Picker } from '@tarojs/components'
import { getApiKey, setApiKey, getPaperSizeIndex, setPaperSizeIndex, getPaperOrientation, setPaperOrientation } from '../../services/api'
import './index.scss'

// 纸张尺寸选项 (宽:高)
const PAPER_SIZES = [
  { name: 'A4 纸', ratio: '210:297', portrait: '2:3', landscape: '3:2' },
  { name: 'A3 纸', ratio: '297:420', portrait: '2:3', landscape: '3:2' },
  { name: '正方形', ratio: '1:1', portrait: '1:1', landscape: '1:1' },
  { name: '16:9 屏幕', ratio: '16:9', portrait: '9:16', landscape: '16:9' },
  { name: '4:3 屏幕', ratio: '4:3', portrait: '3:4', landscape: '4:3' },
]

export default function Settings() {
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedPaperIndex, setSelectedPaperIndex] = useState(0)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const savedKey = getApiKey()
    if (savedKey) {
      setApiKeyValue(savedKey)
    }
    // 加载纸张设置
    setSelectedPaperIndex(getPaperSizeIndex())
    setIsLandscape(getPaperOrientation())
  }, [])

  // 显示的值：显示模式下显示真实值，隐藏模式下显示 mask
  const displayValue = useMemo(() => {
    if (isEditing) return apiKeyValue
    return showKey ? apiKeyValue : '•'.repeat(apiKeyValue?.length || 0)
  }, [showKey, apiKeyValue, isEditing])

  const handleInput = useCallback((e) => {
    if (isEditing) {
      setApiKeyValue(e.detail.value)
    }
  }, [isEditing])

  const handleSave = () => {
    if (!apiKeyValue.trim()) {
      Taro.showToast({
        title: '请输入 API Key',
        icon: 'none'
      })
      return
    }

    setApiKey(apiKeyValue.trim())
    setIsEditing(false)
    Taro.showToast({
      title: '保存成功！',
      icon: 'success'
    })
  }

  const handleClear = () => {
    Taro.showModal({
      title: '确认清除',
      content: '确定要清除 API Key 吗？',
      success: (res) => {
        if (res.confirm) {
          setApiKey('')
          setApiKeyValue('')
          setIsEditing(true)
          Taro.showToast({
            title: '已清除',
            icon: 'success'
          })
        }
      }
    })
  }

  const toggleShowKey = () => {
    setShowKey(!showKey)
  }

  // 保存纸张尺寸
  const handlePaperSizeChange = (index: number) => {
    setSelectedPaperIndex(index)
    setPaperSizeIndex(index)
  }

  // 保存纸张方向
  const handleOrientationChange = (landscape: boolean) => {
    setIsLandscape(landscape)
    setPaperOrientation(landscape)
  }

  // 获取当前比例
  const getAspectRatio = (): string => {
    const paper = PAPER_SIZES[selectedPaperIndex]
    return isLandscape ? paper.landscape : paper.portrait
  }

  // 是否已设置 API Key
  const hasKey = apiKeyValue && apiKeyValue.length > 0

  return (
    <View className="settings-container">
      <View className="settings-header">
        <Text className="settings-title">⚙️ 设置</Text>
        <Text className="settings-desc">
          配置 API Key 和图像生成参数
        </Text>
      </View>

      {/* API Key 设置 */}
      <View className="settings-section">
        <View className="section-header">
          <Text className="section-title">🔐 API Key</Text>
          {hasKey && !isEditing && (
            <View className="status-badge">
              <Text className="status-text">✅ 已设置</Text>
            </View>
          )}
        </View>

        {hasKey && !isEditing ? (
          <View className="api-status">
            <Text className="api-hint">API Key 已配置，可以开始生成图片</Text>
            <View className="button-group">
              <Button className="update-btn" onClick={() => setIsEditing(true)}>
                ✏️ 更新 API Key
              </Button>
              <Button className="clear-btn" onClick={handleClear}>
                🗑️ 清除
              </Button>
            </View>
          </View>
        ) : (
          <>
            <View className="input-wrapper">
              <Textarea
                className="api-input"
                placeholder="请输入您的 API Key"
                value={isEditing ? apiKeyValue : displayValue}
                onInput={handleInput}
                maxlength={-1}
              />
            </View>
            <View className="button-group">
              <Button className="save-btn" onClick={handleSave}>
                💾 保存 API Key
              </Button>
              {isEditing && hasKey && (
                <Button className="cancel-btn" onClick={() => setIsEditing(false)}>
                  取消
                </Button>
              )}
            </View>
          </>
        )}
      </View>

      {/* 纸张设置 */}
      <View className="settings-section">
        <Text className="section-title">📐 纸张设置</Text>
        <View className="paper-options">
          {/* 纸张尺寸选择 */}
          <View className="paper-picker">
            <Text className="picker-label">纸张尺寸：</Text>
            <Picker
              mode='selector'
              range={PAPER_SIZES.map(p => p.name)}
              value={selectedPaperIndex}
              onChange={(e) => handlePaperSizeChange(Number(e.detail.value))}
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
                onClick={() => handleOrientationChange(false)}
              >
                <Text>📄 纵向</Text>
              </View>
              <View
                className={`toggle-btn ${isLandscape ? 'active' : ''}`}
                onClick={() => handleOrientationChange(true)}
              >
                <Text>📃 横向</Text>
              </View>
            </View>
          </View>
        </View>
        <Text className="ratio-hint">当前比例：{getAspectRatio()}</Text>
      </View>

      <View className="help-section">
        <Text className="help-title">📖 如何获取 API Key？</Text>
        <View className="help-steps">
          <Text className="help-step">1. 点击下方按钮访问万界方舟平台</Text>
          <Text className="help-step">2. 注册并登录账号</Text>
          <Text className="help-step">3. 进入「个人中心」</Text>
          <Text className="help-step">4. 复制您的 API Key</Text>
        </View>
        <View className="promo-info">
          <Text className="promo-text">🎁 新用户注册赠送 16 元代金券，可生成约 16-20 张图片！</Text>
        </View>
        <Button 
          className="register-btn"
          onClick={() => {
            const url = 'https://fangzhou.wanjiedata.com/login?inviteCode=xO9h1BTA'
            if (process.env.TARO_ENV === 'h5') {
              window.open(url, '_blank')
            } else {
              Taro.setClipboardData({
                data: url,
                success: () => {
                  Taro.showToast({
                    title: '链接已复制，请在浏览器打开',
                    icon: 'none',
                    duration: 2000
                  })
                }
              })
            }
          }}
        >
          🚀 立即注册获取 API Key
        </Button>
      </View>

      <View className="info-section">
        <Text className="info-title">ℹ️ 说明</Text>
        <Text className="info-text">
          • API Key 仅保存在您的设备本地{'\n'}
          • 请妥善保管，不要泄露给他人{'\n'}
          • 使用的模型：gemini-3-pro-image-preview
        </Text>
      </View>
    </View>
  )
}
