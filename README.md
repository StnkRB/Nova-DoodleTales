# 🎨 DoodleTales: The Magical Storytelling Scout (Amazon Nova 2 Edition)

DoodleTales is an AI-powered interactive storytelling application that brings children's drawings to life. By combining advanced computer vision, multimodal AI, and style-consistent image generation, DoodleTales turns a simple sketch into a living, breathing adventure.

**Built for the Amazon Nova Hackathon.**

## 🌟 Key Features

- **Character Recognition (Vision)**: Automatically identifies and segments characters and objects from a child's drawing using **Amazon Nova 2 Pro**.
- **Multimodal Chat**: Talk directly to the "Storytelling Scout". The scout learns about your characters (names, ages, roles) in real-time using **Amazon Nova 2 Pro's** multimodal capabilities.
- **Style-Consistent Image Generation**: Generates new scenes for the story while strictly maintaining the original drawing style using **Amazon Nova 2 Canvas**.
- **Interactive Canvas**: Characters "come to life" with magical halos and animations when the AI refers to them.

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, Motion.
- **Backend**: Node.js, Express.
- **AI (Amazon Bedrock)**: 
  - `amazon.nova-2-pro-v1:0` (Vision & Reasoning)
  - `amazon.nova-canvas-v1:0` (Style-consistent Image Gen)
- **Infrastructure**: Docker, AWS App Runner (connected to Amazon Bedrock).

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 20+
- AWS Credentials (with Bedrock access)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
```

### 4. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 📦 Deployment

### AWS App Runner (Recommended)
```bash
./scripts/deploy.sh
```

## 📜 License
MIT
