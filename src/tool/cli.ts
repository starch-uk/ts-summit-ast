#!/usr/bin/env node

/**
 * @file CLI entry point for SummitTool.
 * Command-line interface for the SummitTool.
 */

import { SummitTool } from './SummitTool.js';

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
  This tool requires a parse tree adapter function to work.
  You need to provide a parser that converts Apex source code
  to ParseTreeNode format. See the documentation for details.
`);
}

/**
 * Main CLI function.
 */
function main(): void {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- process.argv.slice(2) is standard for CLI args
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const { files, json, verbose, help } = parseArgs(args);

  if (help) {
    printHelp();
    process.exit(0);
  }

  if (files.length === 0) {
    console.error('Error: No files or directories specified');
    printHelp();
    process.exit(1);
  }

  // Create tool instance
  // Note: In a real implementation, users would provide their parse tree adapter
  const tool = new SummitTool({
    includeLocation: true,
    json,
    parseTreeAdapter: (_source, filePath) => {
      // This is a placeholder - users need to provide their own parser
      console.error(
        `Error: No parse tree adapter provided. Please provide a parser to convert source code to parse trees.\n` +
          `File: ${filePath}\n` +
          `See documentation for how to integrate with a parser.`
      );
      return null;
    },
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
  const hasErrors = allResults.some((r) => !r.success);
  process.exit(hasErrors ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
