import { saveGlState } from "../../../utils/save-gl-state";
import { createPortal, RenderCallback, useFrame } from "@react-three/fiber";
import { PropsWithChildren, RefObject, useMemo } from "react";
import {
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderTarget,
} from "three";

export interface RenderTextureProps {
  renderTarget: WebGLRenderTarget | RefObject<WebGLRenderTarget> | null;
  beforeRender?: RenderCallback;
  afterRender?: RenderCallback;
  autoRender?: boolean;
  camera?: OrthographicCamera | PerspectiveCamera;
  priority?: number;
}

function RenderTextureWrapper({
  renderTarget,
  beforeRender,
  afterRender,
  autoRender = true,
  camera,
  priority,
  children,
}: PropsWithChildren<RenderTextureProps>) {
  useFrame((state, delta) => {
    const restore = saveGlState(state);
    if (beforeRender) {
      beforeRender(state, delta);
    }

    if (autoRender) {
      if (renderTarget && "current" in renderTarget) {
        state.gl.setRenderTarget(renderTarget.current);
      } else {
        state.gl.setRenderTarget(renderTarget);
      }

      state.gl.render(state.scene, camera ?? state.camera);
    }

    if (afterRender) {
      afterRender(state, delta);
    }
    restore();
  }, priority);

  return children;
}

export function RenderTexture(props: PropsWithChildren<RenderTextureProps>) {
  const containerScene = useMemo(() => new Scene(), []);

  return (
    <>
      {createPortal(
        <RenderTextureWrapper {...props}>
          {props.children}
        </RenderTextureWrapper>,
        containerScene
      )}
    </>
  );
}
