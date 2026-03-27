import React from "react";
import {
  useUiDispatch,
  useUiState,
} from "../../renderer/StateProvider.js";
import { Checkbox as BaseCheckbox, Label } from "../../react/index.js";
import type { CheckboxProps } from "../../schema/types.js";

export function Checkbox({ label, stateKey, className }: CheckboxProps) {
  const checked = !!useUiState(stateKey);
  const dispatch = useUiDispatch();

  return (
    <div className={["flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <BaseCheckbox
        checked={checked}
        onCheckedChange={(nextChecked: boolean | "indeterminate") =>
          dispatch({
            type: "SET_STATE",
            key: stateKey,
            value: nextChecked === true,
          })
        }
      />
      {label ? <Label>{label}</Label> : null}
    </div>
  );
}

export default Checkbox;
