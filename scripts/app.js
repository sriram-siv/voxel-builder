import * as THREE from './three.module.js'

import config from './config.js'
import ui from './ui.js'
import generate from './generate.js'
import { objectInRay, getCubeFace, getDimensions, getFaceParams } from './geometry.js'
import { range, matrix } from './helpers.js'

function init() {

  const controlDisplay = document.querySelector('.controls p')

  const state = {
    keys: ui.keyRegister(),

    activeObjects: {
      current: null,
      prev: []
    },

    cubes: {},
    action: 'duplicate'
  }

  const setState = changes => {
    if (!changes) return
    // Warning: this is only a shallow copy
    Object.keys(changes).forEach(key => state[key] = changes[key])
    requestAnimationFrame(draw) //-> non-webgl elements
  }

  const draw = () => {
    controlDisplay.textContent = state.action
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

  const cycleAction = direction => {
    const actions = ['delete', 'duplicate', 'slice x', 'slice y', 'slice z', 'stretch']
    const step = { forward: 1, back: actions.length - 1 }[direction]
    if (!step) return state.action
    const current = actions.indexOf(state.action)
    const next = (current + step) % actions.length
    return actions[next]
  }

  window.addEventListener('keydown', event => {
    if (event.key === 'x') setState({ action: cycleAction('forward') })
    if (event.key === 'z') setState({ action: cycleAction('back') })
  })

  // Platform 
  for (const [i, j] of matrix(32, 32)) {
    addToScene(generate.cube(
      [1, 1, 1],
      [0x1b0000, 'saddlebrown', 'darkgreen', 'plum', 'saddlebrown', 0x1b0000],
      { x: i - 16, y: -1, z: j - 16 }
    ))
  }

  const slice = (cube, axis) => {

    const scale = getDimensions(cube)
    scale[axis] /= 2
    const displacement = scale[axis] / 2
    const dimension = { width: 'x', height: 'y', depth: 'z' }[axis]

    return [1, -1].map(shift => {
      return generate.cube(
        [scale.width, scale.height, scale.depth],
        'default',
        { ...cube.position, [dimension]: cube.position[dimension] + (displacement * shift) }
      )
    })
  }

  function animate() {

    requestAnimationFrame(animate)
    renderer.render(sceneShell, camera)

    const { cubes, activeObjects } = state

    activeObjects.prev.forEach(data => {
      const object = cubes[data.id]
      if (!object) return
      object.material[data.face] = new THREE.MeshBasicMaterial({ color: object.initMaterials[data.face] })
    })
    activeObjects.prev = []

    if (activeObjects.current) {
      const { id, face } = activeObjects.current
      const object = cubes[id]
      if (object) 
        object.material[face] = new THREE.MeshBasicMaterial({ color: 'forestgreen' })
    }
  }
  animate()

  window.addEventListener('mousedown', () => {
    // TODO makes scene manipulation stateful
    ui.dragMouse(event => {
      scene.rotation.y += event.movementX / 100
      sceneShell.rotation.x = Math.min(Math.max(sceneShell.rotation.x + event.movementY / 100, -Math.PI / 2), Math.PI / 2)
    })
  })

  const onMouseMove = (event, state) => {
    
    const { object, faceIndex } = objectInRay(raycaster, camera, scene, ui.getMousePos(event))
    const objectID = object?.uuid ?? null
    const face = getCubeFace(faceIndex)

    const { current: last } = state.activeObjects
    if (objectID === last?.id && face === last?.face) return

    const current = objectID ? { id: objectID, face } : null
    const prev = [
      ...state.activeObjects.prev,
      { ...state.activeObjects.current }
    ]

    return { activeObjects: { current, prev } }
  }

  window.addEventListener('mousemove', event => setState(onMouseMove(event, state)))

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

  

  window.addEventListener('dblclick', event => {
    const { activeObjects } = state
    const clickedObject = state.cubes[activeObjects.current.id]
    if (!clickedObject) return

    if (state.action === 'delete') {
      removeFromScene(clickedObject)
    }
    if (state.action === 'slice x') {
      slice(clickedObject, 'width').forEach(subcube => addToScene(subcube))
      removeFromScene(clickedObject)
    }
    if (state.action === 'slice y') {
      slice(clickedObject, 'height').forEach(subcube => addToScene(subcube))
      removeFromScene(clickedObject)
    }
    if (state.action === 'slice z') {
      slice(clickedObject, 'depth').forEach(subcube => addToScene(subcube))
      removeFromScene(clickedObject)
    }

    if (state.action === 'stretch') {
      const { position } = clickedObject
      const { param, axis, shift } = getFaceParams(activeObjects.current.face)

      const dimensions = getDimensions(clickedObject)

      const newPosition = { ...position, [axis]: position[axis] + (shift / 2) }
      const { width, height, depth } = { ...dimensions, [param]: dimensions[param] + 1 }

      removeFromScene(clickedObject)
      addToScene(generate.cube(
        [width, height, depth],
        'default',
        newPosition
      ))
    }

    if (state.action === 'duplicate') {
      const { position } = clickedObject
      const { param, axis, shift } = getFaceParams(activeObjects.current.face)
      const dimensions = getDimensions(clickedObject)
      const scale = dimensions[param]
      const { width, height, depth } = dimensions
  
      addToScene(
        generate.cube(
          [width, height, depth],
          'default',
          { ...position, [axis]: position[axis] + (shift * scale) }
        )
      )
    }

    // Recast ray
    setTimeout(() => setState(onMouseMove(event, state)), 1)

  })

  
}

window.addEventListener('DOMContentLoaded', init)