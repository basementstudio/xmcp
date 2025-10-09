import { createPortal, RenderCallback, useFrame } from "@react-three/fiber";
import { RefObject, useMemo } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from "three";

export const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 2);

quadCamera.position.set(0, 0, 1);

export const quadGeometry = new BufferGeometry();
quadGeometry.setAttribute(
  "position",
  new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3)
);
quadGeometry.setAttribute(
  "uv",
  new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2)
);

export interface QuadShaderProps {
  program: ShaderMaterial;
  renderTarget: WebGLRenderTarget | RefObject<WebGLRenderTarget>;
  beforeRender?: RenderCallback;
  afterRender?: RenderCallback;
  autoRender?: boolean;
  priority?: number;
}

export function QuadShader({
  program,
  renderTarget,
  beforeRender,
  afterRender,
  autoRender = true,
  priority = 0,
}: QuadShaderProps) {
  const containerScene = useMemo(() => new Scene(), []);

  useFrame((state, delta) => {
    if (beforeRender) {
      beforeRender(state, delta);
    }

    if (autoRender) {
      if ("current" in renderTarget) {
        state.gl.setRenderTarget(renderTarget.current);
      } else {
        state.gl.setRenderTarget(renderTarget);
      }

      state.gl.render(containerScene, quadCamera);
      state.gl.setRenderTarget(null);
    }

    if (afterRender) {
      afterRender(state, delta);
    }
  }, priority);

  return (
    <>
      {createPortal(
        <mesh geometry={quadGeometry}>
          <primitive object={program} />
        </mesh>,
        containerScene
      )}
    </>
  );
}

export function QuadMesh({ children }: { children: React.ReactNode }) {
  return <mesh geometry={quadGeometry}>{children}</mesh>;
}
