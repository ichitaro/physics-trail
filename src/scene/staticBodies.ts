import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

export function addStaticBodies() {
  const webgl = new Experience()

  /**
   * Floor
   */
  const floor = (() => {
    const plane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(100, 100, 1, 1),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#212121').convertSRGBToLinear(),
        roughness: 1,
        metalness: 0,
      })
    )
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    return plane
  })()
  webgl.scene.add(floor)

  const floorShape = new CANNON.Plane()
  const floorBody = new CANNON.Body({ mass: 0 })
  floorBody.addShape(floorShape)
  floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
  webgl.world!.addBody(floorBody)

  /**
   * Container box
   */
  createContainer(webgl)
}

function createContainer(webgl: Experience) {
  // Plane +y
  const planeShapeYmax = new CANNON.Plane()
  const planeYmax = new CANNON.Body({ mass: 0 })
  planeYmax.addShape(planeShapeYmax)
  planeYmax.quaternion.setFromEuler(+Math.PI / 2, 0, 0)
  planeYmax.position.set(0, 10, 0)
  webgl.world!.addBody(planeYmax)

  // Plane -x
  const planeShapeXmin = new CANNON.Plane()
  const planeXmin = new CANNON.Body({ mass: 0 })
  planeXmin.addShape(planeShapeXmin)
  planeXmin.quaternion.setFromEuler(0, Math.PI / 2, 0)
  planeXmin.position.set(-3, 0, 0)
  webgl.world!.addBody(planeXmin)

  // Plane +x
  const planeShapeXmax = new CANNON.Plane()
  const planeXmax = new CANNON.Body({ mass: 0 })
  planeXmax.addShape(planeShapeXmax)
  planeXmax.quaternion.setFromEuler(0, -Math.PI / 2, 0)
  planeXmax.position.set(3, 0, 0)
  webgl.world!.addBody(planeXmax)

  // Plane -z
  const planeShapeZmin = new CANNON.Plane()
  const planeZmin = new CANNON.Body({ mass: 0 })
  planeZmin.addShape(planeShapeZmin)
  planeZmin.quaternion.setFromEuler(0, 0, 0)
  planeZmin.position.set(0, 0, -3)
  webgl.world!.addBody(planeZmin)

  // Plane +z
  const planeShapeZmax = new CANNON.Plane()
  const planeZmax = new CANNON.Body({ mass: 0 })
  planeZmax.addShape(planeShapeZmax)
  planeZmax.quaternion.setFromEuler(0, Math.PI, 0)
  planeZmax.position.set(0, 0, 3)
  webgl.world!.addBody(planeZmax)

  // createContainerMarkers(webgl)
}

function createContainerMarkers(webgl: Experience) {
  let helper: THREE.AxesHelper

  // Axes Helper -y
  helper = createAxesHelper()
  helper.scale.set(1, 1, 1)
  helper.position.set(-3, 0.05, -3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(1, 1, -1)
  helper.position.set(-3, 0.05, +3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(-1, 1, 1)
  helper.position.set(+3, 0.05, -3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(-1, 1, -1)
  helper.position.set(+3, 0.05, +3)
  webgl.scene.add(helper)

  // Axes helper +y
  helper = createAxesHelper()
  helper.scale.set(1, -1, 1)
  helper.position.set(-3, 10, -3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(1, -1, -1)
  helper.position.set(-3, 10, +3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(-1, -1, 1)
  helper.position.set(+3, 10, -3)
  webgl.scene.add(helper)

  helper = createAxesHelper()
  helper.scale.set(-1, -1, -1)
  helper.position.set(+3, 10, +3)
  webgl.scene.add(helper)
}

const axesColor = new THREE.Color('#888').convertSRGBToLinear()

function createAxesHelper() {
  const helper = new THREE.AxesHelper(0.25)
  helper.setColors(axesColor, axesColor, axesColor)
  return helper
}
