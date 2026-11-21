import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { ToolContext } from './define-tool.ts';
import { goalTools } from './goal.tools.ts';
import { materialTools } from './material.tools.ts';
import { milestoneTools } from './milestone.tools.ts';
import { noteTools } from './note.tools.ts';
import { snippetTools } from './snippet.tools.ts';
import { studyTools } from './study.tools.ts';

const TOOL_GROUPS = [
  noteTools,
  snippetTools,
  studyTools,
  materialTools,
  goalTools,
  milestoneTools,
];

export function registerTools(server: McpServer, context: ToolContext): void {
  for (const registration of TOOL_GROUPS.flatMap((group) => group(context))) {
    registration(server);
  }
}
