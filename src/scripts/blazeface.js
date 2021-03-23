import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import * as tf from '@tensorflow/tfjs-core'
import '@tensorflow/tfjs-backend-webgl'

const NUM_KEYPOINTS = 468
const NUM_IRIS_KEYPOINTS = 5

let model, videoWidth, videoHeight, video

const VIDEO_SIZE = 500

const state = {
  backend: 'webgl',
  maxFaces: 1,
  triangulateMesh: true,
  predictIrises: true
}

async function setupCamera() {
  video = document.getElementById('video')

  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: VIDEO_SIZE,
      height: VIDEO_SIZE
    }
  })
  video.srcObject = stream

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      resolve(video)
    }
  })
}

export async function getFacePosition() {
  const predictions = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false,
    predictIrises: state.predictIrises
  })

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh
    const leftEye = keypoints[NUM_KEYPOINTS]
    const rightEye = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS]

    const centerX = (leftEye[0] + rightEye[0]) / 2
    const centerY = (leftEye[1] + rightEye[1]) / 2

    return { x: centerX, y: centerY }
  }
}

export async function initFaceTracking() {
  await tf.setBackend(state.backend)

  await setupCamera()
  video.play()
  videoWidth = video.videoWidth
  videoHeight = video.videoHeight
  video.width = videoWidth
  video.height = videoHeight

  model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: state.maxFaces })
  
  return true
}