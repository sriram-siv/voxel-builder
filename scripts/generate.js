import * as THREE from './three.module.js'

const cube = (dimensions, initMaterials, position) => {
  const geometry = new THREE.BoxGeometry(...dimensions)

  if (Array.isArray(initMaterials)) [...initMaterials]
  else if (initMaterials === 'default') initMaterials = defaultColors()
  else initMaterials = Array.from({ length: 6 }, () => initMaterials)

  const material = initMaterials.map(color => new THREE.MeshBasicMaterial({ color }))
  const cube = new THREE.Mesh(geometry, material)

  Object.keys(position).forEach(axis => cube.position[axis] = position[axis])

  cube.initMaterials = [...initMaterials]
  
  return cube
}

const defaultColors = () => ['plum', 'palevioletred', 'papayawhip', 'lightgreen', 'lightblue', 'slateblue']

export default { cube }