/**
 * @file SummitTool - CLI tool for processing Apex files.
 *
 * Note: This tool requires parse trees from an external parser.
 * It demonstrates how to use the AST library but does not include
 * a parser runtime dependency.
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { ASTTranslator } from '../translator/ASTTranslator.js';
import { JsonSerializer } from '../serialization/JsonSerializer.js';
import type { ParseTreeNode } from '../parser/ParseTreeTypes.js';

/**
 * Options for SummitTool.
 */
export interface SummitToolOptions {
  /**
   * Whether to output JSON.
   */
  json?: boolean;

  /**
   * Whether to include source location.
   */
  includeLocation?: boolean;

  /**
   * Whether to be verbose.
   */
  verbose?: boolean;

  /**
   * Custom parse tree adapter function
   * This allows users to adapt their parser's output to ParseTreeNode format.
   */
  parseTreeAdapter?: (source: string, filePath: string) => ParseTreeNode | null;
}

/**
 * Result of processing a file.
 */
export interface ProcessResult {
  readonly file: string;
  readonly success: boolean;
  readonly error?: string;
  readonly ast?: unknown;
}

/**
 * SummitTool class for processing Apex files.
 */
class SummitTool {
  private readonly options: Required<Omit<SummitToolOptions, 'parseTreeAdapter'>> & {
    parseTreeAdapter?: SummitToolOptions['parseTreeAdapter'];
  };
  private readonly translator: ASTTranslator;
  private readonly serializer: JsonSerializer;

  constructor(options: SummitToolOptions = {}) {
    this.options = {
      includeLocation: options.includeLocation ?? true,
      json: options.json ?? false,
      parseTreeAdapter: options.parseTreeAdapter,
      verbose: options.verbose ?? false,
    };

    this.translator = new ASTTranslator({
      includeLocation: this.options.includeLocation,
    });

    this.serializer = new JsonSerializer({
      compact: !this.options.verbose,
      includeLocation: this.options.includeLocation,
    });
  }

  /**
   * Process a single file or directory.
   * @param input - The file or directory path to process.
   * @returns Array of processing results.
   */
  process(input: string): ProcessResult[] {
    const results: ProcessResult[] = [];

    try {
      const stats = statSync(input);

      if (stats.isDirectory()) {
        results.push(...this.processDirectory(input));
      } else if (stats.isFile()) {
        const result = this.processFile(input);
        if (result) {
          results.push(result);
        }
      } else {
        results.push({
          error: 'Input is neither a file nor a directory',
          file: input,
          success: false,
        });
      }
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : String(error),
        file: input,
        success: false,
      });
    }

    return results;
  }

  /**
   * Process a directory recursively.
   * @param dir - The directory path to process.
   * @returns Array of processing results.
   */
  private processDirectory(dir: string): ProcessResult[] {
    const results: ProcessResult[] = [];
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        results.push(...this.processDirectory(fullPath));
      } else if (entry.isFile()) {
        // Process files with .cls or .trigger extensions
        if (this.isApexFile(fullPath)) {
          const result = this.processFile(fullPath);
          if (result) {
            results.push(result);
          }
        }
      }
    }

    return results;
  }

  /**
   * Process a single file.
   * @param filePath - The file path to process.
   * @returns Processing result, or null if skipped.
   */
  private processFile(filePath: string): ProcessResult | null {
    try {
      const source = readFileSync(filePath, 'utf-8');

      // Get parse tree using adapter or throw error
      if (!this.options.parseTreeAdapter) {
        return {
          error: 'No parse tree adapter provided. Please provide a parseTreeAdapter function.',
          file: filePath,
          success: false,
        };
      }

      const parseTree = this.options.parseTreeAdapter(source, filePath);
      if (!parseTree) {
        return {
          error: 'Failed to parse file',
          file: filePath,
          success: false,
        };
      }

      // Translate to AST
      const translationResult = this.translator.translate(parseTree);

      if (translationResult.errors.length > 0) {
        return {
          error: `Translation errors: ${translationResult.errors.map((e) => e.message).join(', ')}`,
          file: filePath,
          success: false,
        };
      }

      if (!translationResult.ast) {
        return {
          error: 'Translation produced no AST',
          file: filePath,
          success: false,
        };
      }

      // Serialize to JSON if requested
      const output = this.options.json
        ? this.serializer.serialize(translationResult.ast)
        : this.formatAST(translationResult.ast);

      return {
        ast: this.options.json ? JSON.parse(output) : translationResult.ast,
        file: filePath,
        success: true,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        file: filePath,
        success: false,
      };
    }
  }

  /**
   * Check if file is an Apex file.
   * @param filePath - The file path to check.
   * @returns True if the file has .cls or .trigger extension.
   */
  private isApexFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.cls' || ext === '.trigger';
  }

  /**
   * Format AST for display.
   * @param ast - The AST node to format.
   * @returns Formatted string representation of the AST.
   */
  private formatAST(ast: unknown): string {
    if (this.options.verbose) {
      return JSON.stringify(ast, null, 2);
    }

    // Simple text representation
    if (ast && typeof ast === 'object' && 'kind' in ast) {
      return `AST Node: ${ast.kind}`;
    }

    return String(ast);
  }

  /**
   * Print results to console.
   * @param results - The processing results to print.
   */
  printResults(results: ProcessResult[]): void {
    for (const result of results) {
      if (result.success) {
        if (this.options.json) {
          console.log(JSON.stringify(result.ast, null, 2));
        } else {
          console.log(`${result.file}: OK`);
          if (this.options.verbose && result.ast) {
            console.log(this.formatAST(result.ast));
          }
        }
      } else {
        console.error(`${result.file}: ERROR - ${result.error}`);
      }
    }
  }
}

export { SummitTool };
