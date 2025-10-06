import { useMemo } from "react";
import {
  RawShaderMaterial,
  ShaderMaterial,
  ShaderMaterialParameters,
} from "three";

type IUniform = {
  value: unknown;
};

type ShaderProgram<
  U extends Record<string, IUniform> = Record<string, IUniform>,
> = ShaderMaterial & {
  uniforms: U;
  setDefine: (name: string, value: string) => void;
};

export function useShader<
  U extends Record<string, IUniform> = Record<string, IUniform>,
>(
  parameters: Omit<ShaderMaterialParameters, "uniforms">,
  uniforms: U = {} as U
): ShaderProgram<U> {
  const program = useMemo(() => {
    const p = new ShaderMaterial({
      ...parameters,
      uniforms,
    }) as ShaderProgram<U>;

    p.setDefine = (name, value) => {
      p.defines[name] = value;
      p.needsUpdate = true;
    };

    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters.vertexShader, parameters.fragmentShader]);

  return program;
}

type RawShaderProgram<
  U extends Record<string, IUniform> = Record<string, IUniform>,
> = RawShaderMaterial & {
  uniforms: U;
  setDefine: (name: string, value: string) => void;
};

export function useRawShader<
  U extends Record<string, IUniform> = Record<string, IUniform>,
>(
  parameters: Omit<ShaderMaterialParameters, "uniforms">,
  uniforms: U = {} as U
): RawShaderProgram<U> {
  const program = useMemo(() => {
    const p = new RawShaderMaterial({
      ...parameters,
      uniforms,
    }) as RawShaderProgram<U>;

    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters.vertexShader, parameters.fragmentShader]);

  return program;
}
