import * as THREE from 'three'

import { setup } from './systems/config.js'
import ui from './ui/dom.js'
import { getFaceParams, onMouseMove } from './ui/objects.js'
import { createGround, createWireframe } from './components/generate.js'
import { slice, subdivide, stretch, duplicate } from './components/modify.js'

import { initFaceTracking, getFacePosition } from './blazeface.js'

(function init() {

  let currentPosition = {}

  function trackFace() {

    getFacePosition().then(res => {
      if (res) {
        currentPosition = res
      }
    })

    const x = (500 - currentPosition.x) / 25
    const y = (500 - currentPosition.y) / 25

    state.camera.position.x = x - 10
    state.camera.position.y = y - 10
    state.camera.lookAt(new THREE.Vector3(0, 0, 0))

    state.rerender = true

    requestAnimationFrame(trackFace)
  }
  initFaceTracking().then(() => trackFace())


  const container = document.querySelector('.world')
  const controlDisplay = document.querySelector('.controls p')

  const inspector = {
    container: document.querySelector('.inspector'),
    id: document.querySelector('.inspector-id'),
    colors: document.querySelectorAll('.inspector .colors button')
  }

  const toolbar = {
    container: document.querySelector('.tools'),
    pallette: {
      container: document.querySelector('.pallette'),
      input: document.querySelector('.pallette input')
    }
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
    rerender: false,

    inspector: {
      activeColor: 0
    }
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

  inspector.colors.forEach((button, i) => button.addEventListener('click', () => {
    setState({
      inspector: { ...state.inspector, activeColor: i }
    })
  }))

  // bindInput(toolbar.pallette.input, value => {
  //   // Check valid hex
  //   if (!/[\da-f]{6}/.test(value)) return

  //   // Set color on object
  //   const selected = state.scene.getObjectByProperty('uuid', state.selectedObjects[0])
  //   selected.material[state.inspector.activeColor].color.setHex(`0x${value}`)

  //   // Call new render / draw
  //   setState({ rerender: true })
  // })

  toolbar.pallette.input.addEventListener('keydown', e => e.stopPropagation())
  toolbar.pallette.input.addEventListener('input', event => {

    const value = event.target.value

    // Check valid hex
    if (!/[\da-f]{6}/.test(value)) return

    // Set color on object
    const selected = state.scene.getObjectByProperty('uuid', state.selectedObjects[0])
    selected.material[state.inspector.activeColor].color.setHex(`0x${value}`)

    // Call new render / draw
    setState({ rerender: true })
  })

  const draw = () => {
    controlDisplay.textContent = state.action

    const selected = state.scene.getObjectByProperty('uuid', state.selectedObjects[0])

    ui.toggleInspector(inspector, toolbar, selected)

    if (!selected) return

    // Render Inspector

    ui.setPalletteColors(inspector, toolbar, selected, state.inspector.activeColor)

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
        '%c r e n d e r i n g 🤖 ',
        'color: #333; background: plum; font-weight: bold; line-height: 1.2rem;'
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

    if (!state.keys.Shift && !state.cancelAction) {
      updateScene('wireframes', 'clear')
      setState({ selectedObjects: [] })
    }

    if (cancelAction || !activeObjects.current) {
      setState({ cancelAction: false })
      return
    }

    const clickedObject = scene.getObjectByProperty('uuid', activeObjects.current.id)

    if (clickedObject.isGround && !['select', 'duplicate'].includes(action))
      return

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
        updateScene('voxels', 'add', duplicate(clickedObject, activeObjects.current))
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