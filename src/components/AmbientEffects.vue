<template>
  <div class="ambient-effects">
    <canvas ref="canvasRef" class="effect-canvas"></canvas>
    <div class="rain-overlay"></div>
    <div class="fog-layer"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
let animationId = null
let particles = []

class Particle {
  constructor(canvas) {
    this.canvas = canvas
    this.reset()
  }

  reset() {
    this.x = Math.random() * this.canvas.width
    this.y = Math.random() * this.canvas.height
    this.size = Math.random() * 2 + 0.5
    this.speedX = (Math.random() - 0.5) * 0.3
    this.speedY = (Math.random() - 0.5) * 0.2
    this.opacity = Math.random() * 0.5 + 0.1
    this.pulseSpeed = Math.random() * 0.02 + 0.01
    this.pulsePhase = Math.random() * Math.PI * 2
  }

  update(time) {
    this.x += this.speedX
    this.y += this.speedY

    this.pulsePhase += this.pulseSpeed
    this.opacity = 0.1 + Math.sin(this.pulsePhase) * 0.2

    if (this.x < 0 || this.x > this.canvas.width ||
        this.y < 0 || this.y > this.canvas.height) {
      this.reset()
    }
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 160, 120, ${this.opacity})`
    ctx.fill()
  }
}

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  
  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    particles = []
    const particleCount = Math.floor((canvas.width * canvas.height) / 15000)
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas))
    }
  }

  resize()
  window.addEventListener('resize', resize)

  function animate(time) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    particles.forEach(particle => {
      particle.update(time)
      particle.draw(ctx)
    })

    animationId = requestAnimationFrame(animate)
  }

  animate(0)
}

onMounted(() => {
  initCanvas()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})
</script>

<style scoped>
.ambient-effects {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.effect-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.rain-overlay {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(140, 150, 180, 0.015) 2px,
    rgba(140, 150, 180, 0.015) 4px
  );
  animation: rain-fall 0.5s linear infinite;
}

@keyframes rain-fall {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(4px);
  }
}

.fog-layer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40%;
  background: linear-gradient(
    to top,
    rgba(60, 65, 80, 0.03) 0%,
    rgba(60, 65, 80, 0.01) 50%,
    transparent 100%
  );
  animation: fog-drift 8s ease-in-out infinite;
}

@keyframes fog-drift {
  0%, 100% {
    opacity: 0.6;
    transform: translateX(0);
  }
  50% {
    opacity: 0.8;
    transform: translateX(2%);
  }
}
</style>
