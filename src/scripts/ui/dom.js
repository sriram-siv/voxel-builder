import { Vector2 } from 'three'

import { mod } from '../helpers.js'
import { getMaterialRGB } from './objects.js'

const keyRegister = () => {
  const keys = {}
  window.addEventListener('keydown', e => keys[e.key] = true)
  window.addEventListener('keyup', e => keys[e.key] = false)
  return keys
}

const dragMouse = onDrag => {

  const cleanUp = () => {
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', cleanUp)
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', cleanUp)
}

const getMousePos = event => new Vector2(
  (event.clientX / window.innerWidth) * 2 - 1,
  -(event.clientY / window.innerHeight) * 2 + 1
)

const cycleAction = (step, current) => {
  const actions = ['select', 'delete', 'duplicate', 'slice x', 'slice y', 'slice z', 'subdivide', 'stretch']
  const currentIndex = actions.indexOf(current)
  const next = mod(currentIndex + step, actions.length)
  return { action: actions[next] }
}

const setPalletteColors = (inspector, toolbar, selected, activeBtn) => {

  selected.material
    .map(getMaterialRGB)
    .forEach(({ r, g, b }, i) => {
      // Set BG color
      inspector.colors[i].style.backgroundColor = `rgb(${r}, ${g}, ${b})`

      if (i === activeBtn) {
        // Join button to pallette
        inspector.colors[i].classList.add('isActive')
        // Set pallette BG and input value
        toolbar.pallette.container.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
        const hexValue = inspector.colors[i].style.backgroundColor.match(/\d+/g)
          ?.map(val => val === '0' ? '00' : Number(val).toString(16))
          .join('')
        
        toolbar.pallette.input.value = hexValue

      } else {
        inspector.colors[i].classList.remove('isActive')
      }
    })
}

const toggleInspector = (inspector, toolbar, isVisible) => {
  inspector.container.style.display = isVisible ? 'block' : 'none'
  toolbar.container.style.display = isVisible ? 'block' : 'none'
}

export default {
  keyRegister,
  dragMouse,
  getMousePos,
  cycleAction,
  setPalletteColors,
  toggleInspector
}