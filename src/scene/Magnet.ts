import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import Experience from '../utils/Experience'

type Options = {
  radius?: number
}

export default class Magnet {
  webgl = new Experience()
  mouse3D = new THREE.Vector3()
  body: CANNON.Body
  ray = new THREE.Ray()
  force = new THREE.Vector3()

  constructor({ radius = 1 }: Options = {}) {
    this.body = new CANNON.Body({ type: CANNON.Body.KINEMATIC })
    this.body.addShape(new CANNON.Sphere(radius))
    // this.webgl.world!.addBody(this.body)
  }

  applyForce(bodies: CANNON.Body[]) {
    this.updateMouse3D()
    this.body.position.copy(this.mouse3D as any)

    const { mouse3D, force } = this
    for (const body of bodies) {
      force.copy(body.position as any)
      force.sub(mouse3D)
      // force.normalize()
      force.multiplyScalar(-5)
      body.applyForce(force as any)
    }
  }

  updateMouse3D() {
    const {
      ray,
      webgl: { camera, pointer },
      mouse3D,
    } = this
    ray.origin.copy(camera.position)
    ray.direction
      .set(pointer.x, pointer.y, 0.5)
      .unproject(camera)
      .sub(ray.origin)
      .normalize()
    const distance =
      ray.origin.length() /
      Math.cos(Math.PI - ray.direction.angleTo(ray.origin))
    mouse3D.copy(ray.direction)
    mouse3D.multiplyScalar(distance)
    mouse3D.add(ray.origin)
  }
}
