import React, { useRef, useCallback } from "react";
import {
  useUiDispatch,
  useUiState,
  useUiSnapshot,
} from "../../renderer/StateProvider.js";
import { Label, Textarea as BaseTextarea } from "../../react/index.js";
import type { TextareaProps, Action } from "../../schema/types.js";
import { executeAction } from "../../actions/executor.js";
import { useRendererClient } from "../../renderer/RuntimeContext.js";

interface TextareaComponentProps extends TextareaProps {
  actions?: Record<string, Action>;
}

export function Textarea({
  label,
  placeholder,
  stateKey,
  rows = 4,
  className,
  actions,
}: TextareaComponentProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();
  const state = useUiSnapshot();
  const client = useRendererClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    dispatch({ type: "SET_STATE", key: stateKey, value: nextValue });

    const onChange = actions?.onChange;
    if (onChange) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        executeAction(onChange, state.values, client, dispatch, nextValue);
      }, 300);
    }
  }, [actions, stateKey, state.values, client, dispatch]);

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <BaseTextarea
        rows={rows}
        value={value != null ? String(value) : ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}

export default Textarea;
