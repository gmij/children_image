import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Button } from '@tarojs/components'
import { registerUser, getUserKey, setApiKey } from '../../services/api'
import { useTranslation } from '../../utils/i18n'
import './index.scss'

export default function Register() {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualApiKey, setManualApiKey] = useState('')

  // 处理注册/登录
  const handleRegister = async () => {
    if (!phone.trim()) {
      Taro.showToast({
        title: t('pleaseInputPhone'),
        icon: 'none'
      })
      return
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.trim())) {
      Taro.showToast({
        title: t('pleaseInputValidPhone'),
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
          title: t('registerSuccess'),
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
        const message = registerResponse.message || ''
        if (message.includes('其他渠道') || message.includes('其它渠道') || message.includes('别的渠道') || message.includes('已经存在')) {
          // 显示手动输入 API Key 的选项
          setErrorMessage(message)
          setShowManualEntry(true)
          Taro.showModal({
            title: t('tip'),
            content: t('otherChannelWarning'),
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
                title: t('loginSuccess'),
                icon: 'success',
                duration: 2000
              })
              
              setTimeout(() => {
                Taro.reLaunch({ url: '/pages/index/index' })
              }, 2000)
              return
            } else {
              setErrorMessage(getUserResponse.message || t('saveFailed'))
            }
          } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : t('saveFailed'))
          }
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('saveFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  // 手动输入 API Key
  const handleManualSave = () => {
    if (!manualApiKey.trim()) {
      Taro.showToast({
        title: t('pleaseInputApiKey'),
        icon: 'none'
      })
      return
    }

    setApiKey(manualApiKey.trim())
    Taro.showToast({
      title: t('generateSuccess'),
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
        <Text className='register-title'>📱 {t('registerTitle')}</Text>
        <Text className='register-desc'>
          {t('registerDesc')}
        </Text>
      </View>

      {/* 手机号输入区 */}
      <View className='register-section'>
        <Text className='section-title'>{t('phoneLabel')}</Text>
        <Input
          className='phone-input'
          type='number'
          maxlength={11}
          placeholder={t('phonePlaceholder')}
          value={phone}
          onInput={(e) => setPhone(e.detail.value)}
          disabled={isLoading}
        />

        <Button
          className={`register-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? `⏳ ${t('processing')}` : `✨ ${t('registerButton')}`}
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
          <Text className='section-title'>{t('manualEntryTitle')}</Text>
          <Text className='manual-desc'>
            {t('manualEntryDesc')}
          </Text>
          <Input
            className='apikey-input'
            placeholder={t('apiKeyPlaceholder2')}
            value={manualApiKey}
            onInput={(e) => setManualApiKey(e.detail.value)}
          />
          <Button className='manual-save-btn' onClick={handleManualSave}>
            💾 {t('manualSaveButton')}
          </Button>
        </View>
      )}

      {/* 帮助说明 */}
      <View className='help-section'>
        <Text className='help-title'>📖 {t('registerHelpTitle')}</Text>
        <View className='help-content'>
          <Text className='help-text'>
            {t('registerHelp1')}{'\n'}
            {t('registerHelp2')}{'\n'}
            {t('registerHelp3')}{'\n'}
            {t('registerHelp4')}
          </Text>
        </View>
      </View>

      {/* 已有 API Key 按钮 */}
      <View className='alternative-section'>
        <Text className='alternative-text'>{t('haveApiKey')}</Text>
        <Button className='settings-link-btn' onClick={goToSettings}>
          {t('directConfig')}
        </Button>
      </View>
    </View>
  )
}
