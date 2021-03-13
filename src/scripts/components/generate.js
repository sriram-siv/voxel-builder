import {
  BoxBufferGeometry,
  MeshBasicMaterial,
  Mesh,
  EdgesGeometry
} from 'three'

import { matrix } from '../helpers.js'

import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'

const createCube = ({ dimensions, materials, position }) => {

  if (!position) position = { x: 0, y: 0, z: 0 }

  const geometry = new BoxBufferGeometry(...dimensions || [])

  if (Array.isArray(materials)) [...materials]
  else if (materials === 'ground') materials = groundColors()
  else if (materials) materials = Array.from({ length: 6 }, () => materials)
  else materials = defaultColors()

  const material = materials.map(color => new MeshBasicMaterial({ color }))
  const cube = new Mesh(geometry, material)

  cube.position.set(position.x, position.y, position.z)
  
  return cube
}

const defaultColors = () => ['plum', 'palevioletred', 'papayawhip', 'lightgreen', 'lightblue', 'slateblue']
const groundColors = () => [0x1b0000, 'saddlebrown', 'darkgreen', 'plum', 'saddlebrown', 0x1b0000]

const createWireframe = (object) => {
  const edges = new EdgesGeometry(object.geometry)
  const lineGeometry = new LineSegmentsGeometry().setPositions(edges.attributes.position.array)
  const lineMaterial = new LineMaterial({ color: 0x55ffff, linewidth: 2 })
  lineMaterial.resolution.set( window.innerWidth, window.innerHeight )
  const wireframe = new LineSegments2(lineGeometry, lineMaterial)
  Array('x', 'y', 'z').forEach(axis => wireframe.position[axis] = object.position[axis])
  return wireframe
}

const createGround = () => {

  return matrix(32, 32).map(([i, j]) => (

    createCube({
      materials: 'ground',
      position: { x: i - 16, y: -1, z: j - 16 }
    })

  ))
}

export { createCube, createWireframe, createGround }