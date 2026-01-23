/**
 * @file JSON serializer for AST nodes.
 *
 * Converts AST nodes to JSON format for storage, transmission, or debugging.
 */

/* eslint-disable import/group-exports -- Inline exports are standard TypeScript practice */

import type { ASTNode, SourceRange } from '../ast/baseNode.js';
import type {
  Statement,
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/statement.js';
import type {
  Expression,
  BinaryExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  AssignExpression,
  NewExpression,
  VariableExpression,
} from '../ast/expression.js';
import type { TypeRef, TypeRefComponent } from '../ast/baseNode.js';
import type { ElementValue } from '../ast/initializer.js';
import type { Modifier } from '../ast/declaration.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
} from '../ast/literal.js';
import type {
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/initializer.js';
import type { VariableDeclaration, AnnotationArgument } from '../ast/declaration.js';
import { serializeNodeProperties } from './astSerializer.js';

/**
 * JSON representation of an AST node.
 */
export interface JsonASTNode {
  '@type': string;
  // eslint-disable-next-line @typescript-eslint/member-ordering -- Index signature must be last
  [key: string]: unknown;
}

/**
 * Options for JSON serialization.
 */
export interface SerializationOptions {
  /**
   * Whether to include source location information.
   */
  includeLocation?: boolean;

  /**
   * Whether to use compact format (minimize whitespace).
   */
  compact?: boolean;

  /**
   * Custom replacer function (similar to JSON.stringify replacer).
   */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Serializer for AST nodes.
 */
export class JsonSerializer {
  private readonly options: Required<SerializationOptions>;

  public constructor(options: Readonly<SerializationOptions> = {}) {
    this.options = {
      compact: options.compact ?? false,
      includeLocation: options.includeLocation ?? true,
      replacer: options.replacer ?? ((_key, value): unknown => value),
    };
  }

  /**
   * Serialize an AST node to JSON string.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON string representation of the node.
   */
  public serialize(node: Readonly<ASTNode>): string {
    const json = this.serializeNode(node);

    const indentSize = 2;
    return this.options.compact ? JSON.stringify(json) : JSON.stringify(json, null, indentSize);
  }

  /**
   * Serialize a single AST node to JSON object.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON object representation of the node.
   */
  public serializeNode(node: Readonly<ASTNode>): JsonASTNode {
    const json: JsonASTNode = {
      '@type': node.kind,
    };

    // Add location if requested
    if (this.options.includeLocation && node.location) {
      json.location = node.location;
    }

    // Serialize node-specific properties
    serializeNodeProperties(node, json, this);

    return json;
  }
}
