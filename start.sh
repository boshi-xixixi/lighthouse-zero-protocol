#!/bin/bash

echo "🎮 镜像之旅 - MBTI谜题冒险游戏"
echo "=================================="
echo ""

cd "$(dirname "$0")"

echo "📦 检查依赖..."
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install
fi

echo ""
echo "🚀 启动开发服务器..."
echo "访问地址: http://localhost:5174/"
echo ""

npm run dev
