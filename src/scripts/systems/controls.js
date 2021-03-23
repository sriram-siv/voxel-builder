/* eslint-disable key-spacing */
import { Vector3 } from 'three'

import ui from '../ui/dom.js'

function createControls(scene, camera, options, container) {

  const controls = { ...options, timer: {} }

  window.addEventListener('mousedown', () => {

    ui.dragMouse(event => {

      const voxels = scene.getObjectByName('voxels')
      const wireframes = scene.getObjectByName('wireframes')
      
      voxels.rotateOnAxis(voxels.up, event.movementX / 100)
      wireframes.rotateOnAxis(voxels.up, event.movementX / 100)
  
      if (Math.abs(voxels.axle + (event.movementY / 100)) < Math.PI / 2) {
        voxels.rotateOnWorldAxis(new Vector3(1, 0, 0), event.movementY / 100)
        wireframes.rotateOnWorldAxis(new Vector3(1, 0, 0), event.movementY / 100)
        voxels.axle += event.movementY / 100
      }
  
      controls.onDrag?.()

    })
  })

  container.addEventListener('click', controls.onClick)

  window.addEventListener('keydown', event => trackCamera(event.key, camera, controls))

  window.addEventListener('mousewheel', e => {
    camera.position.z += e.deltaY / 10
    controls.update()
  })

  window.addEventListener('mousemove', e => controls.onMouseMove(e))

  window.addEventListener('keydown', event => controls.keys?.[event.key]?.())

  return controls
}

function trackCamera(key, camera, controls) {

  const { timer } = controls
  const speed = 0.1

  const options = {
    ArrowLeft: ['x', -1],
    ArrowRight: ['x', 1 ],
    ArrowDown: ['y', -1],
    ArrowUp: ['y', 1]
  }

  if (!options[key]) return
  const [ axis, direction ] = options[key]

  const cleanUp = event => {
    if (event.key === key || event.type === 'blur') {
      clearInterval(timer[axis])
      timer[axis] = null
      window.removeEventListener('keyup', cleanUp)
      window.removeEventListener('blur', cleanUp)

      dampenMovement().forEach(([distance, delay]) => {
        setTimeout(() => {
          camera.position[axis] += distance * direction
          controls.update()
        }, delay)
      })
    }
  }

  if (!timer[axis]) {
    timer[axis] = setInterval(
      () => {
        camera.position[axis] += speed * direction
        controls.update()
      },
      16
    )

    window.addEventListener('keyup', cleanUp)
    window.addEventListener('blur', cleanUp)
  }
  
}

function dampenMovement() {

  return Array.from({ length: 10 }, (_, i) => {

    const easeout = (time) => 2 * time * (1 - time) + 0.5

    const delay = (i + 1) * 16

    const distance = 0.1 * easeout((0.5 / 15) * (i + 1))

    return [ distance, delay ]
  })

}

export { createControls }