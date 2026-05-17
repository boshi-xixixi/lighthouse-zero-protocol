import { Howl } from 'howler'

class BgmManager {
  constructor() {
    this.howl = null
    this.isPlaying = false
    this.volume = 0.1
    this.fadeDuration = 1000
  }

  init(src) {
    if (this.howl) {
      this.howl.unload()
    }

    this.howl = new Howl({
      src: [src],
      loop: true,
      volume: 0,
      html5: true,
      onplay: () => {
        this.isPlaying = true
      },
      onpause: () => {
        this.isPlaying = false
      },
      onstop: () => {
        this.isPlaying = false
      }
    })
  }

  play() {
    if (!this.howl) return

    this.howl.play()
    this.howl.fade(0, this.volume, this.fadeDuration)
  }

  pause() {
    if (!this.howl) return

    this.howl.fade(this.volume, 0, this.fadeDuration)
    setTimeout(() => {
      this.howl.pause()
    }, this.fadeDuration)
  }

  stop() {
    if (!this.howl) return

    this.howl.fade(this.volume, 0, this.fadeDuration)
    setTimeout(() => {
      this.howl.stop()
    }, this.fadeDuration)
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.howl && this.isPlaying) {
      this.howl.volume(this.volume)
    }
  }

  getVolume() {
    return this.volume
  }

  destroy() {
    if (this.howl) {
      this.howl.unload()
      this.howl = null
      this.isPlaying = false
    }
  }
}

export default new BgmManager()
