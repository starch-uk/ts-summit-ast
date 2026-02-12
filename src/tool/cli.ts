#!/usr/bin/env node

/**
 * @file CLI entry point for SummitTool.
 * Command-line interface for the SummitTool.
 */

import { CLI_ARGS_START_INDEX } from '../constants.js';
import { SummitTool } from './summitTool.js';

/**
 * Parse command line arguments.
 * @param args - Command line arguments.
 * @returns Parsed arguments object.
 */
function parseArgs(args: readonly string[]): {
  files: string[];
  json: boolean;
  verbose: boolean;
  help: boolean;
} {
  const files: string[] = [];
  let json = false;
  let verbose = false;
  let help = false;

  for (const arg of args) {
    switch (arg) {
      case '-json':
      case '--json':
        json = true;
        break;
      case '-v':
      case '--verbose':
        verbose = true;
        break;
      case '-h':
      case '--help':
        help = true;
        break;
      default:
        if (!arg.startsWith('-')) {
          files.push(arg);
        }
        break;
    }
  }

  return { files, help, json, verbose };
}

/**
 * Print help message.
 */
function printHelp(): void {
  console.log(`
SummitTool - Process Apex source files and generate ASTs

Usage:
  summit-tool [options] [files | directories...]

Options:
  -json, --json      Output AST as JSON
  -v, --verbose      Verbose output
  -h, --help         Show this help message

Examples:
  summit-tool MyClass.cls
  summit-tool -json src/
  summit-tool --verbose classes/

Note:
  Uses the built-in parser by default. Pass a parseTreeAdapter
  to SummitTool to use an external parser instead.
`);
}

/**
 * Main CLI function.
 */
function main(): void {
  const args = process.argv.slice(CLI_ARGS_START_INDEX);

  const emptyArrayLength = 0;
  if (args.length === emptyArrayLength) {
    printHelp();

    const exitCodeSuccess = 0;
    process.exit(exitCodeSuccess);
  }

  const { files, json, verbose, help } = parseArgs(args);

  if (help) {
    printHelp();

    const exitCodeSuccess = 0;
    process.exit(exitCodeSuccess);
  }

  if (files.length === emptyArrayLength) {
    console.error('Error: No files or directories specified');
    printHelp();

    const exitCodeError = 1;
    process.exit(exitCodeError);
  }

  // Create tool instance (uses built-in parser)
  const tool = new SummitTool({
    includeLocation: true,
    json,
    verbose,
  });

  // Process all files/directories
  const allResults: { file: string; success: boolean; error?: string; ast?: unknown }[] = [];
  for (const file of files) {
    const results = tool.process(file);
    allResults.push(...results);
  }

  // Print results
  tool.printResults(allResults);

  // Exit with error code if any failures
  let hasErrors = false;
  for (const r of allResults) {
    if (!r.success) {
      hasErrors = true;
      break;
    }
  }

  const exitCodeError = 1;
  const exitCodeSuccess = 0;
  process.exit(hasErrors ? exitCodeError : exitCodeSuccess);
}

// Run if called directly

const scriptPathIndex = 1;
if (import.meta.url === `file://${process.argv[scriptPathIndex]}`) {
  main();
}
