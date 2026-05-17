import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WarningView from '../views/WarningView.vue'
import ChapterView from '../views/ChapterView.vue'
import GameView from '../views/GameView.vue'
import ResultView from '../views/ResultView.vue'
import GameResultView from '../views/GameResultView.vue'
import { useTTS } from '../utils/tts'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/warning',
    name: 'warning',
    component: WarningView
  },
  {
    path: '/chapter/:id',
    name: 'chapter',
    component: ChapterView,
    props: true
  },
  {
    path: '/game/:type',
    name: 'game',
    component: GameView,
    props: true
  },
  {
    path: '/game-result/:type',
    name: 'gameResult',
    component: GameResultView,
    props: true
  },
  {
    path: '/result',
    name: 'result',
    component: ResultView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const tts = useTTS()
  tts.stop()
  next()
})

export default router
