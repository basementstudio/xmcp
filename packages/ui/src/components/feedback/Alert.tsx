import React from "react";
import {
  useUiState,
  useUiDispatch,
} from "../../renderer/StateProvider.js";
import type { AlertProps } from "../../schema/types.js";
import {
  Alert as BaseAlert,
  AlertDescription,
  AlertTitle,
  Button,
} from "../../react/index.js";

const titles: Record<string, string> = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error",
};

export function Alert({
  messageKey,
  variant = "info",
  dismissible,
  className,
}: AlertProps) {
  const message = useUiState(messageKey);
  const dispatch = useUiDispatch();

  if (!message) return null;

  const handleDismiss = () => {
    dispatch({ type: "SET_STATE", key: messageKey, value: null });
  };

  return (
    <BaseAlert variant={variant} className={className}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <AlertTitle>{titles[variant] ?? titles.info}</AlertTitle>
          <AlertDescription>{String(message)}</AlertDescription>
        </div>
        {dismissible && (
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="icon"
            aria-label="Dismiss"
          >
            <span aria-hidden>&times;</span>
          </Button>
        )}
      </div>
    </BaseAlert>
  );
}

export default Alert;
