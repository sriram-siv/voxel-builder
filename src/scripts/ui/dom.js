import { Vector2 } from 'three'

import { mod } from '../helpers.js'

const keyRegister = () => {
  const keys = {}
  window.addEventListener('keydown', e => keys[e.key] = true)
  window.addEventListener('keyup', e => keys[e.key] = false)
  return keys
}

const dragMouse = onDrag => {

  const cleanUp = () => {
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', cleanUp)
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', cleanUp)
}

const getMousePos = event => new Vector2(
  (event.clientX / window.innerWidth) * 2 - 1,
  -(event.clientY / window.innerHeight) * 2 + 1
)

const cycleAction = (step, current) => {
  const actions = ['select', 'delete', 'duplicate', 'slice x', 'slice y', 'slice z', 'subdivide', 'stretch']
  const currentIndex = actions.indexOf(current)
  const next = mod(currentIndex + step, actions.length)
  return { action: actions[next] }
}

export default { keyRegister, dragMouse, getMousePos, cycleAction }