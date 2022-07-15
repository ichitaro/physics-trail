import * as THREE from 'three'
import {
  EffectPass,
  NormalPass,
  SSAOEffect,
  DepthDownsamplingPass,
  BloomEffect,
} from 'postprocessing'
import assets from '../utils/assets'
import Experience from '../utils/Experience'

/**
 * @see {@link https://github.com/pmndrs/postprocessing/blob/main/demo/src/demos/SSAODemo.js}
 */
export function addEffects() {
  const webgl = new Experience()
  const { scene, camera, renderer } = webgl
  const composer = webgl.composer!

  const normalPass = new NormalPass(scene, camera)

  const depthDownsamplingPass = new DepthDownsamplingPass({
    normalBuffer: normalPass.texture,
    resolutionScale: 0.5,
  })

  const normalDepthBuffer = renderer.capabilities.isWebGL2
    ? depthDownsamplingPass.texture
    : undefined

  const ssaoEffect = new SSAOEffect(camera, normalPass.texture, {
    // blendFunction: BlendFunction.NORMAL,
    distanceScaling: true,
    depthAwareUpsampling: true,
    normalDepthBuffer,
    samples: 20,
    rings: 6,
    distanceThreshold: 0.5,
    distanceFalloff: 0.5,
    rangeThreshold: 0.2,
    rangeFalloff: 0.01,
    luminanceInfluence: 0,
    minRadiusScale: 0.1,
    radius: 0.1,
    intensity: 20,
    bias: 0.2,
    fade: 0.9,
    color: null,
    resolutionScale: 0.5,
  } as any)

  const bloomEffect = new BloomEffect({
    intensity: 0.35,
    luminanceThreshold: 0.5,
  })

  const effectPass = new EffectPass(camera, ssaoEffect, bloomEffect)

  composer.addPass(normalPass)
  if (renderer.capabilities.isWebGL2) {
    composer.addPass(depthDownsamplingPass)
  } else {
    console.log(
      'WebGL 2 not supported, falling back to naive depth downsampling'
    )
  }

  composer.addPass(effectPass)
}
