import * as THREE from './three.module.js'

const setup = () => {
  const sceneShell = new THREE.Scene()
  const scene = new THREE.Scene()
  sceneShell.add(scene)

  // const camera = new THREE.OrthographicCamera(-20, 20, 20, -20, -0.1, 1000)

  const camera = new THREE.PerspectiveCamera(
    30,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 70

  scene.rotation.y = Math.PI / 4
  sceneShell.rotation.x = Math.PI / 6
 
  
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  const raycaster = new THREE.Raycaster()

  return { sceneShell, scene, camera, renderer, raycaster }
}

export default { setup }