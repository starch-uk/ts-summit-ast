/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceLocation, SourceRange } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';

import { deserializeNodeByKind } from './astDeserializer.js';

// ============================================================================
// Validation (used by JsonDeserializer.deserialize)
// ============================================================================

/**
 * Validates and extracts SourceRange from unknown value.
 * @param value - Value from JSON.
 * @returns SourceRange if valid, undefined otherwise.
 */
function parseSourceRange(value: unknown): SourceRange | undefined {
  if (value === null || value === undefined || typeof value !== 'object') {
    return undefined;
  }
  const rec: Record<string, unknown> = { ...value };
  const { end, start } = rec;
  if (
    start !== null &&
    typeof start === 'object' &&
    end !== null &&
    typeof end === 'object' &&
    'line' in start &&
    'column' in start &&
    'line' in end &&
    'column' in end
  ) {
    const s = start as Record<string, unknown>;
    const e = end as Record<string, unknown>;
    const { column: sCol, line: sLine, offset: sOffset } = s;
    const { column: eCol, line: eLine, offset: eOffset } = e;
    if (
      typeof sLine === 'number' &&
      typeof sCol === 'number' &&
      typeof eLine === 'number' &&
      typeof eCol === 'number'
    ) {
      const startLoc: SourceLocation = {
        column: sCol,
        line: sLine,
        ...(typeof sOffset === 'number' ? { offset: sOffset } : {}),
      };
      const endLoc: SourceLocation = {
        column: eCol,
        line: eLine,
        ...(typeof eOffset === 'number' ? { offset: eOffset } : {}),
      };
      return {
        end: endLoc,
        start: startLoc,
      };
    }
  }
  return undefined;
}

/**
 * Runtime validation that a parsed JSON value is a JsonASTNode.
 * Narrowing uses property checks instead of unsafe type assertions.
 * @param value - The value to validate as a JSON AST node.
 * @returns The validated JSON AST node.
 * @throws {Error} If the value is not an object or is missing \@type or kind property.
 */
function validateJsonASTNode(value: unknown): JsonASTNode {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new Error('Invalid JSON AST node: expected object');
  }

  const candidate: Record<string, unknown> = { ...value };
  const { kind, '@type': type } = candidate;

  if (typeof kind !== 'string' && typeof type !== 'string') {
    throw new Error('Invalid JSON AST node: missing @type or kind property');
  }

  const out: JsonASTNode = {
    '@type': typeof type === 'string' ? type : typeof kind === 'string' ? kind : '',
    ...candidate,
  };
  return out;
}

// ============================================================================
// Deserialization Classes and Functions
// ============================================================================

/**
 * Options for JSON deserialization.
 */
export interface DeserializationOptions {
  /**
   * Whether to validate the JSON structure.
   */
  validate?: boolean;

  /**
   * Custom reviver function (similar to JSON.parse reviver).
   */
  reviver?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Deserializer for AST nodes.
 */
export class JsonDeserializer {
  public constructor(_options: Readonly<DeserializationOptions> = {}) {
    // Options are currently unused but kept for future use
    void _options;
  }

  /**
   * Deserialize a JSON string to an AST node.
   * @param jsonString - The JSON string to deserialize.
   * @returns The deserialized AST node.
   */
  public deserialize(jsonString: string): ASTNode {
    const parsed: unknown = JSON.parse(jsonString);
    return this.deserializeNode(validateJsonASTNode(parsed));
  }

  /**
   * Deserialize a JsonASTNode to an AST node.
   * @param json - The JSON node to deserialize.
   * @returns The deserialized AST node.
   * @throws {Error} If the JSON node is missing \@type or kind property.
   */
  public deserializeNode(json: Readonly<JsonASTNode>): ASTNode {
    // Get node type from @type or kind (kind for backward compatibility with legacy JSON)
    const nodeType = typeof json['@type'] === 'string' ? json['@type'] : json.kind;
    if (typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    // Extract location if present
    const location = parseSourceRange(json.location);

    // Deserialize using the dispatcher
    return deserializeNodeByKind(json, { deserializer: this, location, nodeType });
  }
}
