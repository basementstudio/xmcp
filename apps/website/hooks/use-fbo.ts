import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { RenderTargetOptions } from "three"


export function useFBO<TTexture extends THREE.Texture | THREE.Texture[] = THREE.Texture>(
  width: number,
  height: number,
  options: RenderTargetOptions
): THREE.WebGLRenderTarget<TTexture> {
  const target = useMemo(() => {
    const fbo = new THREE.WebGLRenderTarget<TTexture>(width, height, options)
    return fbo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    target.setSize(width, height)
  }, [width, height, target])

  useEffect(() => {
    // dispose on unmount
    return () => {
      target.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return target
}
