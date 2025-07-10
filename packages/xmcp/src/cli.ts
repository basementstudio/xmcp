#!/usr/bin/env node
import { Command } from "commander";
import {
  createDevCommand,
  createBuildCommand,
  createGenerateCommand,
} from "./commands";

const program = new Command();

program.name("xmcp").description("The MCP framework CLI").version("0.0.1");

// Add commands
program.addCommand(createDevCommand());
program.addCommand(createBuildCommand());
program.addCommand(createGenerateCommand());

program.parse();
