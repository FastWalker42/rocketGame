class RandomDirectionGraph {
  constructor(container, options = {}) {
    this.options = {
      duration: 5000,
      lineColor: '#00ff00',
      lineWidth: 4,
      showControls: true,
      ...options,
    }

    this.container =
      typeof container === 'string'
        ? document.querySelector(container)
        : container

    this.data = []
    this.currentDirection = { x: 1, y: 0 }
    this.lastDirectionChange = Date.now()
    this.directionChangeInterval = 1000 + Math.random() * 2000 // 1-3 секунды
    this.animationId = null
    this.hueShift = 0

    this.init()
  }

  init() {
    this.createCanvas()
    if (this.options.showControls) {
      this.createControls()
    }
    this.initializeData()
    this.animate()

    // Автоматическое изменение направления
    setInterval(() => this.changeDirection(), 100)
  }

  createCanvas() {
    this.canvas = document.createElement('canvas')
    this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            display: block;
            pointer-events: none;
            z-index: 9998;
        `
    this.container.appendChild(this.canvas)
    this.ctx = this.canvas.getContext('2d')

    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  createControls() {
    this.controls = document.createElement('div')
    this.controls.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 9999;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 1px solid rgba(0, 255, 0, 0.5);
            font-family: Arial, sans-serif;
            color: white;
            pointer-events: auto;
        `

    this.controls.innerHTML = `
            <div style="margin-bottom: 10px; color: #00ff00; font-weight: bold;">
                Random Graph
            </div>
            <div style="margin-bottom: 10px;">
                <input type="range" min="0" max="100" value="50" 
                       style="width: 150px; background: rgba(0, 255, 0, 0.3);">
            </div>
            <div style="color: #00ff00; font-size: 14px;">
                Value: <span class="value">50</span>
            </div>
        `

    this.container.appendChild(this.controls)

    this.slider = this.controls.querySelector('input')
    this.valueDisplay = this.controls.querySelector('.value')

    this.slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value)
      this.valueDisplay.textContent = value
      this.updateValue(value)
    })
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
  }

  initializeData() {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2

    for (let i = 0; i < 100; i++) {
      this.data.push({
        x: centerX,
        y: centerY,
        value: 50,
        time: Date.now() - i * 50,
      })
    }
  }

  changeDirection() {
    const now = Date.now()
    if (
      now - this.lastDirectionChange >
      this.directionChangeInterval
    ) {
      // Случайное изменение направления
      const angle = Math.random() * Math.PI * 2
      this.currentDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }

      this.lastDirectionChange = now
      this.directionChangeInterval = 500 + Math.random() * 2500 // 0.5-3 секунды
    }
  }

  updateValue(value) {
    const lastPoint = this.data[this.data.length - 1]
    const speed = value / 50 // Скорость зависит от значения

    const newX = lastPoint.x + this.currentDirection.x * speed
    const newY = lastPoint.y + this.currentDirection.y * speed

    // Отскок от границ
    let bounced = false
    if (newX <= 0 || newX >= this.canvas.width) {
      this.currentDirection.x *= -1
      bounced = true
    }
    if (newY <= 0 || newY >= this.canvas.height) {
      this.currentDirection.y *= -1
      bounced = true
    }

    // Если отскочили, меняем направление более резко
    if (bounced) {
      this.directionChangeInterval = 200 // Быстрее меняем направление после отскока
    }

    this.data.push({
      x: Math.max(0, Math.min(this.canvas.width, newX)),
      y: Math.max(0, Math.min(this.canvas.height, newY)),
      value: value,
      time: Date.now(),
    })

    // Удаляем старые точки
    const cutoffTime = Date.now() - this.options.duration
    this.data = this.data.filter((point) => point.time >= cutoffTime)
  }

  draw() {
    const ctx = this.ctx
    const width = this.canvas.width
    const height = this.canvas.height

    // Полупрозрачный фон для эффекта шлейфа
    ctx.fillStyle = 'rgba(10, 10, 10, 0.05)'
    ctx.fillRect(0, 0, width, height)

    if (this.data.length < 2) return

    // Анимируем цвет
    this.hueShift = (this.hueShift + 1) % 360
    const hue =
      (120 + Math.sin((this.hueShift * Math.PI) / 180) * 30) % 360

    // Градиент для линии
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 0.6)`)
    gradient.addColorStop(0.5, `hsla(${hue + 60}, 100%, 70%, 0.8)`)
    gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0.6)`)

    // Рисуем линию
    ctx.beginPath()
    ctx.moveTo(this.data[0].x, this.data[0].y)

    for (let i = 1; i < this.data.length; i++) {
      ctx.lineTo(this.data[i].x, this.data[i].y)
    }

    ctx.strokeStyle = gradient
    ctx.lineWidth = this.options.lineWidth
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // Свечение
    ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.5)`
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.shadowBlur = 0

    // Рисуем хвост с градиентом
    if (this.data.length > 10) {
      const tailLength = Math.min(20, this.data.length)
      for (
        let i = this.data.length - tailLength;
        i < this.data.length - 1;
        i++
      ) {
        const alpha =
          (i - (this.data.length - tailLength)) / tailLength

        ctx.beginPath()
        ctx.moveTo(this.data[i].x, this.data[i].y)
        ctx.lineTo(this.data[i + 1].x, this.data[i + 1].y)

        ctx.strokeStyle = `hsla(${hue}, 100%, 50%, ${alpha * 0.8})`
        ctx.lineWidth = this.options.lineWidth * alpha
        ctx.stroke()
      }
    }

    // Рисуем частицы
    this.drawParticles()
  }

  drawParticles() {
    const ctx = this.ctx

    // Частицы только на последних точках
    const particleCount = Math.min(10, this.data.length)
    for (
      let i = this.data.length - particleCount;
      i < this.data.length;
      i++
    ) {
      const point = this.data[i]
      const age = (Date.now() - point.time) / this.options.duration

      if (Math.random() < 0.3) {
        // 30% шанс нарисовать частицу
        const size = Math.random() * 3 + 1
        const alpha = (1 - age) * 0.5

        ctx.beginPath()
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(120, 100%, 70%, ${alpha})`
        ctx.fill()
      }
    }
  }

  animate() {
    this.draw()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    if (this.canvas) {
      this.canvas.remove()
    }
    if (this.controls) {
      this.controls.remove()
    }
  }
}

// Автоматическая инициализация при загрузке
if (typeof window !== 'undefined') {
  window.RandomDirectionGraph = RandomDirectionGraph

  // Авто-инициализация при наличии элемента с id="random-graph"
  document.addEventListener('DOMContentLoaded', () => {
    const autoInitElement = document.getElementById('random-graph')
    if (autoInitElement) {
      window.randomGraphInstance = new RandomDirectionGraph(
        autoInitElement
      )
    }
  })
}

export default RandomDirectionGraph
