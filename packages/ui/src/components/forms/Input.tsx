import React from "react";
import {
  useUiState,
  useUiDispatch,
} from "../../renderer/StateProvider.js";
import type { InputProps } from "../../schema/types.js";
import { Input as BaseInput, Label } from "../../react/index.js";

export function Input({
  label,
  placeholder,
  stateKey,
  type = "text",
  className,
}: InputProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = type === "number" ? Number(raw) : raw;
    dispatch({ type: "SET_STATE", key: stateKey, value: parsed });
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
