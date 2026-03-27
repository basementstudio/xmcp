import React from "react";
import {
  useUiDispatch,
  useUiState,
} from "../../renderer/StateProvider.js";
import { Label, Switch as BaseSwitch } from "../../react/index.js";
import type { SwitchProps } from "../../schema/types.js";

export function Switch({ label, stateKey, className }: SwitchProps) {
  const checked = !!useUiState(stateKey);
  const dispatch = useUiDispatch();

  return (
    <div className={["flex items-center justify-between gap-3", className].filter(Boolean).join(" ")}>
      {label ? <Label>{label}</Label> : null}
      <BaseSwitch
        checked={checked}
        onCheckedChange={(nextChecked: boolean) =>
          dispatch({ type: "SET_STATE", key: stateKey, value: nextChecked })
        }
      />
    </div>
  );
}

export default Switch;
