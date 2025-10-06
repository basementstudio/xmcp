import { useMemo } from "react";
import * as THREE from "three";

export function useUniforms<T extends Record<string, THREE.IUniform>>(
  uniforms: T
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo<T>(() => uniforms, []);
}
