import * as THREE from '../node_modules/three/build/three.module.js'

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

const getMousePos = event => new THREE.Vector2(
  (event.clientX / window.innerWidth) * 2 - 1,
  -(event.clientY / window.innerHeight) * 2 + 1
)

export default { keyRegister, dragMouse, getMousePos }