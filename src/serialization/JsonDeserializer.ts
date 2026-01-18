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
  CallExpression,
  NewExpression,
  VariableExpression,
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

  constructor(options: DeserializationOptions = {}) {
    this.options = {
      reviver: options.reviver ?? ((_key, value) => value),
      validate: options.validate ?? true,
    };
  }

  /**
   * Deserialize JSON string to AST node.
   * @param json
   */
  deserialize(json: string): ASTNode {
    const parsed = JSON.parse(json, this.options.reviver);
    return this.deserializeNode(parsed);
  }

  /**
   * Deserialize JSON object to AST node.
   * @param json
   */
  deserializeNode(json: JsonASTNode): ASTNode {
    // Support both '@type' (summit-ast format) and 'kind' (backward compatibility)
    const nodeType = (
      '@type' in json && json['@type']
        ? json['@type']
        : 'kind' in json && json.kind
          ? json.kind
          : null
    ) as string | null;
    if (!json || typeof json !== 'object' || !nodeType) {
      throw new Error('Invalid JSON AST node: missing @type or kind property');
    }

    if (this.options.validate) {
      this.validateNode(json, nodeType);
    }

    const location = this.deserializeLocation(json.location as any);

    return this.deserializeNodeByKind(json, nodeType, location);
  }

  /**
   * Deserialize source location.
   * @param location
   */
  private deserializeLocation(location: any): SourceRange | undefined {
    if (!location) {
      return undefined;
    }

    return {
      end: {
        column: location.end?.column ?? 0,
        line: location.end?.line ?? 0,
        offset: location.end?.offset,
      },
      start: {
        column: location.start?.column ?? 0,
        line: location.start?.line ?? 0,
        offset: location.start?.offset,
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
    json: JsonASTNode,
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
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): IfStatement {
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    const thenStatement = this.deserializeNode(
      (json.thenStatement || json.thenBody) as JsonASTNode
    ) as Statement;
    const elseStatement =
      json.elseStatement || json.elseBody
        ? (this.deserializeNode((json.elseStatement || json.elseBody) as JsonASTNode) as Statement)
        : undefined;

    return NodeFactory.createIfStatement(condition, thenStatement, elseStatement, locationOption);
  }

  private deserializeForLoopStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ForLoopStatement {
    const init = json.init
      ? (this.deserializeNode(json.init as JsonASTNode) as Statement)
      : undefined;
    const condition = json.condition
      ? (this.deserializeNode(json.condition as JsonASTNode) as Expression)
      : undefined;
    const update = json.update
      ? (this.deserializeNode(json.update as JsonASTNode) as Expression)
      : undefined;
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createForLoopStatement(body, init as any, condition, update, locationOption);
  }

  private deserializeWhileLoopStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): WhileLoopStatement {
    const condition = this.deserializeNode(json.condition as JsonASTNode) as Expression;
    const body = this.deserializeNode(json.body as JsonASTNode) as Statement;

    return NodeFactory.createWhileLoopStatement(condition, body, locationOption);
  }

  private deserializeReturnStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ReturnStatement {
    const expression = json.expression
      ? (this.deserializeNode(json.expression as JsonASTNode) as Expression)
      : undefined;

    return NodeFactory.createReturnStatement(expression, locationOption);
  }

  private deserializeCompoundStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): CompoundStatement {
    const statements = (json.statements as JsonASTNode[]).map(
      (stmt) => this.deserializeNode(stmt) as Statement
    );

    return NodeFactory.createCompoundStatement(statements, locationOption);
  }

  private deserializeExpressionStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ExpressionStatement {
    const expression = this.deserializeNode(json.expression as JsonASTNode) as Expression;

    return NodeFactory.createExpressionStatement(expression, locationOption);
  }

  private deserializeVariableDeclarationStatement(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): VariableDeclarationStatement {
    const declaration = this.deserializeNode(
      json.declaration as JsonASTNode
    ) as VariableDeclaration;

    return NodeFactory.createVariableDeclarationStatement(declaration, locationOption);
  }

  // Expression deserialization methods

  private deserializeBinaryExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): BinaryExpression {
    const operator = json.operator as string;
    const left = this.deserializeNode(json.left as JsonASTNode) as Expression;
    const right = this.deserializeNode(json.right as JsonASTNode) as Expression;

    return NodeFactory.createBinaryExpression(operator as any, left, right, locationOption);
  }

  private deserializeCallExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): CallExpression {
    const methodName = json.methodName as string;
    const target = json.target
      ? (this.deserializeNode(json.target as JsonASTNode) as Expression)
      : undefined;
    const args = (json.arguments as JsonASTNode[]).map(
      (arg) => this.deserializeNode(arg) as Expression
    );
    const typeArguments = json.typeArguments
      ? (json.typeArguments as any[]).map((type) => this.deserializeTypeRef(type))
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
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): any {
    const fieldName = json.fieldName as string;
    const target = json.target
      ? (this.deserializeNode(json.target as JsonASTNode) as Expression)
      : undefined;

    return NodeFactory.createFieldExpression(fieldName, target, locationOption);
  }

  private deserializeArrayExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): any {
    const array = this.deserializeNode(json.array as JsonASTNode) as Expression;
    const index = this.deserializeNode(json.index as JsonASTNode) as Expression;

    return NodeFactory.createArrayExpression(array, index, locationOption);
  }

  private deserializeAssignExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): any {
    const operator = json.operator as string;
    const left = this.deserializeNode(json.left as JsonASTNode) as Expression;
    const right = this.deserializeNode(json.right as JsonASTNode) as Expression;

    return NodeFactory.createAssignExpression(operator as any, left, right, locationOption);
  }

  private deserializeVariableExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): VariableExpression {
    const id = this.deserializeNode(json.id as JsonASTNode) as Identifier;

    return NodeFactory.createVariableExpression(id, locationOption);
  }

  private deserializeIdentifier(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): Identifier {
    const name = json.name as string;

    return NodeFactory.createIdentifier(name, locationOption);
  }

  // Literal deserialization methods

  private deserializeStringVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): StringVal {
    const value = json.value as string;
    const raw = (json.raw as string) || `"${value}"`;

    return NodeFactory.createStringVal(value, raw, locationOption);
  }

  private deserializeIntegerVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): IntegerVal {
    const value = json.value as number;
    const raw = (json.raw as string) || String(value);

    return NodeFactory.createIntegerVal(value, raw, locationOption);
  }

  private deserializeDoubleVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): DoubleVal {
    const value = json.value as number;
    const raw = (json.raw as string) || String(value);

    return NodeFactory.createDoubleVal(value, raw, locationOption);
  }

  private deserializeLongVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): LongVal {
    const value = json.value as number;
    const raw = (json.raw as string) || String(value);

    return NodeFactory.createLongVal(value, raw, locationOption);
  }

  private deserializeDecimalVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): DecimalVal {
    const value = json.value as number;
    const raw = (json.raw as string) || String(value);

    return NodeFactory.createDecimalVal(value, raw, locationOption);
  }

  private deserializeBooleanVal(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): BooleanVal {
    const value = json.value as boolean;

    return NodeFactory.createBooleanVal(value, locationOption);
  }

  /**
   * TypeRef deserialization (TypeRef is an AST node in summit-ast).
   * @param typeRefJson
   */
  private deserializeTypeRef(typeRefJson: any): TypeRef {
    return this.deserializeTypeRefNode(typeRefJson);
  }

  private deserializeTypeRefNode(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): TypeRef {
    const componentsArray = json.components as any[] | undefined;
    const components = (componentsArray || []).map((comp: any) => ({
      args: (comp.args || []).map((arg: any) => this.deserializeTypeRef(arg)),
      id: this.deserializeNode(comp.id) as Identifier,
    }));
    const arrayNesting = (json.arrayNesting as number) || 0;

    return NodeFactory.createTypeRef(components, arrayNesting, locationOption);
  }

  /**
   * Initializer deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeNewExpression(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): NewExpression {
    const initializer = this.deserializeNode(
      json.initializer as JsonASTNode
    ) as import('../ast/Initializer.js').Initializer;

    return NodeFactory.createNewExpression(initializer, locationOption);
  }

  private deserializeConstructorInitializer(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ConstructorInitializer {
    const type = this.deserializeTypeRef(json.type as any);
    const args = ((json.args as any[]) || []).map((arg) =>
      this.deserializeNode(arg as JsonASTNode)
    ) as Expression[];

    return NodeFactory.createConstructorInitializer(type, args, locationOption);
  }

  private deserializeValuesInitializer(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ValuesInitializer {
    const type = this.deserializeTypeRef(json.type as any);
    const values = ((json.values as any[]) || []).map((val) =>
      this.deserializeNode(val as JsonASTNode)
    ) as Expression[];

    return NodeFactory.createValuesInitializer(type, values, locationOption);
  }

  private deserializeSizedArrayInitializer(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): SizedArrayInitializer {
    const type = this.deserializeTypeRef(json.type as any);
    const size = this.deserializeNode(json.size as JsonASTNode) as Expression;

    return NodeFactory.createSizedArrayInitializer(type, size, locationOption);
  }

  private deserializeMapInitializer(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): MapInitializer {
    const type = this.deserializeTypeRef(json.type as any);
    const pairs = ((json.pairs as any[]) || []).map((pair) => ({
      key: this.deserializeNode(pair.key as JsonASTNode) as Expression,
      value: this.deserializeNode(pair.value as JsonASTNode) as Expression,
    }));

    return NodeFactory.createMapInitializer(type, pairs, locationOption);
  }

  /**
   * ElementValue deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeExpressionElementValue(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ExpressionElementValue {
    const value = this.deserializeNode(json.value as JsonASTNode) as Expression;
    return NodeFactory.createExpressionElementValue(value, locationOption);
  }

  private deserializeAnnotationElementValue(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): AnnotationElementValue {
    const value = this.deserializeNode(
      json.value as JsonASTNode
    ) as import('../ast/Declaration.js').Annotation;
    return NodeFactory.createAnnotationElementValue(value, locationOption);
  }

  private deserializeArrayElementValue(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): ArrayElementValue {
    const values = ((json.values as any[]) || []).map((val) =>
      this.deserializeNode(val as JsonASTNode)
    ) as import('../ast/ElementValue.js').ElementValue[];
    return NodeFactory.createArrayElementValue(values, locationOption);
  }

  /**
   * Declaration deserialization methods.
   * @param json
   * @param locationOption
   * @param locationOption.location
   */
  private deserializeAnnotationArgument(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): import('../ast/Declaration.js').AnnotationArgument {
    const name = json.name as string | undefined;
    const value = this.deserializeNode(
      json.value as JsonASTNode
    ) as import('../ast/ElementValue.js').ElementValue;
    const isNameImplicit = (json.isNameImplicit as boolean) || !name;

    return {
      isNameImplicit,
      kind: 'AnnotationArgument',
      location: locationOption?.location,
      name,
      value,
    };
  }

  private deserializeVariableDeclaration(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): VariableDeclaration {
    const name = json.name as string;
    const type = this.deserializeTypeRef(json.type as any);
    const initializer = json.initializer
      ? (this.deserializeNode(json.initializer as JsonASTNode) as Expression)
      : undefined;
    const modifiers = json.modifiers
      ? (json.modifiers as JsonASTNode[]).map((mod) => this.deserializeNode(mod) as Modifier)
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

  private deserializeModifier(
    json: JsonASTNode,
    locationOption?: { location: SourceRange }
  ): Modifier {
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
  private validateNode(_json: JsonASTNode, nodeType: string | null): void {
    if (!nodeType || typeof nodeType !== 'string') {
      throw new Error('Invalid JSON AST node: @type or kind must be a string');
    }
  }
}
