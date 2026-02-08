/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceLocation, SourceRange } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';

import { deserializeNodeByKind } from './astDeserializer.js';

// ============================================================================
// Root normalization (golden JSON may omit @type at root)
// ============================================================================

/**
 * Type guard for plain objects (excludes null, arrays).
 * @param x - Value to check.
 * @returns True if x is a plain object.
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === 'object' && !Array.isArray(x);
}

/**
 * Normalize root object so golden JSON (which may omit `@type` at root) passes validateJsonASTNode.
 * @param parsed - The parsed JSON value.
 * @returns The normalized object or parsed as-is.
 */
function normalizeRootForGolden(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return parsed;
  }
  if (!isRecord(parsed)) return parsed;
  const obj = parsed;
  const hasType = typeof obj['@type'] === 'string' || typeof obj.kind === 'string';
  if (hasType) return parsed;
  if (Object.prototype.hasOwnProperty.call(obj, 'typeDeclaration')) {
    return { ...obj, '@type': 'CompilationUnit' };
  }
  if (Object.prototype.hasOwnProperty.call(obj, 'group')) {
    return { ...obj, '@type': 'VariableDeclarationStatement' };
  }
  return parsed;
}

// ============================================================================
// Validation (used by JsonDeserializer.deserialize)
// ============================================================================

/**
 * Validates and extracts SourceRange from unknown value (internal shape: start/end with line/column).
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
 * Parses Summit-AST canonical sourceLocation (startLine, startColumn, endLine, endColumn) into SourceRange.
 * @param value - Value from JSON (canonical sourceLocation).
 * @returns SourceRange if valid, undefined otherwise.
 */
function parseSourceLocation(value: unknown): SourceRange | undefined {
  if (value === null || value === undefined || typeof value !== 'object') {
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  const { startLine, startColumn, endLine, endColumn } = value;
  if (
    typeof startLine === 'number' &&
    typeof startColumn === 'number' &&
    typeof endLine === 'number' &&
    typeof endColumn === 'number'
  ) {
    return {
      end: { column: endColumn, line: endLine },
      start: { column: startColumn, line: startLine },
    };
  }
  return undefined;
}

/**
 * Runtime validation that a parsed JSON value is a JsonASTNode.
 * Narrowing uses property checks instead of unsafe type assertions.
 * Accepts Summit-AST canonical inline Identifier shape { string, sourceLocation } without `@type`.
 * @param value - The value to validate as a JSON AST node.
 * @returns The validated JSON AST node.
 * @throws {Error} If the value is not an object or is missing `@type` or kind property.
 */
function validateJsonASTNode(value: unknown): JsonASTNode {
  if (value === null || value === undefined || typeof value !== 'object') {
    throw new Error('Invalid JSON AST node: expected object');
  }

  const candidate: Record<string, unknown> = { ...value };
  const { kind, '@type': type } = candidate;

  // Summit-AST canonical format may omit @type for Identifier (inline { string, sourceLocation })
  if (typeof kind !== 'string' && typeof type !== 'string') {
    if ('string' in candidate && typeof candidate.string === 'string') {
      candidate['@type'] = 'Identifier';
      candidate.kind = 'Identifier';
    } else {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }
  }

  const fallbackType = typeof candidate['@type'] === 'string' ? candidate['@type'] : 'Identifier';
  const out: JsonASTNode = {
    '@type': typeof type === 'string' ? type : typeof kind === 'string' ? kind : fallbackType,
    ...candidate,
  };
  return out;
}

// ============================================================================
// Deserialization Classes and Functions
// ============================================================================

/**
 * Parse location from JSON (internal start/end shape or Summit-AST canonical sourceLocation).
 * Used when deserializing inline id/field objects that only have string and sourceLocation.
 * @param value - The JSON value (start/end object or sourceLocation).
 * @returns The SourceRange or undefined.
 */
function parseLocationFromJson(value: unknown): SourceRange | undefined {
  return parseSourceRange(value) ?? parseSourceLocation(value);
}

/**
 * JSON Deserializer for AST nodes.
 */
export class JsonDeserializer {
  /**
   * Parse location from JSON (internal start/end shape or Summit-AST canonical sourceLocation).
   * Used when deserializing inline id/field objects that only have string and sourceLocation.
   * @param value - The JSON value (start/end object or sourceLocation).
   * @returns The SourceRange or undefined.
   */
  public parseLocation(value: unknown): SourceRange | undefined {
    void this;
    return parseLocationFromJson(value);
  }

  /**
   * Deserialize a JSON string to an AST node.
   * @param jsonString - The JSON string to deserialize.
   * @returns The deserialized AST node.
   */
  public deserialize(jsonString: string): ASTNode {
    const parsed: unknown = JSON.parse(jsonString);
    const normalized = normalizeRootForGolden(parsed);
    return this.deserializeNode(validateJsonASTNode(normalized));
  }

  /**
   * Deserialize a JsonASTNode to an AST node.
   * @param json - The JSON node to deserialize.
   * @returns The deserialized AST node.
   * @throws {Error} If the JSON node is missing `@type` or kind property.
   */
  public deserializeNode(json: Readonly<JsonASTNode>): ASTNode {
    // Get node type from @type or kind (kind for backward compatibility with legacy JSON)
    const nodeType = typeof json['@type'] === 'string' ? json['@type'] : json.kind;
    if (typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    // Extract location if present (internal shape or Summit-AST canonical sourceLocation)
    const location = parseSourceRange(json.location) ?? parseSourceLocation(json.sourceLocation);

    // Deserialize using the dispatcher
    return deserializeNodeByKind(json, { deserializer: this, location, nodeType });
  }
}
