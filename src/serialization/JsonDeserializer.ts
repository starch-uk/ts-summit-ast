/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';

import { deserializeNodeByKind } from './astDeserializer.js';

// ============================================================================
// Validation (used by JsonDeserializer.deserialize)
// ============================================================================

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowed by typeof check above
  const candidate = value as Record<string, unknown>;
  const { kind } = candidate;
  const type = candidate['@type'];

  if (typeof kind !== 'string' && typeof type !== 'string') {
    throw new Error('Invalid JSON AST node: missing @type or kind property');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type validated by property checks above
  return candidate as JsonASTNode;
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
    // Get node type from @type or kind field
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- @type is required but json.kind may be used as fallback
    const nodeType = json['@type'] ?? json.kind;
    if (typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    // Extract location if present
    const location =
      json.location !== null && json.location !== undefined && typeof json.location === 'object'
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowed by typeof check
          (json.location as SourceRange)
        : undefined;

    // Deserialize using the dispatcher
    return deserializeNodeByKind(json, nodeType, location, this);
  }
}
