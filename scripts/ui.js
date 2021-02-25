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

const objectInRay = (raycaster, camera, scene, mousePos) => {
  raycaster.setFromCamera(mousePos, camera)
  const intersects = raycaster.intersectObjects(scene.children)
  return intersects[0] ?? false
}

const getCubeFace = index => Math.floor(index / 2)

const getDimensions = object => object.geometry.parameters

export default { keyRegister, dragMouse, objectInRay, getCubeFace, getDimensions }