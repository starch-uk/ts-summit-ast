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
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type {
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
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
import type { VariableDeclaration } from '../ast/Declaration.js';
import type { Modifier } from '../ast/Declaration.js';
import type { Expression } from '../ast/Expression.js';
import type { Statement } from '../ast/Statement.js';
import type { Identifier } from '../ast/Identifier.js';
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
    this.options = {
      reviver: options.reviver ?? ((_key, value): unknown => value),
      validate: options.validate ?? true,
    };
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
   * @param json
   */
  public deserializeNode(json: Readonly<JsonASTNode>): ASTNode {
    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)

    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)
    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)

    const nodeType =
      '@type' in json &&
      (json['@type'] as unknown) !== null &&
      (json['@type'] as unknown) !== undefined
        ? json['@type']
        : 'kind' in json && json.kind !== null && json.kind !== undefined
          ? (json.kind as string)
          : null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Type guard check
    if (typeof json !== 'object' || json === null || nodeType === null) {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    if (this.options.validate) {
      this.validateNode(json, nodeType);
    }

    const location = this.deserializeLocation(json.location);

    return this.deserializeNodeByKind(json, nodeType, location);
  }

  /**
   * Deserialize source location.
   * @param location
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeLocation(location: unknown): SourceRange | undefined {
    if (location === null || location === undefined || typeof location !== 'object') {
      return undefined;
    }

    const loc = location as {
      start?: { column?: number; line?: number; offset?: number };
      end?: { column?: number; line?: number; offset?: number };
    };

    const defaultLocationValue = 0;
    return {
      end: {
        column: loc.end?.column ?? defaultLocationValue,
        line: loc.end?.line ?? defaultLocationValue,
        offset: loc.end?.offset,
      },
      start: {
        column: loc.start?.column ?? defaultLocationValue,
        line: loc.start?.line ?? defaultLocationValue,
        offset: loc.start?.offset,
      },
    };
  }

  /**
   * Deserialize node based on its kind.
   * @param json
   * @param nodeType
   * @param location
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

  private deserializeIfStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): IfStatement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const thenStatement = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access may be undefined
      (json.thenStatement ?? json.thenBody) as JsonASTNode
    ) as Statement;
    const elseValue = json.elseStatement ?? json.elseBody;
    const elseStatement =
      elseValue !== null && elseValue !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(elseValue as JsonASTNode) as Statement)
        : undefined;

    return NodeFactory.createIfStatement(condition, thenStatement, elseStatement, locationOption);
  }

  private deserializeForLoopStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ForLoopStatement {
    const init =
      json.init !== null && json.init !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.init as JsonASTNode) as Statement)
        : undefined;

    const condition =
      json.condition !== null && json.condition !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.condition as JsonASTNode) as Expression)
        : undefined;

    const update =
      json.update !== null && json.update !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.update as JsonASTNode) as Expression)
        : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createForLoopStatement(
      body,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
      init as ExpressionStatement | VariableDeclarationStatement | undefined,
      condition,
      update,
      locationOption
    );
  }

  private deserializeWhileLoopStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): WhileLoopStatement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createWhileLoopStatement(condition, body, locationOption);
  }

  private deserializeReturnStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ReturnStatement {
    const expression =
      json.expression !== null && json.expression !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.expression as JsonASTNode) as Expression)
        : undefined;

    return NodeFactory.createReturnStatement(expression, locationOption);
  }

  private deserializeCompoundStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): CompoundStatement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const statements = (json.statements as JsonASTNode[]).map(
      (stmt: Readonly<JsonASTNode>) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
        this.deserializeNode(stmt) as Statement
    );

    return NodeFactory.createCompoundStatement(statements, locationOption);
  }

  private deserializeExpressionStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ExpressionStatement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const expression = this.deserializeNode(json.expression as JsonASTNode) as Expression;

    return NodeFactory.createExpressionStatement(expression, locationOption);
  }

  private deserializeVariableDeclarationStatement(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): VariableDeclarationStatement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const declaration = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.declaration as JsonASTNode
    ) as VariableDeclaration;

    return NodeFactory.createVariableDeclarationStatement(declaration, locationOption);
  }

  // Expression deserialization methods

  private deserializeBinaryExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): BinaryExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const operator = json.operator as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const left = this.deserializeNode(json.left as JsonASTNode) as Expression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const right = this.deserializeNode(json.right as JsonASTNode) as Expression;

    return NodeFactory.createBinaryExpression(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
      operator as BinaryExpression['operator'],
      left,
      right,
      locationOption
    );
  }

  private deserializeCallExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): CallExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const methodName = json.methodName as string;

    const target =
      json.target !== null && json.target !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.target as JsonASTNode) as Expression)
        : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const args = (json.arguments as JsonASTNode[]).map(
      (arg: Readonly<JsonASTNode>) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
        this.deserializeNode(arg) as Expression
    );

    const typeArguments =
      json.typeArguments !== null && json.typeArguments !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (json.typeArguments as JsonASTNode[]).map((type: Readonly<JsonASTNode>) =>
            this.deserializeTypeRef(type)
          )
        : undefined;

    return NodeFactory.createCallExpression(
      methodName,
      args,
      target,
      typeArguments,
      locationOption
    );
  }

  private deserializeFieldExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): FieldExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const fieldName = json.fieldName as string;

    const target =
      json.target !== null && json.target !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
          (this.deserializeNode(json.target as JsonASTNode) as Expression)
        : undefined;

    return NodeFactory.createFieldExpression(fieldName, target, locationOption);
  }

  private deserializeArrayExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ArrayExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const array = this.deserializeNode(json.array as JsonASTNode) as Expression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const index = this.deserializeNode(json.index as JsonASTNode) as Expression;

    return NodeFactory.createArrayExpression(array, index, locationOption);
  }

  private deserializeAssignExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): AssignExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const operator = json.operator as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const left = this.deserializeNode(json.left as JsonASTNode) as Expression;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const right = this.deserializeNode(json.right as JsonASTNode) as Expression;

    return NodeFactory.createAssignExpression(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
      operator as AssignExpression['operator'],
      left,
      right,
      locationOption
    );
  }

  private deserializeVariableExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): VariableExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const id = this.deserializeNode(json.id as JsonASTNode) as Identifier;

    return NodeFactory.createVariableExpression(id, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeIdentifier(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): Identifier {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const name = json.name as string;

    return NodeFactory.createIdentifier(name, locationOption);
  }

  // Literal deserialization methods

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeStringVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): StringVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions, raw can be undefined
    const raw = json.raw !== null && json.raw !== undefined ? (json.raw as string) : `"${value}"`;

    return NodeFactory.createStringVal(value, raw, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeIntegerVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): IntegerVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions, raw can be undefined
    const raw = json.raw !== null && json.raw !== undefined ? (json.raw as string) : String(value);

    return NodeFactory.createIntegerVal(value, raw, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeDoubleVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): DoubleVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions, raw can be undefined
    const raw = json.raw !== null && json.raw !== undefined ? (json.raw as string) : String(value);

    return NodeFactory.createDoubleVal(value, raw, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeLongVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): LongVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions, raw can be undefined
    const raw = json.raw !== null && json.raw !== undefined ? (json.raw as string) : String(value);

    return NodeFactory.createLongVal(value, raw, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeDecimalVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): DecimalVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as number;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions, raw can be undefined
    const raw = json.raw !== null && json.raw !== undefined ? (json.raw as string) : String(value);

    return NodeFactory.createDecimalVal(value, raw, locationOption);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private deserializeBooleanVal(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): BooleanVal {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = json.value as boolean;

    return NodeFactory.createBooleanVal(value, locationOption);
  }

  /**
   * TypeRef deserialization (TypeRef is an AST node in summit-ast).
   * @param typeRefJson
   */
  private deserializeTypeRef(typeRefJson: Readonly<JsonASTNode>): TypeRef {
    return this.deserializeTypeRefNode(typeRefJson);
  }

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

    const arrayNesting =
      json.arrayNesting !== null && json.arrayNesting !== undefined
        ? (json.arrayNesting as number)
        : defaultArrayNesting;

    return NodeFactory.createTypeRef(components, arrayNesting, locationOption);
  }

  /**
   * Initializer deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeNewExpression(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): NewExpression {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const initializer = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.initializer as JsonASTNode
    ) as import('../ast/Initializer.js').Initializer;

    return NodeFactory.createNewExpression(initializer, locationOption);
  }

  private deserializeConstructorInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ConstructorInitializer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const args =
      json.args !== null && json.args !== undefined
        ? ((json.args as JsonASTNode[]).map((arg: Readonly<JsonASTNode>) =>
            this.deserializeNode(arg)
          ) as Expression[])
        : [];

    return NodeFactory.createConstructorInitializer(type, args, locationOption);
  }

  private deserializeValuesInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ValuesInitializer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const type = this.deserializeTypeRef(json.type as JsonASTNode);

    const values =
      json.values !== null && json.values !== undefined
        ? ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
            this.deserializeNode(val)
          ) as Expression[])
        : [];

    return NodeFactory.createValuesInitializer(type, values, locationOption);
  }

  private deserializeSizedArrayInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): SizedArrayInitializer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const type = this.deserializeTypeRef(json.type as JsonASTNode);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const size = this.deserializeNode(json.size as JsonASTNode) as Expression;

    return NodeFactory.createSizedArrayInitializer(type, size, locationOption);
  }

  private deserializeMapInitializer(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): MapInitializer {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
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
   * ElementValue deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeExpressionElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ExpressionElementValue {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = this.deserializeNode(json.value as JsonASTNode) as Expression;
    return NodeFactory.createExpressionElementValue(value, locationOption);
  }

  private deserializeAnnotationElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): AnnotationElementValue {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.value as JsonASTNode
    ) as import('../ast/Declaration.js').Annotation;
    return NodeFactory.createAnnotationElementValue(value, locationOption);
  }

  private deserializeArrayElementValue(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): ArrayElementValue {
    const values =
      json.values !== null && json.values !== undefined
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
          ((json.values as JsonASTNode[]).map((val: Readonly<JsonASTNode>) =>
            this.deserializeNode(val)
          ) as import('../ast/ElementValue.js').ElementValue[])
        : [];
    return NodeFactory.createArrayElementValue(values, locationOption);
  }

  /**
   * Declaration deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeAnnotationArgument(
    json: Readonly<JsonASTNode>,
    locationOption?: Readonly<{ location: SourceRange }>
  ): import('../ast/Declaration.js').AnnotationArgument {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
    const name = json.name as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON deserialization requires type assertions
    const value = this.deserializeNode(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
      json.value as JsonASTNode
    ) as import('../ast/ElementValue.js').ElementValue;

    const isNameImplicit =
      (json.isNameImplicit as boolean) ?? (name === null || name === undefined || name === '');

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON property access
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
   * @param json
   * @param _json
   * @param nodeType
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- Utility method that may be used as instance method
  private validateNode(_json: Readonly<JsonASTNode>, nodeType: string | null): void {
    if (nodeType === null || typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: @type or kind must be a string');
    }
  }
}
