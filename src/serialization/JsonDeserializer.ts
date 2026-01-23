/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import { NodeFactory } from '../translator/nodeFactory.js';
import type {
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/statement.js';
import type {
  BinaryExpression,
  AssignExpression,
  ArrayExpression,
  CallExpression,
  NewExpression,
  VariableExpression,
  FieldExpression,
} from '../ast/expression.js';
import type {
  ConstructorInitializer,
  Initializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
  ElementValue,
} from '../ast/initializer.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
} from '../ast/literal.js';
import type { TypeRef } from '../ast/baseNode.js';
import type { AnnotationArgument, VariableDeclaration } from '../ast/declaration.js';
import type { Annotation, Modifier } from '../ast/declaration.js';
import type { Expression } from '../ast/expression.js';
import type { Statement } from '../ast/statement.js';
import type { Identifier } from '../ast/baseNode.js';
import { isExpression, isStatement, isIdentifier } from '../guard/index.js';
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
  private readonly options: Required<DeserializationOptions>;

  public constructor(options: Readonly<DeserializationOptions> = {}) {
    const reviver = options.reviver ?? ((_key, value): unknown => value);
    this.options = {
      reviver,
      validate: options.validate ?? true,
    };
  }

  /**
   * Type guard to check if a value is a JsonASTNode.
   * @param value - The value to check.
   * @returns True if the value is a JsonASTNode.
   */
  private static isJsonASTNode(value: unknown): value is JsonASTNode {
    return (
      typeof value === 'object' &&
      value !== null &&
      (('@type' in value && typeof (value as { '@type': unknown })['@type'] === 'string') ||
        ('kind' in value && typeof (value as { kind: unknown }).kind === 'string'))
    );
  }

  /**
   * Type guard to check if a value is an array of JsonASTNodes.
   * @param value - The value to check.
   * @returns True if the value is an array of JsonASTNodes.
   */
  private static isJsonASTNodeArray(value: unknown): value is JsonASTNode[] {
    return Array.isArray(value) && value.every((item) => JsonDeserializer.isJsonASTNode(item));
  }

  /**
   * Safely gets a JsonASTNode property from a JsonASTNode.
   * @param json - The JSON node.
   * @param property - The property name.
   * @returns The property value as JsonASTNode, or throws if invalid.
   * @throws {Error} If the property is not a valid JsonASTNode.
   */
  private static getJsonASTNodeProperty(
    json: Readonly<JsonASTNode>,
    property: string
  ): JsonASTNode {
    const value = json[property];
    if (!JsonDeserializer.isJsonASTNode(value)) {
      throw new Error(`Invalid JSON AST node: property ${property} is not a valid JsonASTNode`);
    }
    return value;
  }

  /**
   * Safely gets an optional JsonASTNode property from a JsonASTNode.
   * @param json - The JSON node.
   * @param property - The property name.
   * @returns The property value as JsonASTNode, or undefined if not present/invalid.
   */
  private static getOptionalJsonASTNodeProperty(
    json: Readonly<JsonASTNode>,
    property: string
  ): JsonASTNode | undefined {
    const value = json[property];
    return JsonDeserializer.isJsonASTNode(value) ? value : undefined;
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
