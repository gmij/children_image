# AI 手抄报生成器 (AI Handwritten Newspaper Generator)

一个多端的 AI 手抄报生成应用，支持 H5 和微信小程序。专为幼儿园妈妈设计，通过一句话描述即可生成适合孩子的精美手抄报。

A multi-platform AI-powered handwritten newspaper generator for children, supporting H5 (Web) and WeChat Mini Program. Designed for kindergarten moms.

## 功能特性 (Features)

- 🎨 **AI 生成** - 使用 Gemini 3 Pro 大模型生成精美手抄报
- 📝 **简单输入** - 只需一句话描述主题即可
- 💡 **示例提示** - 提供多个示例主题快速开始
- 💾 **保存图片** - 保存作品到相册或下载
- 📱 **多端支持** - 同时支持 H5 网页和微信小程序
- 🔐 **安全配置** - API Key 本地存储，安全可靠

## 技术栈 (Tech Stack)

- [Taro](https://taro.jd.com/) - 多端统一开发框架
- [React](https://react.dev/) - UI 组件库
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Sass](https://sass-lang.com/) - CSS 预处理器
- [Gemini 3 Pro](https://fangzhou.wanjiedata.com) - 万界方舟 AI 图像生成

## 快速开始 (Quick Start)

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

获取万界方舟 API Key：
1. 访问 [万界方舟](https://fangzhou.wanjiedata.com/login?inviteCode=xO9h1BTA)
2. 注册并登录账号
3. 在个人中心获取 API Key

### 3. 开发模式

#### H5 网页

```bash
npm run dev:h5
```

访问 http://localhost:10086 查看效果

#### 微信小程序

```bash
npm run dev:weapp
```

使用微信开发者工具打开 `dist/weapp` 目录

### 4. 构建生产版本

#### H5 网页

```bash
npm run build:h5
```

#### 微信小程序

```bash
npm run build:weapp
```

## GitHub Pages 部署

### 自动部署（推荐）

本项目已配置 GitHub Actions 自动部署。只需：

1. 在 GitHub 仓库设置中启用 Pages：
   - 进入 Settings → Pages
   - Source 选择 "GitHub Actions"

2. 推送代码到 `main` 分支，Actions 会自动构建并部署

3. 访问 `https://<username>.github.io/<repo-name>/` 查看

### 手动部署

也可以手动构建并部署：

1. 构建 H5 版本
```bash
npm run build:h5
```

2. 将 `dist/h5` 目录的内容推送到 `gh-pages` 分支，或在 GitHub 仓库设置中配置 Pages

3. 访问 `https://<username>.github.io/<repo-name>/` 即可使用

## 项目结构 (Project Structure)

```
├── config/                 # Taro 配置文件
│   ├── index.js           # 主配置
│   ├── dev.js             # 开发环境配置
│   └── prod.js            # 生产环境配置
├── src/
│   ├── pages/
│   │   ├── index/         # 主页面（生成页面）
│   │   │   ├── index.tsx
│   │   │   ├── index.scss
│   │   │   └── index.config.ts
│   │   └── settings/      # 设置页面（API Key 配置）
│   │       ├── index.tsx
│   │       ├── index.scss
│   │       └── index.config.ts
│   ├── services/
│   │   └── api.ts         # Gemini API 服务
│   ├── app.tsx            # 应用入口
│   ├── app.scss           # 全局样式
│   └── app.config.ts      # 应用配置
├── package.json
├── project.config.json    # 微信小程序项目配置
└── tsconfig.json
```

## 使用说明 (Usage)

1. **配置 API Key** - 首次使用点击右上角设置图标配置 API Key
2. **输入主题** - 在文本框中输入手抄报主题（如：春天来了，花儿开放）
3. **使用示例** - 也可以点击示例标签快速填入主题
4. **生成图片** - 点击"生成手抄报"按钮开始生成
5. **等待生成** - AI 正在创作中，请耐心等待
6. **保存作品** - 生成完成后点击"保存图片"保存到设备

## API 说明

本应用使用万界方舟提供的 Gemini API 接口调用 Gemini 3 Pro 模型：

- **API 端点**: `https://maas-openapi.wanjiedata.com/api/v1beta/models/gemini-3-pro-image-preview:generateContent`
- **模型名称**: `gemini-3-pro-image-preview`
- **支持流式**: 否（文生图接口不支持流式输出）

## 许可证 (License)

MIT