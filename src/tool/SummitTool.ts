/**
 * SummitTool - CLI tool for processing Apex files
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
 * Options for SummitTool
 */
export interface SummitToolOptions {
  /**
   * Whether to output JSON
   */
  json?: boolean;

  /**
   * Whether to include source location
   */
  includeLocation?: boolean;

  /**
   * Whether to be verbose
   */
  verbose?: boolean;

  /**
   * Custom parse tree adapter function
   * This allows users to adapt their parser's output to ParseTreeNode format
   */
  parseTreeAdapter?: (source: string, filePath: string) => ParseTreeNode | null;
}

/**
 * Result of processing a file
 */
export interface ProcessResult {
  readonly file: string;
  readonly success: boolean;
  readonly error?: string;
  readonly ast?: unknown;
}

/**
 * SummitTool class for processing Apex files
 */
export class SummitTool {
  private readonly options: Required<Omit<SummitToolOptions, 'parseTreeAdapter'>> & {
    parseTreeAdapter?: SummitToolOptions['parseTreeAdapter'];
  };
  private readonly translator: ASTTranslator;
  private readonly serializer: JsonSerializer;

  constructor(options: SummitToolOptions = {}) {
    this.options = {
      json: options.json ?? false,
      includeLocation: options.includeLocation ?? true,
      verbose: options.verbose ?? false,
      parseTreeAdapter: options.parseTreeAdapter,
    };

    this.translator = new ASTTranslator({
      includeLocation: this.options.includeLocation,
    });

    this.serializer = new JsonSerializer({
      includeLocation: this.options.includeLocation,
      compact: !this.options.verbose,
    });
  }

  /**
   * Process a single file or directory
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
          file: input,
          success: false,
          error: 'Input is neither a file nor a directory',
        });
      }
    } catch (error) {
      results.push({
        file: input,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return results;
  }

  /**
   * Process a directory recursively
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
   * Process a single file
   */
  private processFile(filePath: string): ProcessResult | null {
    try {
      const source = readFileSync(filePath, 'utf-8');

      // Get parse tree using adapter or throw error
      if (!this.options.parseTreeAdapter) {
        return {
          file: filePath,
          success: false,
          error: 'No parse tree adapter provided. Please provide a parseTreeAdapter function.',
        };
      }

      const parseTree = this.options.parseTreeAdapter(source, filePath);
      if (!parseTree) {
        return {
          file: filePath,
          success: false,
          error: 'Failed to parse file',
        };
      }

      // Translate to AST
      const translationResult = this.translator.translate(parseTree);

      if (translationResult.errors.length > 0) {
        return {
          file: filePath,
          success: false,
          error: `Translation errors: ${translationResult.errors.map((e) => e.message).join(', ')}`,
        };
      }

      if (!translationResult.ast) {
        return {
          file: filePath,
          success: false,
          error: 'Translation produced no AST',
        };
      }

      // Serialize to JSON if requested
      const output = this.options.json
        ? this.serializer.serialize(translationResult.ast)
        : this.formatAST(translationResult.ast);

      return {
        file: filePath,
        success: true,
        ast: this.options.json ? JSON.parse(output) : translationResult.ast,
      };
    } catch (error) {
      return {
        file: filePath,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if file is an Apex file
   */
  private isApexFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.cls' || ext === '.trigger';
  }

  /**
   * Format AST for display
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
   * Print results to console
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
