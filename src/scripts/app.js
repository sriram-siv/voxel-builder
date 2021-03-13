import * as THREE from 'three'

import { setup } from './systems/config.js'
import ui from './ui/dom.js'
import { onMouseMove } from './ui/objects.js'
import { createGround, createWireframe } from './components/generate.js'
import { slice, subdivide, stretch, duplicate } from './components/modify.js'

(function init() {

  const container = document.querySelector('.world')
  const controlDisplay = document.querySelector('.controls p')
  const inspector = {
    id: document.querySelector('.inspector-id'),
    colors: document.querySelectorAll('.inspector .colors div')
  }


  const state = {

    keys: ui.keyRegister(),

    activeObjects: {
      current: null,
      prev: []
    },
    selectedObjects: [],

    action: 'select',
    cancelAction: false,
    rerender: false
  }

  const setState = changes => {
    if (!changes) return
    // Warning: this is only a shallow copy
    Object.keys(changes).forEach(key => state[key] = changes[key])

    requestAnimationFrame(draw) //-> non-webgl elements

    if (changes.action) {
      updateScene('wireframes', 'clear')
      state.selectedObjects = []
    }
    
    state.rerender = true
  }

  const draw = () => {
    controlDisplay.textContent = state.action

    const selected = state.scene.getObjectByProperty('uuid', state.selectedObjects[0])

    if (selected) {
      selected.material.forEach((material, i) => {

        const r = material.color.r * 255
        const g = material.color.g * 255
        const b = material.color.b * 255

        inspector.colors[i].style.backgroundColor = `rgb(${r}, ${g}, ${b})`
      })
    } else {
      inspector.colors.forEach(cell => cell.style.backgroundColor = 'black')
    }
  }

  const updateScene = (groupName, action, ...objects) => {
    const group = state.scene.getObjectByName(groupName)

    if (action === 'clear')
      group.remove(...group.children)
    else
      group[action]?.(...objects)
    
    // Set flag for animate loop to call a new render
    state.rerender = true
  }


  const controls = {
    onClick: handleMouseClick,
    onDrag: () =>
      setState({ cancelAction: true }),
    onMouseMove: event =>
      setState(onMouseMove(state, ui.getMousePos(event))),
    update: () =>
      state.rerender = true,
    keys: {
      x: () =>
        setState(ui.cycleAction(1, state.action)),
      z: () =>
        setState(ui.cycleAction(-1, state.action)),
      q: () =>
        console.log(calculateAxisProjection(state))
    }
  }

  // Initialise scene and controls
  setState(setup(container, controls))

  // Generate ground layer
  updateScene('voxels', 'add', ...createGround())

  function animate() {

    const { scene, camera, renderer } = state

    handleHover(state)

    if (state.rerender) {
      renderer.render(scene, camera)
      state.rerender = false
      console.log(
        '%c rendering 🤖 ',
        'color: #333; background: plum; font-weight: bold; line-height: 1.2rem'
      )
    }
    requestAnimationFrame(animate)
  }
  animate()

  function handleHover(state) {

    const { scene, activeObjects } = state

    activeObjects.prev.forEach(data => {
      const object = scene.getObjectByProperty('uuid', data.id)
      if (!object) return
      const { r, g, b } = data.color
      const color = new THREE.Color(r, g, b)
      object.material[data.face].color.set(color)
    })
    activeObjects.prev = []

    if (activeObjects.current) {
      const { id, face } = activeObjects.current
      const object = scene.getObjectByProperty('uuid', id)

      if (object)
        object.material[face].color.set(new THREE.Color('forestgreen'))
    }
  }

  function handleMouseClick(event) {
    const { scene, activeObjects, action, cancelAction } = state

    if (!state.keys.Shift) {
      updateScene('wireframes', 'clear')
      setState({ selectedObjects: [] })
    }

    if (cancelAction || !activeObjects.current) {
      setState({ cancelAction: false })
      return
    }

    const clickedObject = scene.getObjectByProperty('uuid', activeObjects.current.id)

    switch (action) {
      case 'select':
        updateScene('wireframes', 'add', createWireframe(clickedObject))
        setState({ selectedObjects: [...state.selectedObjects, clickedObject.uuid] })
        break
      case 'delete':
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'slice x':
        updateScene('voxels', 'add', ...slice(clickedObject, 'width'))
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'slice y':
        updateScene('voxels', 'add', ...slice(clickedObject, 'height'))
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'slice z':
        updateScene('voxels', 'add', ...slice(clickedObject, 'depth'))
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'subdivide':
        updateScene('voxels', 'add', ...subdivide(clickedObject))
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'stretch':
        updateScene('voxels', 'add', stretch(clickedObject, activeObjects.current.face))
        updateScene('voxels', 'remove', clickedObject)
        break
      case 'duplicate':
        updateScene('voxels', 'add', duplicate(clickedObject, activeObjects.current.face))
        break
    }

    // Recast ray
    requestAnimationFrame(() => {
      setState(onMouseMove(state, ui.getMousePos(event)))
    })

  }


  const calculateAxisProjection = ({ scene, camera, activeObjects }) => {

    const object = scene.getObjectByProperty('uuid', activeObjects.current?.id)
    if (!object) return

    const getScreenPos = (obj, vertex) => {
      const { position } = obj.geometry.attributes
      const vector = new THREE.Vector3()
        .fromBufferAttribute(position, vertex)
        .applyMatrix4(obj.matrixWorld)
      return vector.project(camera)
    }

    const axes = Array([16, 17], [5, 4]).map(([i, j]) => {
      const a = getScreenPos(object, i)
      const b = getScreenPos(object, j)
      const diff = { x: b.x - a.x, y: (b.y - a.y) / camera.aspect }
      const offset = diff.x > 0 ? 0 : Math.PI
      return (Math.atan(diff.y / diff.x) + offset + (Math.PI * 2)) % (Math.PI * 2)
    })

    // TODO this also needs the length of the unit in perspective

    const measurement = {}

    window.addEventListener('mousemove', ({ clientX, clientY }) => {
      if (!measurement.init)
        measurement.init = { x: clientX, y: clientY }

      const offset = {
        x: clientX - measurement.init.x,
        y: measurement.init.y - clientY
      }


    })

    return { x: axes[0], z: axes[1] }
  }
  
})()