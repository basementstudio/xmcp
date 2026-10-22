import { withClient } from "xmcp/client";
import type { ExecutionOptions } from "../utils/execution-options.js";
import { resolveDiscoveryTarget } from "../utils/discovery-target.js";
import {
  readExecutionArguments,
  validatePromptArguments,
  validateToolArguments,
} from "../utils/execution-arguments.js";

export async function runExecution(options: ExecutionOptions) {
  // Read stdin before spawning a STDIO server; its protocol stream stays separate.
  const args = await readExecutionArguments(options);
  return withClient(await resolveDiscoveryTarget(options), async (client) => {
    switch (options.command) {
      case "call": {
        const { tools } = await client.listTools();
        const tool = tools.find((tool) => tool.name === options.component);
        if (!tool) throw new Error(`Unknown tool "${options.component}".`);
        await validateToolArguments(tool.inputSchema, args);
        const result = await client.callTool({
          name: options.component,
          arguments: args,
        });
        return { result, exitCode: result.isError ? 1 : 0 };
      }
      case "get-prompt": {
        const { prompts } = await client.listPrompts();
        const prompt = prompts.find(
          (prompt) => prompt.name === options.component
        );
        if (!prompt) throw new Error(`Unknown prompt "${options.component}".`);
        const result = await client.getPrompt({
          name: options.component,
          arguments: validatePromptArguments(prompt.arguments ?? [], args),
        });
        return { result, exitCode: 0 };
      }
      case "read-resource": {
        const result = await client.readResource({ uri: options.component });
        return { result, exitCode: 0 };
      }
    }
  });
}
