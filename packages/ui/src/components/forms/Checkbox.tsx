import React from "react";
import {
  useUiDispatch,
  useUiState,
  useUiSnapshot,
} from "../../renderer/StateProvider.js";
import { Checkbox as BaseCheckbox, Label } from "../../react/index.js";
import type { CheckboxProps, Action } from "../../schema/types.js";
import { executeAction } from "../../actions/executor.js";
import { useRendererClient } from "../../renderer/RuntimeContext.js";

interface CheckboxComponentProps extends CheckboxProps {
  actions?: Record<string, Action>;
}

export function Checkbox({ label, stateKey, className, actions }: CheckboxComponentProps) {
  const checked = !!useUiState(stateKey);
  const dispatch = useUiDispatch();
  const state = useUiSnapshot();
  const client = useRendererClient();

  const handleChange = (nextChecked: boolean | "indeterminate") => {
    const value = nextChecked === true;
    dispatch({ type: "SET_STATE", key: stateKey, value });

    const onChange = actions?.onChange;
    if (onChange) {
      executeAction(onChange, state.values, client, dispatch, value);
    }
  };

  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <BaseCheckbox checked={checked} onCheckedChange={handleChange} />
      {label ? <Label>{label}</Label> : null}
    </div>
  );
}

export default Checkbox;
