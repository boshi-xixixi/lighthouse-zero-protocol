import { defineConfig, presetUno, presetAttributify, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    colors: {
      bg: {
        base: '#050508',
        card: '#0a0d14',
        elevated: '#0e1119',
        hover: '#12151f',
      },
      border: {
        DEFAULT: 'rgba(140, 150, 180, 0.08)',
        subtle: 'rgba(140, 150, 180, 0.05)',
        muted: 'rgba(140, 150, 180, 0.12)',
        visible: 'rgba(140, 150, 180, 0.18)',
        glow: 'rgba(140, 155, 195, 0.25)',
      },
      text: {
        primary: '#c0c4cc',
        secondary: '#989cb4',
        tertiary: '#78829a',
        muted: '#5a6278',
        dim: '#4a5068',
        ghost: '#3a4058',
      },
      accent: {
        person: '#c4b5a8',
        item: '#a8c4b5',
        place: '#a8b5c4',
        secret: '#c4a8b5',
        event: '#b5c4a8',
        sound: '#c4c4a8',
      },
      chapter: {
        1: '#7a8aaa',
        2: '#9a8ab5',
        3: '#8a9a88',
        4: '#9a7a8a',
      },
      gold: {
        light: '#e0d4a8',
        DEFAULT: '#c8b888',
        dark: '#a89868',
        dim: '#887848',
      },
      secret: {
        light: '#c0b0d0',
        DEFAULT: '#a088b8',
        dark: '#8878a8',
        dim: '#685888',
      },
    },
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
    },
    transitionDuration: {
      'fast': '100ms',
      'normal': '200ms',
      'slow': '300ms',
    },
    animation: {
      'fade-in': 'fade-in 0.2s ease-out forwards',
      'fade-up': 'fade-up 0.25s ease-out forwards',
      'scale-in': 'scale-in 0.25s ease-out forwards',
      'spin-slow': 'spin 20s linear infinite reverse',
    },
    keyframes: {
      'fade-in': {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      'fade-up': {
        from: { opacity: '0', transform: 'translateY(8px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      'scale-in': {
        from: { opacity: '0', transform: 'scale(0.96)' },
        to: { opacity: '1', transform: 'scale(1)' },
      },
    },
  },
  shortcuts: {
    'card-base': 'bg-bg-card/60 border border-border rounded-sm relative overflow-hidden',
    'btn-ghost': 'bg-transparent border border-border cursor-pointer text-text-secondary transition-all duration-normal hover:border-border-visible hover:text-text-primary',
    'text-body': 'text-text-secondary leading-relaxed',
    'text-label': 'text-text-muted text-xs font-semibold tracking-widest uppercase',
  },
})
