import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PREVIEW_LENGTH = 300;

const READ_ONLY_CALLS: [string, Record<string, unknown>][] = [
  ['list_notes', { size: 3 }],
  ['list_studies', {}],
  ['list_goals', {}],
];

const client = new Client({ name: 'smoke', version: '0.0.0' });
await client.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: ['src/index.ts'],
  }),
);

const { tools } = await client.listTools();
console.log('tools:', tools.map((tool) => tool.name).join(', '));

for (const [name, args] of READ_ONLY_CALLS) {
  const result = await client.callTool({ name, arguments: args });
  const [first] = result.content as { text: string }[];
  const status = result.isError ? ' ERRO' : '';
  console.log(
    `\n${name}${status}:`,
    (first?.text ?? '').slice(0, PREVIEW_LENGTH),
  );
}

await client.close();
