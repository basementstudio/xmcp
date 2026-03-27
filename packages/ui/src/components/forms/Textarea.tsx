import React from "react";
import {
  useUiDispatch,
  useUiState,
} from "../../renderer/StateProvider.js";
import { Label, Textarea as BaseTextarea } from "../../react/index.js";
import type { TextareaProps } from "../../schema/types.js";

export function Textarea({
  label,
  placeholder,
  stateKey,
  rows = 4,
  className,
}: TextareaProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <BaseTextarea
        rows={rows}
        value={value != null ? String(value) : ""}
        onChange={(event) =>
          dispatch({ type: "SET_STATE", key: stateKey, value: event.target.value })
        }
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

export default Textarea;
