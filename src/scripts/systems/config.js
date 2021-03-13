import { WebGLRenderer, Raycaster, Scene, Group, Vector3 } from 'three'

import { createCamera } from './camera.js'
import { createControls } from './controls.js'

const setup = (container, controlConfig) => {

  const scene = new Scene()
  // scene.background = new Color('lightblue')

  const voxels = new Group()
  voxels.name = 'voxels'
  voxels.axle = Math.PI / 6
  const wireframes = new Group()
  wireframes.name = 'wireframes'

  scene.add(voxels, wireframes)


  voxels.rotateOnAxis(voxels.up, Math.PI / 4)
  wireframes.rotateOnAxis(wireframes.up, Math.PI / 4)

  voxels.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI / 6)
  wireframes.rotateOnWorldAxis(new Vector3(1, 0, 0), Math.PI / 6)

 
  const renderer = new WebGLRenderer({ antialias: true })
  container.appendChild(renderer.domElement)
  
  const raycaster = new Raycaster()

  const camera = createCamera(container, renderer, null)

  const controls = createControls(scene, camera, controlConfig)


  return { scene, camera, renderer, raycaster, controls }
}

export { setup }