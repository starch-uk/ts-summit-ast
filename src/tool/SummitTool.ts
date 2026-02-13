/**
 * @file SummitTool - CLI tool for processing Apex files.
 *
 * Uses the built-in parser by default. A custom parseTreeAdapter may be
 * provided to use an external parser instead.
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import type { CompilationUnit } from '../ast/declaration.js';
import { ASTTranslator } from '../translator/astTranslator.js';
import { JsonSerializer } from '../serialization/jsonSerializer.js';
import type { ParseTreeNode } from '../parser/parseTree.js';
import { parseApexSource } from '../parser/index.js';
import { resolve } from '../symbols/index.js';
import { attachDeclarationMetadata } from '../utils/declarationUtils.js';

const LENGTH_EMPTY = 0;

/**
 * Type guard: true if the value is a CompilationUnit AST node.
 * @param ast - Value to check.
 * @returns True if ast has \@type 'CompilationUnit'.
 */
function isCompilationUnit(ast: unknown): ast is CompilationUnit {
  if (ast === null || typeof ast !== 'object') return false;
  const desc = Object.getOwnPropertyDescriptor(ast, '@type');
  const t: unknown = desc?.value;
  return t === 'CompilationUnit';
}

/**
 * Options for SummitTool.
 */
interface SummitToolOptions {
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
   * Custom parse tree adapter function.
   * When not provided, the built-in parser is used.
   */
  parseTreeAdapter?: (source: string, filePath: string) => ParseTreeNode | null;
}

/**
 * Result of processing a file.
 */
interface ProcessResult {
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

  public constructor(options: Readonly<SummitToolOptions> = {}) {
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
   * Check if file is an Apex file.
   * @param filePath - The file path to check.
   * @returns True if the file has .cls or .trigger extension.
   */
  private static isApexFile(filePath: string): boolean {
    const ext = extname(filePath).toLowerCase();
    return ext === '.cls' || ext === '.trigger';
  }

  /**
   * Process a single file or directory.
   * Runs symbol resolution after processing (matches upstream SummitTool behavior).
   * @param input - The file or directory path to process.
   * @returns Array of processing results.
   */
  public process(input: string): ProcessResult[] {
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

      // Run symbol resolution on successful compilation units (matches upstream SummitResolver)
      const allAsts = results
        .filter(
          (r): r is ProcessResult & { ast: CompilationUnit } =>
            r.success && r.ast != null && isCompilationUnit(r.ast)
        )
        .map((r) => r.ast);
      if (allAsts.length > LENGTH_EMPTY) {
        for (const ast of allAsts) {
          attachDeclarationMetadata(ast);
        }
        resolve(allAsts);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({
        error: errorMessage,
        file: input,
        success: false,
      });
    }

    return results;
  }

  /**
   * Print results to console.
   * @param results - The processing results to print.
   */
  public printResults(results: readonly ProcessResult[]): void {
    for (const result of results) {
      if (result.success) {
        if (this.options.json) {
          const jsonIndent = 2;
          console.log(JSON.stringify(result.ast, null, jsonIndent));
        } else {
          console.log(`${result.file}: OK`);

          if (this.options.verbose && result.ast !== null && result.ast !== undefined) {
            console.log(this.formatAST(result.ast));
          }
        }
      } else {
        console.error(`${result.file}: ERROR - ${result.error ?? ''}`);
      }
    }
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
        if (SummitTool.isApexFile(fullPath)) {
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

      // Get parse tree using adapter or built-in parser
      const parseTree = this.options.parseTreeAdapter
        ? this.options.parseTreeAdapter(source, filePath)
        : parseApexSource(source);
      if (!parseTree) {
        return {
          error: 'Failed to parse file',
          file: filePath,
          success: false,
        };
      }

      // Translate to AST
      const translationResult = this.translator.translate(parseTree);

      const emptyArrayLength = 0;
      if (translationResult.errors.length > emptyArrayLength) {
        return {
          error: `Translation errors: ${translationResult.errors.map((e: Readonly<{ message: string }>) => e.message).join(', ')}`,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        error: errorMessage,
        file: filePath,
        success: false,
      };
    }
  }

  /**
   * Format AST for display.
   * @param ast - The AST node to format.
   * @returns Formatted string representation of the AST.
   */
  private formatAST(ast: unknown): string {
    if (this.options.verbose) {
      const jsonIndent = 2;
      return JSON.stringify(ast, null, jsonIndent);
    }

    // Simple text representation

    if (ast !== null && ast !== undefined && typeof ast === 'object' && '@type' in ast) {
      const { kind } = ast as Record<string, unknown>;
      return typeof kind === 'string' ? `AST Node: ${kind}` : JSON.stringify(ast);
    }

    return String(ast);
  }
}

export type { ProcessResult, SummitToolOptions };
export { SummitTool };
