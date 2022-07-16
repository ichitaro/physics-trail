import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import assets from '../utils/assets'
import Experience from '../utils/Experience'
import Block from './Block'
import InstancedTrail from './InstancedTrail'
import ObjectPicker from './ObjectPicker'
import Magnet from './Magnet'

const keyColor = '#B5AC01'

export function addPlayground() {
  const webgl = new Experience()
  const { scene } = webgl
  const world = webgl.world!

  const blockScale = 0.2
  const blockSize = { radius: 1 * blockScale, height: 4 * blockScale }
  const pyramid = createPyramid(blockSize.radius, blockSize.height)
  const blockMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(keyColor).convertSRGBToLinear(),
    transparent: true,
    opacity: 0.7,
    depthTest: false,
  })
  const trail = new InstancedTrail({
    geometry: pyramid.geometry,
    material: new THREE.MeshStandardMaterial({
      roughness: 0.1,
      metalness: 0,
      flatShading: true,
    }),
    numSteps: 240,
  })
  scene.add(trail)
  const blocks = Array.from({ length: 12 }).map(() => {
    const block = new Block({
      shape: pyramid.shape,
      geometry: pyramid.geometry,
      material: blockMaterial,
    })
    scene.add(block)
    world.addBody(block.body)
    trail.track(block.body)
    return block
  })
  resetBlocks()
  trail.buildMesh()

  const picker = new ObjectPicker({
    objects: blocks,
    markerColor: keyColor,
  })

  const magnet = new Magnet()
  const bodies = blocks.map((block) => block.body)
  webgl.events.tick.on(() => {
    if (webgl.pointer.isDragging && !picker.isDragging) {
      magnet.applyForce(bodies)
    }
  })

  function resetBlocks() {
    const gap = -0.27
    const spread = 1
    const dummy = new THREE.Object3D()

    for (const block of blocks) {
      const body = block.body
      resetBody(body)
      // body.sleep()

      dummy.position.set(
        (Math.random() - 0.5) * spread,
        gap + 0.5 * blockSize.height,
        (Math.random() - 0.5) * spread
      )
      dummy.rotation.set(0, Math.PI * Math.random(), 0)
      body.position.copy(dummy.position as any)
      body.quaternion.copy(dummy.quaternion as any)
    }

    trail.resetCounter()
  }
}

function resetBody(body: CANNON.Body) {
  // Position
  body.position.setZero()
  body.previousPosition.setZero()
  body.interpolatedPosition.setZero()
  body.initPosition.setZero()

  // orientation
  body.quaternion.set(0, 0, 0, 1)
  body.initQuaternion.set(0, 0, 0, 1)
  body.previousQuaternion.set(0, 0, 0, 1)
  body.interpolatedQuaternion.set(0, 0, 0, 1)

  // Velocity
  body.velocity.setZero()
  body.initVelocity.setZero()
  body.angularVelocity.setZero()
  body.initAngularVelocity.setZero()

  // Force
  body.force.setZero()
  body.torque.setZero()

  // Sleep state reset
  body.sleepState = 0
  body.timeLastSleepy = 0
  //@ts-ignore
  body._wakeUpAfterNarrowphase = false
}

function createPyramid(radius: number = 1, height: number = 1.5) {
  const geometry = new THREE.ConeGeometry(radius, height, 4, 1)
  geometry.rotateY(Math.PI / 4)
  geometry.computeVertexNormals()

  const length = radius * Math.sqrt(2)
  const vertices = [
    new CANNON.Vec3(-length / 2, -height / 2, -length / 2),
    new CANNON.Vec3(+length / 2, -height / 2, -length / 2),
    new CANNON.Vec3(0, +height / 2, 0),
    new CANNON.Vec3(-length / 2, -height / 2, +length / 2),
    new CANNON.Vec3(+length / 2, -height / 2, +length / 2),
  ]
  const shape = new CANNON.ConvexPolyhedron({
    vertices,
    faces: [
      [0, 3, 2], // -x
      [0, 1, 4, 3], // -y
      [0, 2, 1], // -z
      [1, 4, 2], // +x
      [3, 4, 2], // +z
    ],
  })

  return {
    geometry,
    shape,
  }
}
