#!/bin/bash

# ============================================
# 灯塔零点协议 - 启动脚本
# LIGHTHOUSE: ZERO PROTOCOL - Start Script
# ============================================

echo "🗼  灯塔零点协议 - 启动中..."
echo "================================"

# 检查 Python3 是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到 Python3，请先安装 Python3"
    exit 1
fi

# 切换到项目目录
cd "$(dirname "$0")"

# 获取可用端口（默认 8080）
PORT=${1:-8080}

echo "📂 项目目录: $(pwd)"
echo "🌐 服务地址: http://localhost:$PORT"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动 HTTP 服务器
python3 -m http.server $PORT