import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  ShapeOutput,
  ZodRawShapeCompat,
} from '@modelcontextprotocol/sdk/server/zod-compat.js';

import type { TbfClient } from '../api/tbf-client.ts';

export interface ToolContext {
  api: TbfClient;
  webUrl: string;
}

export type ToolRegistration = (server: McpServer) => void;

interface ToolSpec<Shape extends ZodRawShapeCompat> {
  name: string;
  description: string;
  input: Shape;
  run: (args: ShapeOutput<Shape>) => Promise<unknown>;
}

export function defineTool<Shape extends ZodRawShapeCompat>(
  spec: ToolSpec<Shape>,
): ToolRegistration {
  const input: ZodRawShapeCompat = spec.input;
  return (server) => {
    server.registerTool(
      spec.name,
      { description: spec.description, inputSchema: input },
      async (args) => runSafely(() => spec.run(args as ShapeOutput<Shape>)),
    );
  };
}

async function runSafely(run: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return jsonResult(await run());
  } catch (error) {
    return errorResult(error);
  }
}

function jsonResult(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}

function errorResult(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { isError: true, content: [{ type: 'text', text: message }] };
}
