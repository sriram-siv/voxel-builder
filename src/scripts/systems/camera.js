import { PerspectiveCamera } from 'three'

function setSize(camera, container, renderer) {
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()

  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
}

function createCamera(container, renderer, onResize) {
  const camera = new PerspectiveCamera(
    30,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  camera.position.z = 70

  setSize(camera, container, renderer)

  window.addEventListener('resize', event => {
    setSize(camera, container, renderer)
    onResize?.(event)
  })

  return camera
}

export { createCamera }