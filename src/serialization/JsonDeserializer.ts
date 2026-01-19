/**
 * @file JSON deserializer for AST nodes.
 *
 * Converts JSON back to AST nodes.
 */

import type { ASTNode, SourceRange } from '../ast/base.js';
import { NodeFactory } from '../translator/NodeFactory.js';
import type {
  IfStatement,
  ForLoopStatement,
  WhileLoopStatement,
  ReturnStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/Statement.js';
import type {
  BinaryExpression,
  AssignExpression,
  ArrayExpression,
  CallExpression,
  NewExpression,
  VariableExpression,
  FieldExpression,
} from '../ast/Expression.js';
import type {
  ConstructorInitializer,
  Initializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
  ElementValue,
} from '../ast/ElementValue.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
} from '../ast/Literal.js';
import type { TypeRef } from '../ast/Type.js';
import type { AnnotationArgument, VariableDeclaration } from '../ast/Declaration.js';
import type { Annotation, Modifier } from '../ast/Declaration.js';
import type { Expression } from '../ast/Expression.js';
import type { Statement } from '../ast/Statement.js';
import type { Identifier } from '../ast/Identifier.js';
import { isExpression, isStatement, isIdentifier } from '../ast/type-guards.js';
import type { JsonASTNode } from './JsonSerializer.js';

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
    if (value === null || value === undefined) {
      return undefined;
    }
    if (!JsonDeserializer.isJsonASTNode(value)) {
      return undefined;
    }
    return value;
  }

  /**
   * Safely gets a JsonASTNode array property from a JsonASTNode.
   * @param json - The JSON node.
   * @param property - The property name.
   * @returns The property value as JsonASTNode[], or throws if invalid.
   * @throws {Error} If the property is not a valid JsonASTNode array.
   */
  private static getJsonASTNodeArrayProperty(
    json: Readonly<JsonASTNode>,
    property: string
  ): JsonASTNode[] {
    const value = json[property];
    if (!JsonDeserializer.isJsonASTNodeArray(value)) {
      throw new Error(
        `Invalid JSON AST node: property ${property} is not a valid JsonASTNode array`
      );
    }
    return value;
  }

  /**
   * Safely gets a string property from a JsonASTNode.
   * @param json - The JSON node.
   * @param property - The property name.
   * @returns The property value as string, or throws if invalid.
   * @throws {Error} If the property is not a valid string.
   */
  private static getStringProperty(json: Readonly<JsonASTNode>, property: string): string {
    const value = json[property];
    if (typeof value !== 'string') {
      throw new Error(`Invalid JSON AST node: property ${property} is not a string`);
    }
    return value;
  }

  /**
   * Safely gets a number property from a JsonASTNode.
   * @param json - The JSON node.
   * @param property - The property name.
   * @returns The property value as number, or throws if invalid.
   * @throws {Error} If the property is not a valid number.
   */
  private static getNumberProperty(json: Readonly<JsonASTNode>, property: string): number {
    const value = json[property];
    if (typeof value !== 'number') {
      throw new Error(`Invalid JSON AST node: property ${property} is not a number`);
    }
    return value;
  }


  /**
   * Deserialize JSON string to AST node.
   * @param json - The JSON string to deserialize.
   * @returns The deserialized AST node.
   */
  public deserialize(json: string): ASTNode {
    const parsed: unknown = JSON.parse(
      json,
      this.options.reviver as (key: string, value: unknown) => unknown
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown, need to assert to JsonASTNode
    return this.deserializeNode(parsed as JsonASTNode);
  }

  /**
   * Deserialize JSON object to AST node.
   * @param json - The JSON object to deserialize.
   * @returns The deserialized AST node.
   * @throws {Error} If the JSON object is invalid or missing required properties.
   */
  public deserializeNode(json: Readonly<JsonASTNode>): ASTNode {
    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)

    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)
    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)

    const atType = json['@type'];

    const { kind } = json;
    const nodeType =
      '@type' in json && atType !== null && atType !== undefined && typeof atType === 'string'
        ? atType
        : 'kind' in json && kind !== null && kind !== undefined && typeof kind === 'string'
          ? kind
          : null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type guard check
    if (typeof json !== 'object' || json === null || nodeType === null) {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    if (this.options.validate) {
      this.validateNode(json, nodeType);
    }

    const locationValue = json.location;
    const location = this.deserializeLocation(locationValue);

    return this.deserializeNodeByKind(json, nodeType, location);
  }

  /**
   * Deserialize source location from JSON data.
   * @param location - The location data to deserialize, can be an object with start/end properties or null/undefined.
   * @returns The deserialized source range, or undefined if the location data is invalid or missing.
   */
  private deserializeLocation(location: unknown): SourceRange | undefined {
    if (location === null || location === undefined || typeof location !== 'object') {
      return undefined;
    }

    const loc = location as {
      start?: { column?: number; line?: number; offset?: number };
      end?: { column?: number; line?: number; offset?: number };
    };

    const defaultLocationValue = 0;

    const endColumn = loc.end?.column ?? defaultLocationValue;

    const endLine = loc.end?.line ?? defaultLocationValue;

    const endOffset = loc.end?.offset;

    const startColumn = loc.start?.column ?? defaultLocationValue;

    const startLine = loc.start?.line ?? defaultLocationValue;

    const startOffset = loc.start?.offset;
    return {
      end: {
        column: endColumn,
        line: endLine,
        offset: endOffset,
      },
      start: {
        column: startColumn,
        line: startLine,
        offset: startOffset,
      },
    };
  }

  /**
   * Deserialize node based on its kind.
   * @param json - The JSON object to deserialize.
   * @param nodeType - The kind of AST node to deserialize (e.g., 'IfStatement', 'BinaryExpression').
   * @param location - The optional source location.
   * @returns The deserialized AST node.
   * @throws {Error} If the node type is unknown or not yet implemented.
   */
  private deserializeNodeByKind(
    json: Readonly<JsonASTNode>,
    nodeType: string,
    location?: SourceRange
  ): ASTNode {
    const locationOption = location ? { location } : undefined;

    switch (nodeType) {
      // Statement nodes
      case 'IfStatement':
        return this.deserializeIfStatement(json, locationOption);
      case 'ForLoopStatement':
        return this.deserializeForLoopStatement(json, locationOption);
      case 'WhileLoopStatement':
        return this.deserializeWhileLoopStatement(json, locationOption);
      case 'ReturnStatement':
        return this.deserializeReturnStatement(json, locationOption);
      case 'CompoundStatement':
        return this.deserializeCompoundStatement(json, locationOption);
      case 'ExpressionStatement':
        return this.deserializeExpressionStatement(json, locationOption);
      case 'VariableDeclarationStatement':
        return this.deserializeVariableDeclarationStatement(json, locationOption);
      case 'EnhancedForLoopStatement':
      case 'DoWhileLoopStatement':
        // Use generic deserialization
        throw new Error(`Deserialization for ${nodeType} not yet implemented`);

      // Expression nodes
      case 'BinaryExpression':
        return this.deserializeBinaryExpression(json, locationOption);
      case 'CallExpression':
        return this.deserializeCallExpression(json, locationOption);
      case 'FieldExpression':
        return this.deserializeFieldExpression(json, locationOption);
      case 'ArrayExpression':
        return this.deserializeArrayExpression(json, locationOption);
      case 'AssignExpression':
        return this.deserializeAssignExpression(json, locationOption);
      case 'NewExpression':
        return this.deserializeNewExpression(json, locationOption);
      case 'VariableExpression':
        return this.deserializeVariableExpression(json, locationOption);
      case 'SoqlExpression':
      case 'SoslExpression':
        // Use generic deserialization
        throw new Error(`Deserialization for ${nodeType} not yet implemented`);

      // Literal nodes
      case 'StringVal':
        return this.deserializeStringVal(json, locationOption);
      case 'IntegerVal':
        return this.deserializeIntegerVal(json, locationOption);
      case 'DoubleVal':
        return this.deserializeDoubleVal(json, locationOption);
      case 'LongVal':
        return this.deserializeLongVal(json, locationOption);
      case 'DecimalVal':
        return this.deserializeDecimalVal(json, locationOption);
      case 'BooleanVal':
        return this.deserializeBooleanVal(json, locationOption);
      case 'NullVal':
        return NodeFactory.createNullVal(locationOption);

      // Declaration nodes
      case 'VariableDeclaration':
        return this.deserializeVariableDeclaration(json, locationOption);

      // Modifier
      case 'Modifier':
        return this.deserializeModifier(json, locationOption);

      // Backward compatibility
      case 'ForStatement':
        return this.deserializeForLoopStatement(json, locationOption);
      case 'WhileStatement':
        return this.deserializeWhileLoopStatement(json, locationOption);
      case 'Block':
        return this.deserializeCompoundStatement(json, locationOption);
      case 'MethodCallExpression':
        return this.deserializeCallExpression(json, locationOption);
      case 'StringLiteral':
        return this.deserializeStringVal(json, locationOption);
      case 'NumberLiteral':
        return this.deserializeIntegerVal(json, locationOption);
      case 'BooleanLiteral':
        return this.deserializeBooleanVal(json, locationOption);
      case 'NullLiteral':
        return NodeFactory.createNullVal(locationOption);

      // Helper nodes
      case 'Identifier':
        return this.deserializeIdentifier(json, locationOption);

      // TypeRef (AST node in summit-ast)
      case 'TypeRef':
        return this.deserializeTypeRefNode(json, locationOption);

      // Initializer nodes
      case 'ConstructorInitializer':
        return this.deserializeConstructorInitializer(json, locationOption);
      case 'ValuesInitializer':
        return this.deserializeValuesInitializer(json, locationOption);
      case 'SizedArrayInitializer':
        return this.deserializeSizedArrayInitializer(json, locationOption);
      case 'MapInitializer':
        return this.deserializeMapInitializer(json, locationOption);

      // ElementValue nodes
      case 'ExpressionElementValue':
        return this.deserializeExpressionElementValue(json, locationOption);
      case 'AnnotationElementValue':
        return this.deserializeAnnotationElementValue(json, locationOption);
      case 'ArrayElementValue':
        return this.deserializeArrayElementValue(json, locationOption);

      // Declaration nodes
      case 'AnnotationArgument':
        return this.deserializeAnnotationArgument(json, locationOption);

      default:
        throw new Error(`Unknown node type: ${nodeType}`);
    }
  }

  // Statement deserialization methods

  /**
   * Deserializes an IfStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized IfStatement node.
   */
  private deserializeIfStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): IfStatement {
    const conditionNode = JsonDeserializer.getJsonASTNodeProperty(json, 'condition');
    const conditionDeserialized = this.deserializeNode(conditionNode);
    if (!isExpression(conditionDeserialized)) {
      throw new Error('Invalid IfStatement: condition is not an Expression node');
    }

    const thenStatementNode =
      JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'thenStatement') ??
      JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'thenBody');
    if (!thenStatementNode) {
      throw new Error('Invalid IfStatement: missing thenStatement or thenBody');
    }
    const thenStatementDeserialized = this.deserializeNode(thenStatementNode);
    if (!isStatement(thenStatementDeserialized)) {
      throw new Error('Invalid IfStatement: thenStatement is not a Statement node');
    }

    const elseValue =
      JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'elseStatement') ??
      JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'elseBody');
    const elseStatement =
      elseValue !== undefined
        ? ((): Statement => {
            const elseDeserialized = this.deserializeNode(elseValue);
            if (!isStatement(elseDeserialized)) {
              throw new Error('Invalid IfStatement: elseStatement is not a Statement node');
            }
            return elseDeserialized;
          })()
        : undefined;

    return NodeFactory.createIfStatement(
      conditionDeserialized,
      thenStatementDeserialized,
      elseStatement,
      locationOption
    );
  }

  /**
   * Deserializes a ForLoopStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ForLoopStatement node.
   */
  private deserializeForLoopStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ForLoopStatement {
    const initNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'init');
    let init: ExpressionStatement | VariableDeclarationStatement | undefined = undefined;
    if (initNode !== undefined) {
      const initDeserialized = this.deserializeNode(initNode);
      if (
        isStatement(initDeserialized) &&
        (initDeserialized.kind === 'ExpressionStatement' ||
          initDeserialized.kind === 'VariableDeclarationStatement')
      ) {
        init = initDeserialized as ExpressionStatement | VariableDeclarationStatement;
      }
    }

    const conditionNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'condition');
    let condition: Expression | undefined = undefined;
    if (conditionNode !== undefined) {
      const conditionDeserialized = this.deserializeNode(conditionNode);
      // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
      if (conditionDeserialized.kind === 'Identifier' && isIdentifier(conditionDeserialized)) {
        condition = NodeFactory.createVariableExpression(conditionDeserialized, locationOption);
      } else if (isExpression(conditionDeserialized)) {
        condition = conditionDeserialized;
      } else {
        throw new Error('Invalid ForLoopStatement: condition is not an Expression node');
      }
    }

    const updateNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'update');
    let update: Expression | undefined = undefined;
    if (updateNode !== undefined) {
      const updateDeserialized = this.deserializeNode(updateNode);
      // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
      if (updateDeserialized.kind === 'Identifier' && isIdentifier(updateDeserialized)) {
        update = NodeFactory.createVariableExpression(updateDeserialized, locationOption);
      } else if (isExpression(updateDeserialized)) {
        update = updateDeserialized;
      } else {
        throw new Error('Invalid ForLoopStatement: update is not an Expression node');
      }
    }

    const bodyNode = JsonDeserializer.getJsonASTNodeProperty(json, 'body');
    const bodyDeserialized = this.deserializeNode(bodyNode);
    if (!isStatement(bodyDeserialized)) {
      throw new Error('Invalid ForLoopStatement: body is not a Statement node');
    }

    return NodeFactory.createForLoopStatement(
      bodyDeserialized,
      init,
      condition,
      update,
      locationOption
    );
  }

  /**
   * Deserializes a WhileLoopStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized WhileLoopStatement node.
   */
  private deserializeWhileLoopStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): WhileLoopStatement {
    const conditionNode = JsonDeserializer.getJsonASTNodeProperty(json, 'condition');
    const conditionDeserialized = this.deserializeNode(conditionNode);
    if (!isExpression(conditionDeserialized)) {
      throw new Error('Invalid WhileLoopStatement: condition is not an Expression node');
    }

    const bodyNode = JsonDeserializer.getJsonASTNodeProperty(json, 'body');
    const bodyDeserialized = this.deserializeNode(bodyNode);
    if (!isStatement(bodyDeserialized)) {
      throw new Error('Invalid WhileLoopStatement: body is not a Statement node');
    }

    return NodeFactory.createWhileLoopStatement(
      conditionDeserialized,
      bodyDeserialized,
      locationOption
    );
  }

  /**
   * Deserializes a ReturnStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ReturnStatement node.
   */
  private deserializeReturnStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ReturnStatement {
    const expressionNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'expression');
    let expression: Expression | undefined = undefined;
    if (expressionNode !== undefined) {
      const expressionDeserialized = this.deserializeNode(expressionNode);
      if (!isExpression(expressionDeserialized)) {
        throw new Error('Invalid ReturnStatement: expression is not an Expression node');
      }
      expression = expressionDeserialized;
    }

    return NodeFactory.createReturnStatement(expression, locationOption);
  }

  /**
   * Deserializes a CompoundStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized CompoundStatement node.
   */
  private deserializeCompoundStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): CompoundStatement {
    const statementsArray = JsonDeserializer.getJsonASTNodeArrayProperty(json, 'statements');

    const statements: Statement[] = [];
    for (const stmtNode of statementsArray) {
      const stmtDeserialized = this.deserializeNode(stmtNode);
      if (!isStatement(stmtDeserialized)) {
        throw new Error('Invalid CompoundStatement: statement is not a Statement node');
      }
      statements.push(stmtDeserialized);
    }

    return NodeFactory.createCompoundStatement(statements, locationOption);
  }

  /**
   * Deserializes an ExpressionStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ExpressionStatement node.
   */
  private deserializeExpressionStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ExpressionStatement {
    const expressionNode = JsonDeserializer.getJsonASTNodeProperty(json, 'expression');
    const deserialized = this.deserializeNode(expressionNode);

    // Convert Identifier to VariableExpression if needed (Identifier is not an Expression)
    const expression: Expression =
      deserialized.kind === 'Identifier' && isIdentifier(deserialized)
        ? NodeFactory.createVariableExpression(deserialized, locationOption)
        : isExpression(deserialized)
          ? deserialized
          : ((): never => {
              throw new Error('Invalid ExpressionStatement: expression is not an Expression node');
            })();

    return NodeFactory.createExpressionStatement(expression, locationOption);
  }

  /**
   * Deserializes a VariableDeclarationStatement.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized VariableDeclarationStatement node.
   */
  private deserializeVariableDeclarationStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): VariableDeclarationStatement {
    const declarationNode = JsonDeserializer.getJsonASTNodeProperty(json, 'declaration');
    const deserialized = this.deserializeNode(declarationNode);
    if (deserialized.kind !== 'VariableDeclaration') {
      throw new Error(
        'Invalid VariableDeclarationStatement: declaration is not a VariableDeclaration node'
      );
    }
    const declaration = deserialized as VariableDeclaration;

    return NodeFactory.createVariableDeclarationStatement(declaration, locationOption);
  }

  /**
   * Deserialize a type reference from JSON.
   * @param typeRefJson - The JSON object representing the type reference.
   * @returns The deserialized type reference.
   */

  // Expression deserialization methods

  /**
   * Deserializes a BinaryExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized BinaryExpression node.
   */
  private deserializeBinaryExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): BinaryExpression {
    const operator = JsonDeserializer.getStringProperty(json, 'operator');
    const validOperators: BinaryExpression['operator'][] = [
      '-',
      '!=',
      '!==',
      '*',
      '/',
      '&',
      '&&',
      '%',
      '^',
      '+',
      '<',
      '<<',
      '<=',
      '==',
      '===',
      '>',
      '>=',
      '>>',
      '>>>',
      '|',
      '||',
      'instanceof',
    ];
    if (!validOperators.includes(operator as BinaryExpression['operator'])) {
      throw new Error(`Invalid binary operator: ${operator}`);
    }

    const leftNode = JsonDeserializer.getJsonASTNodeProperty(json, 'left');
    const leftDeserialized = this.deserializeNode(leftNode);
    if (!isExpression(leftDeserialized)) {
      throw new Error('Invalid BinaryExpression: left is not an Expression node');
    }

    const rightNode = JsonDeserializer.getJsonASTNodeProperty(json, 'right');
    const rightDeserialized = this.deserializeNode(rightNode);
    if (!isExpression(rightDeserialized)) {
      throw new Error('Invalid BinaryExpression: right is not an Expression node');
    }

    return NodeFactory.createBinaryExpression(
      operator as BinaryExpression['operator'],
      leftDeserialized,
      rightDeserialized,
      locationOption
    );
  }

  /**
   * Deserializes a CallExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized CallExpression node.
   */
  private deserializeCallExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): CallExpression {
    const methodName = JsonDeserializer.getStringProperty(json, 'methodName');

    const targetNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'target');
    let target: Expression | undefined = undefined;
    if (targetNode !== undefined) {
      const targetDeserialized = this.deserializeNode(targetNode);
      if (!isExpression(targetDeserialized)) {
        throw new Error('Invalid CallExpression: target is not an Expression node');
      }
      target = targetDeserialized;
    }

    const argsArray = JsonDeserializer.getJsonASTNodeArrayProperty(json, 'arguments');
    const args: Expression[] = [];
    for (const argNode of argsArray) {
      const argDeserialized = this.deserializeNode(argNode);
      if (!isExpression(argDeserialized)) {
        throw new Error('Invalid CallExpression: argument is not an Expression node');
      }
      args.push(argDeserialized);
    }

    const typeArgumentsArray = JsonDeserializer.getOptionalJsonASTNodeProperty(
      json,
      'typeArguments'
    );
    const typeArguments =
      typeArgumentsArray !== undefined && JsonDeserializer.isJsonASTNodeArray(typeArgumentsArray)
        ? typeArgumentsArray.map((type: Readonly<JsonASTNode>) => this.deserializeTypeRef(type))
        : undefined;

    return NodeFactory.createCallExpression(
      methodName,
      args,
      target,
      typeArguments,
      locationOption
    );
  }

  /**
   * Deserializes a FieldExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized FieldExpression node.
   */
  private deserializeFieldExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): FieldExpression {
    const fieldName = JsonDeserializer.getStringProperty(json, 'fieldName');

    const targetNode = JsonDeserializer.getOptionalJsonASTNodeProperty(json, 'target');
    let target: Expression | undefined = undefined;
    if (targetNode !== undefined) {
      const targetDeserialized = this.deserializeNode(targetNode);
      if (!isExpression(targetDeserialized)) {
        throw new Error('Invalid FieldExpression: target is not an Expression node');
      }
      target = targetDeserialized;
    }

    return NodeFactory.createFieldExpression(fieldName, target, locationOption);
  }

  /**
   * Deserializes an ArrayExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ArrayExpression node.
   */
  private deserializeArrayExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ArrayExpression {
    const arrayNode = JsonDeserializer.getJsonASTNodeProperty(json, 'array');
    const arrayDeserialized = this.deserializeNode(arrayNode);
    if (!isExpression(arrayDeserialized)) {
      throw new Error('Invalid ArrayExpression: array is not an Expression node');
    }

    const indexNode = JsonDeserializer.getJsonASTNodeProperty(json, 'index');
    const indexDeserialized = this.deserializeNode(indexNode);
    if (!isExpression(indexDeserialized)) {
      throw new Error('Invalid ArrayExpression: index is not an Expression node');
    }

    return NodeFactory.createArrayExpression(arrayDeserialized, indexDeserialized, locationOption);
  }

  /**
   * Deserializes an AssignExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized AssignExpression node.
   */
  private deserializeAssignExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): AssignExpression {
    const operator = JsonDeserializer.getStringProperty(json, 'operator');
    const validOperators: AssignExpression['operator'][] = [
      '-=',
      '*=',
      '/=',
      '&=',
      '%=',
      '^=',
      '+=',
      '<<=',
      '=',
      '>>=',
      '>>>=',
      '|=',
    ];
    if (!validOperators.includes(operator as AssignExpression['operator'])) {
      throw new Error(`Invalid assign operator: ${operator}`);
    }

    const leftNode = JsonDeserializer.getJsonASTNodeProperty(json, 'left');
    const leftDeserialized = this.deserializeNode(leftNode);
    if (!isExpression(leftDeserialized)) {
      throw new Error('Invalid AssignExpression: left is not an Expression node');
    }

    const rightNode = JsonDeserializer.getJsonASTNodeProperty(json, 'right');
    const rightDeserialized = this.deserializeNode(rightNode);
    if (!isExpression(rightDeserialized)) {
      throw new Error('Invalid AssignExpression: right is not an Expression node');
    }

    return NodeFactory.createAssignExpression(
      operator as AssignExpression['operator'],
      leftDeserialized,
      rightDeserialized,
      locationOption
    );
  }

  /**
   * Deserializes a VariableExpression.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized VariableExpression node.
   */
  private deserializeVariableExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): VariableExpression {
    const idNode = JsonDeserializer.getJsonASTNodeProperty(json, 'id');
    const idDeserialized = this.deserializeNode(idNode);
    if (!isIdentifier(idDeserialized)) {
      throw new Error('Invalid VariableExpression: id is not an Identifier node');
    }

    return NodeFactory.createVariableExpression(idDeserialized, locationOption);
  }

  /**
   * Deserializes an Identifier node.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized Identifier node.
   */
  private deserializeIdentifier(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): Identifier {
    const name = JsonDeserializer.getStringProperty(json, 'name');

    return NodeFactory.createIdentifier(name, locationOption);
  }

  // Literal deserialization methods

  /**
   * Deserializes a StringVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized StringVal node.
   */
  private deserializeStringVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): StringVal {
    const value = JsonDeserializer.getStringProperty(json, 'value');

    const rawValue = json.raw;
    const raw =
      rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
        ? rawValue
        : `"${value}"`;

    return NodeFactory.createStringVal(value, raw, locationOption);
  }

  /**
   * Deserializes an IntegerVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized IntegerVal node.
   */
  private deserializeIntegerVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): IntegerVal {
    const value = JsonDeserializer.getNumberProperty(json, 'value');

    const rawValue = json.raw;
    const raw =
      rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
        ? rawValue
        : String(value);

    return NodeFactory.createIntegerVal(value, raw, locationOption);
  }

  /**
   * Deserializes a DoubleVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized DoubleVal node.
   */
  private deserializeDoubleVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): DoubleVal {
    const value = JsonDeserializer.getNumberProperty(json, 'value');

    const rawValue = json.raw;
    const raw =
      rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
        ? rawValue
        : String(value);

    return NodeFactory.createDoubleVal(value, raw, locationOption);
  }

  /**
   * Deserializes a LongVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized LongVal node.
   */
  private deserializeLongVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): LongVal {
    const value = JsonDeserializer.getNumberProperty(json, 'value');

    const rawValue = json.raw;
    const raw =
      rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
        ? rawValue
        : String(value);

    return NodeFactory.createLongVal(value, raw, locationOption);
  }

  /**
   * Deserializes a DecimalVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized DecimalVal node.
   */
  private deserializeDecimalVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): DecimalVal {
    const value = JsonDeserializer.getNumberProperty(json, 'value');

    const rawValue = json.raw;
    const raw =
      rawValue !== null && rawValue !== undefined && typeof rawValue === 'string'
        ? rawValue
        : String(value);

    return NodeFactory.createDecimalVal(value, raw, locationOption);
  }

  /**
   * Deserializes a BooleanVal literal.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized BooleanVal node.
   */
  private deserializeBooleanVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): BooleanVal {
    const valueProp = json.value;
    if (typeof valueProp !== 'boolean') {
      throw new Error('Invalid JSON AST node: property value is not a boolean');
    }
    const value = valueProp;

    return NodeFactory.createBooleanVal(value, locationOption);
  }

  /**
   * TypeRef deserialization (TypeRef is an AST node in summit-ast).
   * @param typeRefJson - The JSON object representing the TypeRef.
   * @returns The deserialized TypeRef node.
   */
  private deserializeTypeRef(typeRefJson: Readonly<JsonASTNode>): TypeRef {
    return this.deserializeTypeRefNode(typeRefJson);
  }

  /**
   * Deserializes a TypeRef node.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized TypeRef node.
   */
  private deserializeTypeRefNode(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): TypeRef {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const componentsArray = json.components as JsonASTNode[] | undefined;
    const components = (componentsArray ?? []).map((comp: Readonly<JsonASTNode>) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
      args: ((comp as { args?: JsonASTNode[] }).args ?? []).map((arg: Readonly<JsonASTNode>) =>
        this.deserializeTypeRef(arg)
      ),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
      id: this.deserializeNode(comp.id as JsonASTNode) as Identifier,
    }));

    const defaultArrayNesting = 0;

    const arrayNestingValue = json.arrayNesting;
    const arrayNesting =
      arrayNestingValue !== null && arrayNestingValue !== undefined
        ? (arrayNestingValue as number)
        : defaultArrayNesting;

    return NodeFactory.createTypeRef(components, arrayNesting, locationOption);
  }

  /**
   * Deserializes a NewExpression initializer.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @param locationOption.location - The source location for the node.
   * @returns The deserialized NewExpression node.
   */
  private deserializeNewExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): NewExpression {
    const initializerNode = json.initializer as JsonASTNode;
    const initializer = this.deserializeNode(initializerNode) as Initializer;

    return NodeFactory.createNewExpression(initializer, locationOption);
  }

  /**
   * Deserializes a ConstructorInitializer from JSON.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ConstructorInitializer node.
   */
  private deserializeConstructorInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ConstructorInitializer {
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const args =
      json.args !== null && json.args !== undefined
        ? ((json.args as JsonASTNode[]).map((arg: Readonly<JsonASTNode>) =>
            this.deserializeNode(arg)
          ) as Expression[])
        : [];

    return NodeFactory.createConstructorInitializer(type, args, locationOption);
  }

  /**
   * Deserializes a ValuesInitializer from JSON.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized ValuesInitializer node.
   */
  private deserializeValuesInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ValuesInitializer {
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const values =
      json.values !== null && json.values !== undefined
        ? ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
            this.deserializeNode(val)
          ) as Expression[])
        : [];

    return NodeFactory.createValuesInitializer(type, values, locationOption);
  }

  /**
   * Deserializes a SizedArrayInitializer from JSON.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized SizedArrayInitializer node.
   */
  private deserializeSizedArrayInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): SizedArrayInitializer {
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const size = this.deserializeNode(json.size as JsonASTNode) as Expression;

    return NodeFactory.createSizedArrayInitializer(type, size, locationOption);
  }

  /**
   * Deserializes a MapInitializer from JSON.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @returns The deserialized MapInitializer node.
   */
  private deserializeMapInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): MapInitializer {
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const pairs =
      json.pairs !== null && json.pairs !== undefined
        ? (json.pairs as JsonASTNode[]).map((pair: Readonly<JsonASTNode>) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
            const pairObj = pair as { key?: unknown; value?: unknown };
            return {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
              key: this.deserializeNode(pairObj.key as JsonASTNode) as Expression,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
              value: this.deserializeNode(pairObj.value as JsonASTNode) as Expression,
            };
          })
        : [];

    return NodeFactory.createMapInitializer(type, pairs, locationOption);
  }

  /**
   * Deserializes an ExpressionElementValue.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @param locationOption.location - The source location for the node.
   * @returns The deserialized ExpressionElementValue node.
   */
  private deserializeExpressionElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ExpressionElementValue {
    const value = this.deserializeNode(json.value as JsonASTNode) as Expression;
    return NodeFactory.createExpressionElementValue(value, locationOption);
  }

  /**
   * Deserializes an AnnotationElementValue.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @param locationOption.location - The source location for the node.
   * @returns The deserialized AnnotationElementValue node.
   */
  private deserializeAnnotationElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): AnnotationElementValue {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.value as JsonASTNode
    ) as Annotation;
    return NodeFactory.createAnnotationElementValue(value, locationOption);
  }

  /**
   * Deserializes an ArrayElementValue.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @param locationOption.location - The source location for the node.
   * @returns The deserialized ArrayElementValue node.
   */
  private deserializeArrayElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ArrayElementValue {
    const values =
      json.values !== null && json.values !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access returns unknown due to index signature
          ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
            this.deserializeNode(val)
          ) as ElementValue[])
        : [];
    return NodeFactory.createArrayElementValue(values, locationOption);
  }

  /**
   * Deserializes an AnnotationArgument.
   * @param json - The JSON object to deserialize.
   * @param locationOption - Optional source location data for the deserialized node.
   * @param locationOption.location - The source location for the node.
   * @returns The deserialized AnnotationArgument node.
   */
  private deserializeAnnotationArgument(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): AnnotationArgument {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    const name = json.name as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.value as JsonASTNode
    ) as ElementValue;

    const isNameImplicitValue = json.isNameImplicit as boolean | undefined;
    const isNameImplicit = (isNameImplicitValue ?? name === undefined) || name === '';

    return {
      isNameImplicit,
      kind: 'AnnotationArgument',
      location: locationOption?.location,
      name,
      value,
    };
  }

  private deserializeVariableDeclaration(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- JSON deserialization requires mutable object
    json: JsonASTNode,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    locationOption?: { location: SourceRange }
  ): VariableDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    const name = json.name as string;

    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const initializer =
      json.initializer !== null && json.initializer !== undefined && json.initializer !== false
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
            json.initializer as JsonASTNode
          ) as Expression)
        : undefined;

    const modifiers =
      json.modifiers !== null && json.modifiers !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
          (json.modifiers as JsonASTNode[]).map(
            (mod: Readonly<JsonASTNode>) =>
              // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
              this.deserializeNode(mod) as Modifier
          )
        : undefined;

    return NodeFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      modifiers,
      locationOption
    );
  }

  // Modifier deserialization

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeModifier(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): Modifier {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    const keyword = json.keyword as string;
    // Validate keyword is a valid ModifierKeyword
    const validKeywords = [
      'public',
      'private',
      'protected',
      'static',
      'final',
      'abstract',
      'transient',
      'volatile',
      'synchronized',
      'native',
      'strictfp',
      'global',
      'webservice',
      'override',
      'testMethod',
      'future',
      'deprecated',
    ];
    if (!validKeywords.includes(keyword)) {
      throw new Error(`Invalid modifier keyword: ${keyword}`);
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type narrowing to ModifierKeyword
      keyword: keyword as Modifier['keyword'],
      kind: 'Modifier',
      location: locationOption?.location,
    };
  }

  /**
   * Validate JSON node structure.
   * @param _json - The JSON object to validate.
   * @param nodeType - The node type to validate.
   * @throws {Error} If the node type is invalid or missing.
   */
  private validateNode(_json: Readonly<JsonASTNode>, nodeType: string | null): void {
    if (nodeType === null || typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: @type or kind must be a string');
    }
  }
}
