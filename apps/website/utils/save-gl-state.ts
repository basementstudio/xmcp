import { RootState } from "@react-three/fiber";
import * as THREE from "three";

export function saveGlState(state: RootState) {
  const prevTarget = state.gl.getRenderTarget();
  const prevClearColor = new THREE.Color();
  state.gl.getClearColor(prevClearColor);
  const prevClearAlpha = state.gl.getClearAlpha();
  const prevViewport = new THREE.Vector4();
  state.gl.getViewport(prevViewport);
  const prevAutoClear = state.gl.autoClear;

  const restore = () => {
    state.gl.setRenderTarget(prevTarget);
    state.gl.setClearColor(prevClearColor, prevClearAlpha);
    state.gl.setViewport(prevViewport);
    state.gl.autoClear = prevAutoClear;
  };

  return restore;
}
