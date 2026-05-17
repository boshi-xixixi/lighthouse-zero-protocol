import { reactive } from 'vue'

const modalState = reactive({
  visible: false,
  type: 'info',
  title: '',
  message: '',
  confirmText: '确定',
  resolvePromise: null
})

export function useModal() {
  function showModal(type, options = {}) {
    return new Promise((resolve) => {
      modalState.visible = true
      modalState.type = type
      modalState.title = options.title || ''
      modalState.message = options.message || ''
      modalState.confirmText = options.confirmText || '确定'
      modalState.resolvePromise = resolve
    })
  }

  function confirmModal() {
    modalState.visible = false
    if (modalState.resolvePromise) {
      modalState.resolvePromise(true)
      modalState.resolvePromise = null
    }
  }

  function cancelModal() {
    modalState.visible = false
    if (modalState.resolvePromise) {
      modalState.resolvePromise(false)
      modalState.resolvePromise = null
    }
  }

  return {
    modalState,
    showModal,
    confirmModal,
    cancelModal
  }
}
