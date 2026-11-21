#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { TbfClient } from './api/tbf-client.ts';
import { loadConfig } from './config/load-config.ts';
import { registerTools } from './tools/register-tools.ts';

const SERVER_NAME = 'tbfernandes';
const SERVER_VERSION = '0.2.0';

const config = loadConfig();
const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

registerTools(server, { api: new TbfClient(config), webUrl: config.webUrl });

await server.connect(new StdioServerTransport());
