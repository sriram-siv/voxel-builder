import { createCube } from './generate.js'
import { getDimensions, getFaceParams } from '../ui/objects.js'

export const slice = (cube, axis) => {

  const scale = getDimensions(cube)
  scale[axis] /= 2
  const displacement = scale[axis] / 2
  const dimension = { width: 'x', height: 'y', depth: 'z' }[axis]

  return [1, -1].map(shift => {

    const dimensions = [scale.width, scale.height, scale.depth]
    const materials = cube.initMaterials
    const position = {
      ...cube.position,
      [dimension]: cube.position[dimension] + (displacement * shift)
    }

    return createCube({ dimensions, materials, position })
  })
}

export const subdivide = (cube) => {
  return slice(cube, 'width')
    .map(subcube => slice(subcube, 'height')).flat()
    .map(subcube => slice(subcube, 'depth')).flat()
}

export const stretch = (object, face) => {
  const { position } = object
  const { param, axis, shift } = getFaceParams(face)

  const dimensions = getDimensions(object)
  const newPosition = { ...position, [axis]: position[axis] + (shift / 2) }
  const { width, height, depth } = { ...dimensions, [param]: dimensions[param] + 1 }

  const stretched = createCube({
    dimensions: [width, height, depth],
    position: newPosition
  })

  return stretched
}

export const duplicate = (object, face) => {
  const { position } = object
  const { param, axis, shift } = getFaceParams(face)
  const dimensions = getDimensions(object)
  const scale = dimensions[param]
  const { width, height, depth } = dimensions

  const duplicated = createCube({
    dimensions: [width, height, depth],
    position: { ...position, [axis]: position[axis] + (shift * scale) }
  })

  return duplicated
}