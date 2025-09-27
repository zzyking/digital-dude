# 多模态数字人交互系统

一个基于 React + TypeScript + WebRTC 的多模态数字人交互前端应用，支持语音、手势、人脸表情识别以及实时对话功能。

![[./docs/frontend.png]]

## 功能特性

### 🎯 核心功能
- **多模态交互**: 支持语音、手势、文字三种交互方式
- **实时数字人**: 基于 WebRTC 的实时数字人视频流
- **智能识别**:
  - 人脸表情识别（愤怒、高兴、惊讶等9种情绪）
  - 手势识别（点赞、比心、数字手势等24种手势）
  - 语音识别（支持讯飞语音API）
- **实时对话**: 智能对话系统，支持多模态信息融合

### 🛠 技术栈
- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 7.x
- **UI框架**: Tailwind CSS 3.x
- **实时通信**: WebRTC + Socket.IO
- **AI识别**:
  - 百度AI开放平台（人脸识别、手势识别）
  - 讯飞开放平台/Cloudflare AI whisper（语音识别）

## 项目结构

```
digital-dude/
├── src/
│   ├── components/          # React组件
│   │   ├── ChatInterface.tsx      # 聊天界面
│   │   ├── DigitalHumanWebRTC.tsx # WebRTC数字人
│   │   ├── MediaControls.tsx      # 媒体控制
│   │   ├── VisionRecognition.tsx  # 视觉识别
│   │   └── VoiceRecognition.tsx   # 语音识别
│   ├── hooks/               # React Hooks
│   │   ├── useWhisper.ts           # Whisper语音识别
│   │   └── useXunfei.ts           # 讯飞语音识别
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── utils/               # 工具函数
│   │   ├── index.ts
│   │   └── viteDetectionClient.ts
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源
├── .env.example            # 环境变量示例
├── vite.config.ts          # Vite配置
├── tailwind.config.js      # Tailwind配置
├── tsconfig.json           # TypeScript配置
└── package.json            # 项目依赖
```

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm (推荐) 或 npm

### 安装依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 配置API密钥：
```env
# 百度人脸识别API
VITE_FACE_ACCESS_TOKEN=your_baidu_face_token

# 百度手势识别API
VITE_GESTURE_ACCESS_TOKEN=your_baidu_gesture_token

# 讯飞语音识别API
VITE_XUNFEI_APP_ID=your_xunfei_app_id
VITE_XUNFEI_API_KEY=your_xunfei_api_key
VITE_XUNFEI_API_SECRET=your_xunfei_api_secret

# Cloudflare (可选)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### 运行项目
```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview

# 代码检查
pnpm lint
```

## API配置说明

### 百度智能云开放平台
1. 注册[百度智能云](https://cloud.baidu.com/)
2. 创建应用获取Access Token
3. 配置[人脸识别](https://cloud.baidu.com/doc/FACE/s/yk37c1u4t)和[手势识别](https://cloud.baidu.com/doc/BODY/s/4k3cpywrv)服务

### 讯飞开放平台
1. 注册[讯飞开放平台](https://www.xfyun.cn/)
2. 创建语音识别应用
3. 配置[语音听写](https://www.xfyun.cn/doc/asr/voicedictation/API.html)服务，获取AppID、API Key、API Secret

## 开发指南

如需详细开发指南，请查阅 [docs/development.md](docs/development.md)。

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 贡献指南

欢迎提交Issue和Pull Request来改进项目。

## 更新日志

### v0.0.0 (当前版本)
- 初始版本发布
- 支持多模态交互
- 集成WebRTC数字人
- 实现语音、手势、表情识别

---

如有问题或建议，请提交Issue或联系开发团队。