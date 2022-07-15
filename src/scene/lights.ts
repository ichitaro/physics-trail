import * as THREE from 'three'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

const envMapKey = assets.queue('textures/environmentMaps/3', (url) => {
  return assets.loaders.cubeTextureLoader
    .loadAsync([
      'textures/environmentMaps/3/px.jpg',
      'textures/environmentMaps/3/nx.jpg',
      'textures/environmentMaps/3/py.jpg',
      'textures/environmentMaps/3/ny.jpg',
      'textures/environmentMaps/3/pz.jpg',
      'textures/environmentMaps/3/nz.jpg',
    ] as any)
    .then((texture) => {
      texture.encoding = THREE.sRGBEncoding
      return texture
    })
})

export function addLights() {
  const webgl = new Experience()

  const ambientLight = new THREE.AmbientLight()
  ambientLight.intensity = 0.05
  webgl.scene.add(ambientLight)

  const spotLight = new THREE.SpotLight()
  spotLight.intensity = 1
  spotLight.angle = 0.25
  spotLight.penumbra = 1
  spotLight.castShadow = true
  spotLight.shadow.mapSize.set(1024, 1024)
  spotLight.shadow.normalBias = 0.03
  spotLight.shadow.camera.fov = 35
  spotLight.shadow.camera.near = 20
  spotLight.shadow.camera.far = 40
  spotLight.position.set(10, 30, 10)
  webgl.scene.add(spotLight)
  // webgl.scene.add(new THREE.CameraHelper(spotLight.shadow.camera))

  const directionalLight = new THREE.DirectionalLight()
  directionalLight.intensity = 0.2
  directionalLight.position.set(-10, -30, -10)
  webgl.scene.add(directionalLight)

  const environmentMap = assets.get<THREE.CubeTexture>(envMapKey)
  environmentMap.encoding = THREE.sRGBEncoding
  webgl.scene.environment = environmentMap

  webgl.scene.fog = new THREE.Fog(0x000000, 30, 40)
}
