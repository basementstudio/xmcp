import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { RenderTargetOptions } from "three";

class DoubleFBO<
  TTexture extends THREE.Texture | THREE.Texture[] = THREE.Texture,
> {
  public read: THREE.WebGLRenderTarget<TTexture>;
  public write: THREE.WebGLRenderTarget<TTexture>;

  constructor(width: number, height: number, options: RenderTargetOptions) {
    this.read = new THREE.WebGLRenderTarget<TTexture>(width, height, options);
    this.write = new THREE.WebGLRenderTarget<TTexture>(width, height, options);
  }

  get texture(): THREE.Texture {
    return this.read.texture as THREE.Texture;
  }

  get textures(): TTexture {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.read.textures as any as TTexture;
  }

  swap() {
    const temp = this.read;
    this.read = this.write;
    this.write = temp;
  }

  dispose() {
    this.read.dispose();
    this.write.dispose();
  }

  setSize(width: number, height: number) {
    this.read.setSize(width, height);
    this.write.setSize(width, height);
  }
}

export function useDoubleFBO<
  TTexture extends THREE.Texture | THREE.Texture[] = THREE.Texture,
>(
  width: number,
  height: number,
  options: RenderTargetOptions
): DoubleFBO<TTexture> {
  const fbo = useMemo(
    () => new DoubleFBO<TTexture>(width, height, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fbo.setSize(width, height);
  }, [width, height, fbo]);

  return fbo;
}
