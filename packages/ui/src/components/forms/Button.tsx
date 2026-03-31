import React from "react";
import {
  useUiState,
  useUiLoading,
  useUiSnapshot,
  useUiDispatch,
} from "../../renderer/StateProvider.js";
import type { ButtonProps, Action } from "../../schema/types.js";
import { executeAction } from "../../actions/executor.js";
import { Button as BaseButton } from "../../react/index.js";
import {
  useRendererClient,
} from "../../renderer/RuntimeContext.js";

// ── Spinner ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────

interface ButtonComponentProps extends ButtonProps {
  actions?: Record<string, Action>;
}

export function Button({
  label,
  variant = "primary",
  disabled,
  loading,
  className,
  actions,
}: ButtonComponentProps) {
  const state = useUiSnapshot();
  const dispatch = useUiDispatch();
  const client = useRendererClient();

  // Determine loading key: explicit prop or derive from action's resultKey
  const onClickAction = actions?.onClick;
  const loadingKey =
    loading ??
    (onClickAction && onClickAction.type === "call-tool"
      ? onClickAction.resultKey
      : undefined);

  const isLoading = useUiLoading(loadingKey ?? "");

  // Resolve disabled: boolean true, or a state key string
  const disabledStateValue = useUiState(
    typeof disabled === "string" ? disabled : "",
  );
  const isDisabled =
    disabled === true || (typeof disabled === "string" && !!disabledStateValue);

  const handleClick = async () => {
    if (!onClickAction) return;
    await executeAction(onClickAction, state.values, client, dispatch);
  };

  const resolvedVariant =
    variant === "danger"
      ? "destructive"
      : variant === "secondary"
        ? "secondary"
        : "default";

  return (
    <BaseButton
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      variant={resolvedVariant}
      className={className}
    >
      {isLoading && <Spinner />}
      {label}
    </BaseButton>
  );
}

export default Button;
