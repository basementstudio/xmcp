import React, {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { getByPath, setByPath } from "../state/path.js";

// ── State shape ──────────────────────────────────────────────────────

export interface UiState {
  values: Record<string, unknown>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// ── Actions ──────────────────────────────────────────────────────────

export type UiAction =
  | { type: "SET_STATE"; key: string; value: unknown }
  | { type: "SET_LOADING"; actionId: string; loading: boolean }
  | { type: "SET_ERROR"; actionId: string; error: string | null };

// ── Reducer ──────────────────────────────────────────────────────────

function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case "SET_STATE":
      return {
        ...state,
        values: setByPath(state.values, action.key, action.value),
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: { ...state.loading, [action.actionId]: action.loading },
      };
    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.actionId]: action.error },
      };
    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────

export interface UiStateContextValue {
  state: UiState;
  dispatch: Dispatch<UiAction>;
}

export const UiStateContext = createContext<UiStateContextValue | null>(
  null,
);

// ── Hooks ────────────────────────────────────────────────────────────

function useUiContext(): UiStateContextValue {
  const ctx = useContext(UiStateContext);
  if (!ctx) {
    throw new Error("useUiContext must be used within a <StateProvider>");
  }
  return ctx;
}

export function useUiState(key: string): unknown {
  const { state } = useUiContext();
  return getByPath(state.values, key);
}

export function useUiLoading(actionId: string): boolean {
  const { state } = useUiContext();
  return state.loading[actionId] ?? false;
}

export function useUiError(actionId: string): string | null {
  const { state } = useUiContext();
  return state.errors[actionId] ?? null;
}

export function useUiDispatch(): Dispatch<UiAction> {
  return useUiContext().dispatch;
}

export function useUiSnapshot(): UiState {
  return useUiContext().state;
}

// ── Provider ─────────────────────────────────────────────────────────

export interface StateProviderProps {
  initialState?: Record<string, unknown>;
  children: ReactNode;
}

export function StateProvider({ initialState, children }: StateProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, {
    values: initialState ?? {},
    loading: {},
    errors: {},
  });

  return (
    <UiStateContext.Provider value={{ state, dispatch }}>
      {children}
    </UiStateContext.Provider>
  );
}
