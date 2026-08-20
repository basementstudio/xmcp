// @vitest-environment jsdom
import React, { StrictMode, useEffect, useRef } from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const bridgeMocks = vi.hoisted(() => {
  const state = {
    isConnected: true,
    hostContext: null,
    hostCapabilities: null,
  };
  const bridge = {
    callTool: vi.fn().mockResolvedValue({ content: [] }),
    requestDisplayMode: vi.fn(),
    openLink: vi.fn(),
    readResource: vi.fn(),
    sendMessage: vi.fn(),
    updateModelContext: vi.fn(),
    logMessage: vi.fn(),
    notifySizeChanged: vi.fn(),
    getState: vi.fn(() => state),
    getHostContext: vi.fn(),
    getHostCapabilities: vi.fn(),
    isConnected: vi.fn(() => true),
    subscribe: vi.fn(() => vi.fn()),
    dispose: vi.fn(),
  };

  return {
    bridge,
    createMcpHostBridge: vi.fn(() => bridge),
  };
});

vi.mock("xmcp/host-bridge", () => ({
  createMcpHostBridge: bridgeMocks.createMcpHostBridge,
}));

import { useAutoMcpAppSize, useMcpApp } from "./use-mcp-app.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function StrictModeBridgeConsumer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { callTool } = useMcpApp();
  useAutoMcpAppSize(rootRef);

  useEffect(() => {
    void callTool("demo");
  }, [callTool]);

  return <div ref={rootRef}>Bridge consumer</div>;
}

describe("useMcpApp", () => {
  it("shares one bridge across hooks and StrictMode remounts", async () => {
    expect(() =>
      render(
        <StrictMode>
          <StrictModeBridgeConsumer />
        </StrictMode>
      )
    ).not.toThrow();

    await waitFor(() => {
      expect(bridgeMocks.bridge.callTool).toHaveBeenCalled();
    });

    expect(bridgeMocks.createMcpHostBridge).toHaveBeenCalledTimes(1);
    expect(bridgeMocks.bridge.dispose).not.toHaveBeenCalled();
  });
});
