/**
 * Internationalization utility
 * Supports English (default) and Chinese
 */

// Translation keys and their values
export const translations = {
  en: {
    // Main page
    appTitle: 'AI Handwritten Newspaper Generator',
    appSubtitle: 'Create beautiful handwritten newspapers for children',
    apiKeyWarning: 'Please configure API Key to use',
    newUserRegister: 'New user? Click to register',
    inputPromptTitle: 'Enter Newspaper Theme',
    inputPromptPlaceholder: 'e.g., Spring is coming, flowers are blooming',
    examplesTitle: 'Try These Themes',
    generateButton: 'Generate Newspaper',
    generating: 'Generating...',
    resultTitle: 'Result',
    saveButton: 'Save Image',
    footerText: 'Powered by Gemini 3 Pro | Designed for kindergarten moms ❤️',
    loadingText: 'AI is creating the newspaper, please wait...',
    errorPrefix: '❌ ',
    pleaseInputPrompt: 'Please enter a prompt',
    pleaseConfigApiKey: 'Please configure API Key first',
    goToConfig: 'Go to Config',
    generateSuccess: 'Generated successfully!',
    saved: 'Saved!',
    saveFailed: 'Save failed',
    
    // Example prompts
    exampleSpring: 'Spring is coming, flowers are blooming',
    exampleHome: 'I love my home',
    exampleAnimals: 'Happy day of little animals',
    exampleEarth: 'Protect the earth, care for the environment',
    exampleFestival: 'Happy Mid-Autumn Festival',
    
    // Settings page
    settingsTitle: 'API Configuration',
    settingsDesc: 'Configure Wanjie Ark API Key to use Gemini 3 Pro image generation service',
    apiKeyLabel: 'API Key',
    showKey: 'Show',
    hideKey: 'Hide',
    apiKeyPlaceholder: 'Please enter your API Key',
    saveSettings: 'Save Settings',
    clearButton: 'Clear',
    logoutButton: 'Logout',
    helpTitle: 'How to Get API Key?',
    helpStep1: '1. Visit Wanjie Ark platform',
    helpStep2: '2. Register and login',
    helpStep3: '3. Go to "Personal Center"',
    helpStep4: '4. Copy your API Key',
    newUserQuickRegister: 'New User Quick Registration',
    infoTitle: 'Notes',
    infoText1: '• API Key is only saved locally on your device',
    infoText2: '• Keep it safe and do not share with others',
    infoText3: '• Model used: gemini-3-pro-image-preview',
    confirmClear: 'Confirm Clear',
    confirmClearContent: 'Are you sure you want to clear the API Key?',
    cleared: 'Cleared',
    pleaseInputApiKey: 'Please enter API Key',
    
    // Register page
    registerTitle: 'User Registration/Login',
    registerDesc: 'Enter your phone number to register or login',
    phoneLabel: 'Phone Number',
    phonePlaceholder: 'Please enter your phone number',
    registerButton: 'Register/Login',
    processing: 'Processing...',
    manualEntryTitle: 'Manual API Key Entry',
    manualEntryDesc: 'You have registered in another channel, no free credits available. Please enter your API Key to continue',
    apiKeyPlaceholder2: 'Please enter your API Key',
    manualSaveButton: 'Save and Continue',
    registerHelpTitle: 'Registration Instructions',
    registerHelp1: '• First time: Enter phone number to register quickly',
    registerHelp2: '• Existing account: Enter phone number to login directly',
    registerHelp3: '• Registered in other channel: Need to enter API Key manually',
    registerHelp4: '• New users enjoy free usage credits',
    haveApiKey: 'Already have API Key?',
    directConfig: 'Direct Configuration →',
    pleaseInputPhone: 'Please enter phone number',
    pleaseInputValidPhone: 'Please enter a valid phone number',
    registerSuccess: 'Registration successful!',
    loginSuccess: 'Login successful!',
    otherChannelWarning: 'You have registered in another channel, no free credits available. Please enter your API Key manually',
    networkError: 'Network connection failed, please check your network or try using the Mini Program',
    
    // Common
    cancel: 'Cancel',
    confirm: 'Confirm',
    tip: 'Tip',
  },
  zh: {
    // Main page
    appTitle: 'AI 手抄报生成器',
    appSubtitle: '为宝贝生成精美的手抄报',
    apiKeyWarning: '请先配置 API Key 才能使用',
    newUserRegister: '新用户？点击快速注册',
    inputPromptTitle: '输入手抄报主题',
    inputPromptPlaceholder: '例如：春天来了，花儿开放',
    examplesTitle: '试试这些主题',
    generateButton: '生成手抄报',
    generating: '正在生成中...',
    resultTitle: '生成结果',
    saveButton: '保存图片',
    footerText: 'Powered by Gemini 3 Pro | 专为幼儿园妈妈设计 ❤️',
    loadingText: 'AI 正在为宝贝创作手抄报，请稍候...',
    errorPrefix: '❌ ',
    pleaseInputPrompt: '请输入提示词',
    pleaseConfigApiKey: '请先配置 API Key',
    goToConfig: '去配置',
    generateSuccess: '生成成功！',
    saved: '已下载！',
    saveFailed: '保存失败',
    
    // Example prompts
    exampleSpring: '春天来了，花儿开放',
    exampleHome: '我爱我的家',
    exampleAnimals: '小动物们的快乐一天',
    exampleEarth: '保护地球，爱护环境',
    exampleFestival: '中秋节快乐',
    
    // Settings page
    settingsTitle: 'API 配置',
    settingsDesc: '配置万界方舟 API Key 以使用 Gemini 3 Pro 图像生成服务',
    apiKeyLabel: 'API Key',
    showKey: '显示',
    hideKey: '隐藏',
    apiKeyPlaceholder: '请输入您的 API Key',
    saveSettings: '保存设置',
    clearButton: '清除',
    logoutButton: '退出登录',
    helpTitle: '如何获取 API Key？',
    helpStep1: '1. 访问 万界方舟 平台',
    helpStep2: '2. 注册并登录账号',
    helpStep3: '3. 进入「个人中心」',
    helpStep4: '4. 复制您的 API Key',
    newUserQuickRegister: '新用户快速注册',
    infoTitle: '说明',
    infoText1: '• API Key 仅保存在您的设备本地',
    infoText2: '• 请妥善保管，不要泄露给他人',
    infoText3: '• 使用的模型：gemini-3-pro-image-preview',
    confirmClear: '确认清除',
    confirmClearContent: '确定要清除 API Key 吗？',
    cleared: '已清除',
    pleaseInputApiKey: '请输入 API Key',
    
    // Register page
    registerTitle: '用户注册/登录',
    registerDesc: '输入手机号即可快速注册或登录',
    phoneLabel: '手机号码',
    phonePlaceholder: '请输入您的手机号',
    registerButton: '注册/登录',
    processing: '处理中...',
    manualEntryTitle: '手动输入 API Key',
    manualEntryDesc: '您已在其他渠道注册过，没有赠送额度。请输入您的 API Key 继续使用',
    apiKeyPlaceholder2: '请输入您的 API Key',
    manualSaveButton: '保存并继续',
    registerHelpTitle: '注册说明',
    registerHelp1: '• 首次使用：输入手机号即可快速注册',
    registerHelp2: '• 已有账号：输入手机号直接登录',
    registerHelp3: '• 其他渠道注册：需手动输入 API Key',
    registerHelp4: '• 新用户享有免费使用额度',
    haveApiKey: '已有 API Key？',
    directConfig: '直接配置 →',
    pleaseInputPhone: '请输入手机号',
    pleaseInputValidPhone: '请输入有效的手机号',
    registerSuccess: '注册成功！',
    loginSuccess: '登录成功！',
    otherChannelWarning: '您已在其他渠道注册过，没有赠送额度。请手动输入您的 API Key',
    networkError: '网络连接失败，请检查网络或尝试使用小程序访问',
    
    // Common
    cancel: '取消',
    confirm: '确定',
    tip: '提示',
  }
}

export type Language = 'en' | 'zh'
export type TranslationKey = keyof typeof translations.en

/**
 * Get the current language based on browser/system settings
 */
export function getLanguage(): Language {
  if (process.env.TARO_ENV === 'h5') {
    // H5 environment - use browser language
    const lang = navigator.language.toLowerCase()
    return lang.startsWith('zh') ? 'zh' : 'en'
  } else {
    // WeChat Mini Program environment
    try {
      const systemInfo = wx.getSystemInfoSync()
      const lang = systemInfo.language.toLowerCase()
      return lang.startsWith('zh') ? 'zh' : 'en'
    } catch {
      return 'en'
    }
  }
}

/**
 * Get translation for a specific key
 */
export function t(key: TranslationKey): string {
  const lang = getLanguage()
  return translations[lang][key] || translations.en[key] || key
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const lang = getLanguage()
  
  return {
    t: (key: TranslationKey) => translations[lang][key] || translations.en[key] || key,
    lang
  }
}
