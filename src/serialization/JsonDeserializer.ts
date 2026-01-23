/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import type { JsonASTNode } from './jsonSerializer.js';

import { deserializeNodeByKind } from './astDeserializer.js';
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
    const json = JSON.parse(jsonString) as JsonASTNode;
    return this.deserializeNode(json);
  }

  /**
   * Deserialize a JsonASTNode to an AST node.
   * @param json - The JSON node to deserialize.
   * @returns The deserialized AST node.
   */
  public deserializeNode(json: Readonly<JsonASTNode>): ASTNode {
    // Get node type from @type or kind field
    const nodeType = json['@type'] ?? json.kind;
    if (typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    // Extract location if present
    const location = json.location as SourceRange | undefined;

    // Deserialize using the dispatcher
    return deserializeNodeByKind(json, nodeType, location, this);
  }
}
