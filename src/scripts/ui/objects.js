export const objectInRay = ({ raycaster, camera, scene }, mousePos) => {
  raycaster.setFromCamera(mousePos, camera)
  const voxels = scene.getObjectByName('voxels')
  const intersects = raycaster.intersectObjects(voxels.children)
  return intersects[0] ?? false
}

export const getCubeFace = index => Math.floor(index / 2)

export const getDimensions = object => object.geometry.parameters

export const getFaceParams = face => {
  const [param, axis] = [['width', 'x'], ['height', 'y'], ['depth', 'z']][Math.floor(face / 2)]
  const shift = [1, -1][face % 2]
  return { param, axis, shift }
}

export const onMouseMove = (state, mousePos) => {

  const { activeObjects } = state
  const { object, faceIndex } = objectInRay(state, mousePos)

  const objectID = object?.uuid ?? null
  const face = getCubeFace(faceIndex)
  const color = { ...object?.material[face].color }

  const hasRegistered = [...activeObjects.prev, activeObjects.current].some(data => {
    return data?.id === objectID && data?.face === face || objectID === activeObjects.current
  })

  if (hasRegistered) return

  const current = objectID ? { id: objectID, face, color } : null
  const prev = [
    ...activeObjects.prev,
    { ...activeObjects.current }
  ]

  return { activeObjects: { current, prev } }
}