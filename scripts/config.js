import * as THREE from '../node_modules/three/build/three.module.js'

const setup = () => {
  const sceneShell = new THREE.Scene()
  const scene = new THREE.Scene()
  sceneShell.add(scene)
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.z = 10
  
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  
  const raycaster = new THREE.Raycaster()

  return { sceneShell, scene, camera, renderer, raycaster }
}

export default { setup }