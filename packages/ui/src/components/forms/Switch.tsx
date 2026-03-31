import React from "react";
import {
  useUiDispatch,
  useUiState,
  useUiSnapshot,
} from "../../renderer/StateProvider.js";
import { Label, Switch as BaseSwitch } from "../../react/index.js";
import type { SwitchProps, Action } from "../../schema/types.js";
import { executeAction } from "../../actions/executor.js";
import { useRendererClient } from "../../renderer/RuntimeContext.js";

interface SwitchComponentProps extends SwitchProps {
  actions?: Record<string, Action>;
}

export function Switch({ label, stateKey, className, actions }: SwitchComponentProps) {
  const checked = !!useUiState(stateKey);
  const dispatch = useUiDispatch();
  const state = useUiSnapshot();
  const client = useRendererClient();

  const handleChange = (nextChecked: boolean) => {
    dispatch({ type: "SET_STATE", key: stateKey, value: nextChecked });

    const onChange = actions?.onChange;
    if (onChange) {
      executeAction(onChange, state.values, client, dispatch, nextChecked);
    }
  };

  return (
    <div className={["flex items-center justify-between gap-3", className].filter(Boolean).join(" ")}>
      {label ? <Label>{label}</Label> : null}
      <BaseSwitch checked={checked} onCheckedChange={handleChange} />
    </div>
  );
}

export default Switch;
