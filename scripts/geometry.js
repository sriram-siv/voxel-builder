export const objectInRay = (raycaster, camera, scene, mousePos) => {
  raycaster.setFromCamera(mousePos, camera)
  const intersects = raycaster.intersectObjects(scene.children)
  return intersects[0] ?? false
}

export const getCubeFace = index => Math.floor(index / 2)

export const getDimensions = object => object.geometry.parameters

export const getFaceParams = face => {
  const [param, axis] = [['width', 'x'], ['height', 'y'], ['depth', 'z']][Math.floor(face / 2)]
  const shift = [1, -1][face % 2]
  return { param, axis, shift }
}