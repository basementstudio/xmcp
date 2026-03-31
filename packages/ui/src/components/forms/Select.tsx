import React from "react";
import {
  useUiState,
  useUiDispatch,
  useUiSnapshot,
} from "../../renderer/StateProvider.js";
import type { SelectProps, Action } from "../../schema/types.js";
import {
  Label,
  Select as BaseSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../react/index.js";
import { executeAction } from "../../actions/executor.js";
import { useRendererClient } from "../../renderer/RuntimeContext.js";

interface SelectComponentProps extends SelectProps {
  actions?: Record<string, Action>;
}

export function Select({ label, stateKey, options, placeholder, className, actions }: SelectComponentProps) {
  const value = useUiState(stateKey);
  const dispatch = useUiDispatch();
  const state = useUiSnapshot();
  const client = useRendererClient();

  const handleChange = (nextValue: string) => {
    dispatch({ type: "SET_STATE", key: stateKey, value: nextValue });

    const onChange = actions?.onChange;
    if (onChange) {
      executeAction(onChange, state.values, client, dispatch, nextValue);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <Label>{label}</Label> : null}
      <BaseSelect value={value != null ? String(value) : undefined} onValueChange={handleChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder ?? "Select an option"} />
        </SelectTrigger>
        <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        </SelectContent>
      </BaseSelect>
    </div>
  );
}

export default Select;
