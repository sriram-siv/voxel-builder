import * as THREE from '../node_modules/three/build/three.module.js'

import config from './config.js'
import ui from './ui.js'
import generate from './generate.js'
import { cleanSet } from './helpers.js'

function init() {

  const state = {
    keys: ui.keyRegister(),
    wasActiveObject: new Set(),
    isActiveObject: null,
    cubes: {}
  }

  const setState = changes => {
    // Warning: this is only a shallow copy
    Object.keys(changes).forEach(key => state[key] = changes[key])
    // draw() -> non-webgl elements
  }

  // initialise THREE objects
  const { sceneShell, scene, camera, renderer, raycaster } = config.setup()
  document.body.appendChild(renderer.domElement)

  const addToScene = newObject => {
    setState({ cubes: { ...state.cubes, [newObject.uuid]: newObject } })
    scene.add(newObject)
  }

  const removeFromScene = removedObject => {
    const cubes = { ...state.cubes }
    delete cubes[removedObject.uuid]
    setState({ cubes })
    scene.remove(removedObject)
  }

  // Platform
  for (let i = 0; i < 32; i++) {
    for (let j = 0; j < 32; j++) {
      addToScene(generate.cube(
        [1, 1, 1],
        'darkgreen',
        { x: i - 16, y: -1, z: j - 16 }
      ))
    }
  }
  
  // Starting cube
  addToScene(generate.cube(
    [1, 1, 1],
    'default',
    { x: 0, y: 0, z: 0 }
  ))

  const subdivide = cube => {

    const scale = cube.geometry.parameters.width / 2
    const displacement = scale / 2

    const translations = [
      { x: 1, y: 1, z: 1 },
      { x: -1, y: 1, z: 1 },
      { x: 1, y: -1, z: 1 },
      { x: -1, y: -1, z: 1 },
      { x: 1, y: 1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: 1, y: -1, z: -1 },
      { x: -1, y: -1, z: -1 }
    ]

    const subcubes = translations.map(translation => {
      const position = Object.keys(translation).reduce((obj, axis) => ({
        ...obj, [axis]: cube.position[axis] + (translation[axis] * displacement)
      }), {})
      return generate.cube(
        [scale, scale, scale],
        cube.initMaterials,
        position
      )
    })

    return subcubes
  }


  function animate() {

    requestAnimationFrame(animate)
    renderer.render(sceneShell, camera)

    const { cubes, isActiveObject, wasActiveObject } = state

    wasActiveObject.forEach(id => {

      const object = cubes[id]
      object?.wasActiveFace?.forEach(face => {

        object.material[face] = new THREE.MeshBasicMaterial({ color: object.initMaterials[face] })
        object.wasActiveFace.delete(face)
      })

      wasActiveObject.delete(id)
    })

    const active = cubes[isActiveObject]
    if (active) {
      const { isActiveFace, wasActiveFace, material, initMaterials } = active
      wasActiveFace.forEach(face => {

        material[face] = new THREE.MeshBasicMaterial({ color: initMaterials[face] })
        wasActiveFace.delete(face)
      })

      material[isActiveFace] = new THREE.MeshBasicMaterial({ color: 'forestgreen' })
    }
  }
  animate()

  window.addEventListener('mousedown', () => {
    ui.dragMouse(event => {
      scene.rotation.y += event.movementX / 100
      sceneShell.rotation.x = Math.min(Math.max(sceneShell.rotation.x + event.movementY / 100, -Math.PI / 2), Math.PI / 2)
    })
  })

  window.addEventListener('mousemove', event => {

    const { isActiveObject, wasActiveObject, cubes } = state

    const { object, faceIndex } = ui.objectInRay(raycaster, camera, scene, getMousePos(event))
    const objectID = object?.uuid ?? null
    const face = ui.getCubeFace(faceIndex)

    const activeCube = cubes[objectID]

    if (isActiveObject !== objectID) {
      wasActiveObject.add(isActiveObject)
      const lastCube = cubes[isActiveObject]

      if (lastCube) {
        lastCube.wasActiveFace.add(lastCube.isActiveFace)
        lastCube.isActiveFace = null
      }
    }

    if (activeCube) {
      activeCube.wasActiveFace.add(activeCube.isActiveFace)
      activeCube.wasActiveFace = cleanSet(activeCube.wasActiveFace)
      activeCube.isActiveFace = face
    }

    state.isActiveObject = objectID
  })

  const getMousePos = event => new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  )


  // Zoom in/out
  window.addEventListener('mousewheel', e => camera.position.z += e.deltaY / 10)

  // Camera tracking
  window.addEventListener('keydown', event => {
    if (event.repeat) return

    let timer
    let speed

    if (event.key === 'ArrowLeft') speed = -0.02
    if (event.key === 'ArrowRight') speed = 0.02

    const track = () => camera.position.x += speed

    const cleanUp = () => {
      clearInterval(timer)
      timer = null
      window.removeEventListener('keyup', cleanUp)
    }

    if (speed) {
      timer = setInterval(track, 16)
      window.addEventListener('keyup', cleanUp)
    }
  })



  window.addEventListener('dblclick', () => {
    const clickedObject = state.cubes[state.isActiveObject]
    if (!clickedObject) return

    if (state.keys.Alt) {
      if (Object.keys(state.cubes).length > 1)
        removeFromScene(clickedObject)
      return
    }

    if (state.keys.Shift) {
      subdivide(clickedObject).forEach(subcube => addToScene(subcube))
      removeFromScene(clickedObject)
      return
    }

    const { position, isActiveFace } = clickedObject
    const translations = [['x', 1], ['x', -1], ['y', 1], ['y', -1], ['z', 1], ['z', -1]]
    const [axis, shift] = translations[isActiveFace]
    const scale = ui.getDimensions(clickedObject).width

    addToScene(
      generate.cube(
        [scale, scale, scale],
        'default',
        { ...position, [axis]: position[axis] + (shift * scale) }
      )
    )

    // TODO recast ray
    // this doesnt update wasActive yet
    setState({ isActiveObject: null })
  })

  
}

window.addEventListener('DOMContentLoaded', init)