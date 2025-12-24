import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'
import { registerUser, getUserKey, setApiKey } from '../../services/api'
import './index.scss'

export default function Register() {
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualApiKey, setManualApiKey] = useState('')

  // 处理注册/登录
  const handleRegister = async () => {
    if (!phone.trim()) {
      Taro.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.trim())) {
      Taro.showToast({
        title: '请输入有效的手机号',
        icon: 'none'
      })
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setShowManualEntry(false)

    try {
      // 先尝试注册
      const registerResponse = await registerUser(phone.trim())
      
      if (registerResponse.success && registerResponse.result?.apiKey) {
        // 注册成功，保存 API Key
        setApiKey(registerResponse.result.apiKey)
        Taro.showToast({
          title: '注册成功！',
          icon: 'success',
          duration: 2000
        })
        
        // 延迟返回首页
        setTimeout(() => {
          Taro.reLaunch({ url: '/pages/index/index' })
        }, 2000)
        return
      }

      // 如果注册失败，检查错误信息
      if (!registerResponse.success) {
        // 检查是否是"用户在其他渠道已存在"的错误
        if (registerResponse.message.includes('其它渠道') || registerResponse.message.includes('别的渠道') || registerResponse.message.includes('已经存在')) {
          // 显示手动输入 API Key 的选项
          setErrorMessage(registerResponse.message)
          setShowManualEntry(true)
          Taro.showModal({
            title: '提示',
            content: '您已在其它渠道注册过，没有赠送额度。请手动输入您的 API Key',
            showCancel: false
          })
        } else {
          // 其他错误，尝试用 getUserKey 查询
          try {
            const getUserResponse = await getUserKey(phone.trim())
            
            if (getUserResponse.success && getUserResponse.result?.apiKey) {
              // 查询成功，保存 API Key
              setApiKey(getUserResponse.result.apiKey)
              Taro.showToast({
                title: '登录成功！',
                icon: 'success',
                duration: 2000
              })
              
              setTimeout(() => {
                Taro.reLaunch({ url: '/pages/index/index' })
              }, 2000)
              return
            } else {
              setErrorMessage(getUserResponse.message || '登录失败')
            }
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : '查询失败')
          }
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '操作失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 手动输入 API Key
  const handleManualSave = () => {
    if (!manualApiKey.trim()) {
      Taro.showToast({
        title: '请输入 API Key',
        icon: 'none'
      })
      return
    }

    setApiKey(manualApiKey.trim())
    Taro.showToast({
      title: '保存成功！',
      icon: 'success',
      duration: 2000
    })

    setTimeout(() => {
      Taro.reLaunch({ url: '/pages/index/index' })
    }, 2000)
  }

  // 返回设置页面
  const goToSettings = () => {
    Taro.navigateTo({ url: '/pages/settings/index' })
  }

  return (
    <View className='register-container'>
      <View className='register-header'>
        <Text className='register-title'>📱 新用户注册/登录</Text>
        <Text className='register-desc'>
          输入手机号即可快速注册或登录
        </Text>
      </View>

      {/* 手机号输入区 */}
      <View className='register-section'>
        <Text className='section-title'>手机号码</Text>
        <Input
          className='phone-input'
          type='number'
          maxlength={11}
          placeholder='请输入您的手机号'
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
          disabled={isLoading}
        />

        <Button
          className={`register-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? '⏳ 处理中...' : '✨ 注册/登录'}
        </Button>
      </View>

      {/* 错误信息 */}
      {errorMessage && (
        <View className='error-section'>
          <Text className='error-text'>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* 手动输入 API Key（当用户已在其他渠道注册时显示） */}
      {showManualEntry && (
        <View className='manual-entry-section'>
          <Text className='section-title'>手动输入 API Key</Text>
          <Text className='manual-desc'>
            您已在其它渠道注册过，没有赠送额度。请输入您的 API Key 继续使用
          </Text>
          <Input
            className='apikey-input'
            placeholder='请输入您的 API Key'
            value={manualApiKey}
            onInput={(e) => setManualApiKey(e.detail.value)}
          />
          <Button className='manual-save-btn' onClick={handleManualSave}>
            💾 保存并继续
          </Button>
        </View>
      )}

      {/* 帮助说明 */}
      <View className='help-section'>
        <Text className='help-title'>📖 注册说明</Text>
        <View className='help-content'>
          <Text className='help-text'>
            • 首次使用：输入手机号即可快速注册{'\n'}
            • 已有账号：输入手机号直接登录{'\n'}
            • 其他渠道注册：需手动输入 API Key{'\n'}
            • 新用户享有免费使用额度
          </Text>
        </View>
      </View>

      {/* 已有 API Key 按钮 */}
      <View className='alternative-section'>
        <Text className='alternative-text'>已有 API Key？</Text>
        <Button className='settings-link-btn' onClick={goToSettings}>
          直接配置 →
        </Button>
      </View>
    </View>
  )
}
