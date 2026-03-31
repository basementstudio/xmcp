import React from "react";
import {
  useUiState,
  useUiDispatch,
  useUiSnapshot,
} from "../../renderer/StateProvider.js";
import type { InputProps, Action } from "../../schema/types.js";
import { Input as BaseInput, Label } from "../../react/index.js";
import { executeAction } from "../../actions/executor.js";
import { useRendererClient } from "../../renderer/RuntimeContext.js";

interface InputComponentProps extends InputProps {
  actions?: Record<string, Action>;
}

export function Input({
  label,
  placeholder,
  stateKey,
  type = "text",
  className,
  actions,
}: InputComponentProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();
  const state = useUiSnapshot();
  const client = useRendererClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = type === "number" ? Number(raw) : raw;
    dispatch({ type: "SET_STATE", key: stateKey, value: parsed });

    const onChange = actions?.onChange;
    if (onChange) {
      executeAction(onChange, state.values, client, dispatch, parsed);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <BaseInput
        type={type}
        value={value != null ? String(value) : ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

export default Input;
