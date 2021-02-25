import * as THREE from './three.module.js'

const cube = (dimensions, initMaterials, position) => {
  const geometry = new THREE.BoxGeometry(...dimensions)

  if (Array.isArray(initMaterials)) [...initMaterials]
  else if (initMaterials === 'default') initMaterials = defaultColors()
  else initMaterials = Array.from({ length: 6 }, () => initMaterials)

  const material = initMaterials.map(color => new THREE.MeshBasicMaterial({ color }))
  const cube = new THREE.Mesh(geometry, material)

  Object.keys(position).forEach(axis => cube.position[axis] = position[axis])
  cube.activeFace = null
  cube.wasActiveFace = new Set()
  cube.initMaterials = [...initMaterials]
  
  return cube
}

// const randomColors = () => Array.from({ length: 6 }).map(() => {
//   const colors = ['plum', 'palevioletred', 'papayawhip', 'lightgreen', 'lightblue', 'slateblue']
//   const random = Math.floor(Math.random() * 6)
//   return colors[random]
// })

const defaultColors = () => ['plum', 'palevioletred', 'papayawhip', 'lightgreen', 'lightblue', 'slateblue']

export default { cube }