/**
 * @file Factory for creating AST nodes.
 * Provides a unified interface delegating to specialized factory classes.
 */

import type {
  IfStatement,
  ForLoopStatement,
  EnhancedForLoopStatement,
  WhileLoopStatement,
  DoWhileLoopStatement,
  SwitchStatement,
  TryStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  CompoundStatement,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  DmlOperation,
} from '../ast/Statement.js';
import type {
  BinaryExpression,
  UnaryExpression,
  AssignExpression,
  CallExpression,
  FieldExpression,
  ArrayExpression,
  TernaryExpression,
  CastExpression,
  InstanceOfExpression,
  NewExpression,
  LambdaExpression,
  VariableExpression,
  ThisExpression,
  SuperExpression,
  ParenthesizedExpression,
  SoqlExpression,
  SoslExpression,
  TriggerContextVariableExpression,
} from '../ast/Expression.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
} from '../ast/Literal.js';
import type { TypeRef } from '../ast/Type.js';
import type {
  VariableDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  EnumDeclaration,
  EnumValue,
  TypeParameter,
  Modifier,
  Annotation,
} from '../ast/Declaration.js';
import type {
  Initializer,
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
} from '../ast/Initializer.js';
import type { Identifier } from '../ast/Identifier.js';
import type { Expression } from '../ast/Expression.js';
import type { Statement } from '../ast/Statement.js';
import { StatementFactory } from './NodeFactoryStatements.js';
import { ExpressionFactory } from './NodeFactoryExpressions.js';
import { LiteralFactory } from './NodeFactoryLiterals.js';
import { DeclarationFactory } from './NodeFactoryDeclarations.js';
import { InitializerFactory } from './NodeFactoryInitializers.js';
import { ElementValueFactory } from './NodeFactoryElementValues.js';
import { SoqlOrSoslBindingFactory } from './NodeFactorySoqlOrSoslBinding.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

export type { NodeFactoryOptions };

/**
 * Unified factory class for creating AST nodes
 * Delegates to specialized factory classes.
 */
export class NodeFactory {
  /**
   * Statement factories.
   * @param condition
   * @param thenStatement
   * @param elseStatement
   * @param options
   */
  static createIfStatement(
    condition: Expression,
    thenStatement: Statement,
    elseStatement?: Statement,
    options?: NodeFactoryOptions
  ): IfStatement {
    return StatementFactory.createIfStatement(condition, thenStatement, elseStatement, options);
  }

  static createForLoopStatement(
    body: Statement,
    init?: ExpressionStatement | VariableDeclarationStatement,
    condition?: Expression,
    update?: Expression,
    options?: NodeFactoryOptions
  ): ForLoopStatement {
    return StatementFactory.createForLoopStatement(body, init, condition, update, options);
  }

  static createWhileLoopStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return StatementFactory.createWhileLoopStatement(condition, body, options);
  }

  /**
   * @param body
   * @param init
   * @param condition
   * @param update
   * @param options
   * @deprecated Use createForLoopStatement instead.
   */
  static createForStatement(
    body: Statement,
    init?: ExpressionStatement | VariableDeclarationStatement,
    condition?: Expression,
    update?: Expression,
    options?: NodeFactoryOptions
  ): ForLoopStatement {
    return this.createForLoopStatement(body, init, condition, update, options);
  }

  /**
   * @param condition
   * @param body
   * @param options
   * @deprecated Use createWhileLoopStatement instead.
   */
  static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return this.createWhileLoopStatement(condition, body, options);
  }

  static createReturnStatement(
    expression?: Expression,
    options?: NodeFactoryOptions
  ): ReturnStatement {
    return StatementFactory.createReturnStatement(expression, options);
  }

  static createCompoundStatement(
    statements: Statement[],
    options?: NodeFactoryOptions
  ): CompoundStatement {
    return StatementFactory.createCompoundStatement(statements, options);
  }

  /**
   * @param statements
   * @param options
   * @deprecated Use createCompoundStatement instead.
   */
  static createBlock(statements: Statement[], options?: NodeFactoryOptions): CompoundStatement {
    return this.createCompoundStatement(statements, options);
  }

  static createExpressionStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ExpressionStatement {
    return StatementFactory.createExpressionStatement(expression, options);
  }

  static createVariableDeclarationStatement(
    declaration: VariableDeclaration,
    options?: NodeFactoryOptions
  ): VariableDeclarationStatement {
    return StatementFactory.createVariableDeclarationStatement(declaration, options);
  }

  static createEnhancedForLoopStatement(
    variable: VariableDeclaration,
    iterable: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  static createDoWhileLoopStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return StatementFactory.createDoWhileLoopStatement(body, condition, options);
  }

  /**
   * @param variable
   * @param iterable
   * @param body
   * @param options
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  static createForEachStatement(
    variable: VariableDeclaration,
    iterable: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): EnhancedForLoopStatement {
    return this.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * @param body
   * @param condition
   * @param options
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  static createDoWhileStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return this.createDoWhileLoopStatement(body, condition, options);
  }

  static createSwitchStatement(
    expression: Expression,
    cases: any[],
    defaultCase?: any,
    options?: NodeFactoryOptions
  ): SwitchStatement {
    return StatementFactory.createSwitchStatement(expression, cases, defaultCase, options);
  }

  static createTryStatement(
    tryBlock: CompoundStatement,
    catchClauses: any[],
    finallyBlock?: CompoundStatement,
    options?: NodeFactoryOptions
  ): TryStatement {
    return StatementFactory.createTryStatement(tryBlock, catchClauses, finallyBlock, options);
  }

  static createBreakStatement(label?: string, options?: NodeFactoryOptions): BreakStatement {
    return StatementFactory.createBreakStatement(label, options);
  }

  static createContinueStatement(label?: string, options?: NodeFactoryOptions): ContinueStatement {
    return StatementFactory.createContinueStatement(label, options);
  }

  static createThrowStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ThrowStatement {
    return StatementFactory.createThrowStatement(expression, options);
  }

  static createDmlStatement(
    operation: DmlOperation,
    target: Expression,
    options?: NodeFactoryOptions
  ): DmlStatement {
    return StatementFactory.createDmlStatement(operation, target, options);
  }

  /**
   * Expression factories.
   * @param operator
   * @param left
   * @param right
   * @param options
   */
  static createBinaryExpression(
    operator: BinaryExpression['operator'],
    left: Expression,
    right: Expression,
    options?: NodeFactoryOptions
  ): BinaryExpression {
    return ExpressionFactory.createBinaryExpression(operator, left, right, options);
  }

  static createCallExpression(
    methodName: string,
    args: Expression[] = [],
    target?: Expression,
    typeArguments?: TypeRef[],
    options?: NodeFactoryOptions
  ): CallExpression {
    return ExpressionFactory.createCallExpression(methodName, args, target, typeArguments, options);
  }

  static createVariableExpression(
    id: Identifier,
    options?: NodeFactoryOptions
  ): VariableExpression {
    return ExpressionFactory.createVariableExpression(id, options);
  }

  static createIdentifier(name: string, options?: NodeFactoryOptions): Identifier {
    return {
      kind: 'Identifier',
      location: options?.location,
      name,
    };
  }

  /**
   * @param methodName
   * @param args
   * @param target
   * @param typeArguments
   * @param options
   * @deprecated Use createCallExpression instead.
   */
  static createMethodCallExpression(
    methodName: string,
    args: Expression[] = [],
    target?: Expression,
    typeArguments?: TypeRef[],
    options?: NodeFactoryOptions
  ): CallExpression {
    return this.createCallExpression(methodName, args, target, typeArguments, options);
  }

  static createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Expression,
    prefix: boolean,
    options?: NodeFactoryOptions
  ): UnaryExpression {
    return ExpressionFactory.createUnaryExpression(operator, operand, prefix, options);
  }

  static createAssignExpression(
    operator: AssignExpression['operator'],
    left: Expression,
    right: Expression,
    options?: NodeFactoryOptions
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, left, right, options);
  }

  static createFieldExpression(
    fieldName: string,
    target?: Expression,
    options?: NodeFactoryOptions
  ): FieldExpression {
    return ExpressionFactory.createFieldExpression(fieldName, target, options);
  }

  static createArrayExpression(
    array: Expression,
    index: Expression,
    options?: NodeFactoryOptions
  ): ArrayExpression {
    return ExpressionFactory.createArrayExpression(array, index, options);
  }

  /**
   * @param operator
   * @param left
   * @param right
   * @param options
   * @deprecated Use createAssignExpression instead.
   */
  static createAssignmentExpression(
    operator: AssignExpression['operator'],
    left: Expression,
    right: Expression,
    options?: NodeFactoryOptions
  ): AssignExpression {
    return this.createAssignExpression(operator, left, right, options);
  }

  /**
   * @param fieldName
   * @param target
   * @param options
   * @deprecated Use createFieldExpression instead.
   */
  static createFieldAccessExpression(
    fieldName: string,
    target?: Expression,
    options?: NodeFactoryOptions
  ): FieldExpression {
    return this.createFieldExpression(fieldName, target, options);
  }

  /**
   * @param array
   * @param index
   * @param options
   * @deprecated Use createArrayExpression instead.
   */
  static createArrayAccessExpression(
    array: Expression,
    index: Expression,
    options?: NodeFactoryOptions
  ): ArrayExpression {
    return this.createArrayExpression(array, index, options);
  }

  static createTernaryExpression(
    condition: Expression,
    thenExpression: Expression,
    elseExpression: Expression,
    options?: NodeFactoryOptions
  ): TernaryExpression {
    return ExpressionFactory.createTernaryExpression(
      condition,
      thenExpression,
      elseExpression,
      options
    );
  }

  static createCastExpression(
    type: TypeRef,
    expression: Expression,
    options?: NodeFactoryOptions
  ): CastExpression {
    return ExpressionFactory.createCastExpression(type, expression, options);
  }

  static createInstanceOfExpression(
    expression: Expression,
    type: TypeRef,
    options?: NodeFactoryOptions
  ): InstanceOfExpression {
    return ExpressionFactory.createInstanceOfExpression(expression, type, options);
  }

  static createNewExpression(
    initializer: Initializer,
    options?: NodeFactoryOptions
  ): NewExpression {
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  /**
   * Initializer factory methods.
   * @param type
   * @param args
   * @param options
   */
  static createConstructorInitializer(
    type: TypeRef,
    args: Expression[] = [],
    options?: NodeFactoryOptions
  ): ConstructorInitializer {
    return InitializerFactory.createConstructorInitializer(type, args, options);
  }

  static createValuesInitializer(
    type: TypeRef,
    values: Expression[] = [],
    options?: NodeFactoryOptions
  ): ValuesInitializer {
    return InitializerFactory.createValuesInitializer(type, values, options);
  }

  static createSizedArrayInitializer(
    type: TypeRef,
    size: Expression,
    options?: NodeFactoryOptions
  ): SizedArrayInitializer {
    return InitializerFactory.createSizedArrayInitializer(type, size, options);
  }

  static createMapInitializer(
    type: TypeRef,
    pairs: { key: Expression; value: Expression }[],
    options?: NodeFactoryOptions
  ): MapInitializer {
    return InitializerFactory.createMapInitializer(type, pairs, options);
  }

  /**
   * ElementValue factory methods.
   * @param value
   * @param options
   */
  static createExpressionElementValue(
    value: Expression,
    options?: NodeFactoryOptions
  ): import('../ast/ElementValue.js').ExpressionElementValue {
    return ElementValueFactory.createExpressionElementValue(value, options);
  }

  static createAnnotationElementValue(
    value: import('../ast/Declaration.js').Annotation,
    options?: NodeFactoryOptions
  ): import('../ast/ElementValue.js').AnnotationElementValue {
    return ElementValueFactory.createAnnotationElementValue(value, options);
  }

  static createArrayElementValue(
    values: import('../ast/ElementValue.js').ElementValue[],
    options?: NodeFactoryOptions
  ): import('../ast/ElementValue.js').ArrayElementValue {
    return ElementValueFactory.createArrayElementValue(values, options);
  }

  static createNewArrayExpression(
    type: TypeRef,
    size: Expression,
    options?: NodeFactoryOptions
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  static createLambdaExpression(
    parameters: any[],
    body: Expression | Statement,
    options?: NodeFactoryOptions
  ): LambdaExpression {
    return ExpressionFactory.createLambdaExpression(parameters, body, options);
  }

  static createThisExpression(options?: NodeFactoryOptions): ThisExpression {
    return ExpressionFactory.createThisExpression(options);
  }

  static createSuperExpression(options?: NodeFactoryOptions): SuperExpression {
    return ExpressionFactory.createSuperExpression(options);
  }

  static createParenthesizedExpression(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ParenthesizedExpression {
    return ExpressionFactory.createParenthesizedExpression(expression, options);
  }

  static createSoqlExpression(
    query: string,
    bindings: import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: NodeFactoryOptions
  ): SoqlExpression {
    return ExpressionFactory.createSoqlExpression(query, bindings, options);
  }

  static createSoslExpression(
    query: string,
    bindings: import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: NodeFactoryOptions
  ): SoslExpression {
    return ExpressionFactory.createSoslExpression(query, bindings, options);
  }

  static createSoqlOrSoslBinding(
    expr: Expression,
    options?: NodeFactoryOptions
  ): import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding {
    return SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options);
  }

  /**
   * @param query
   * @param boundExpressions
   * @param options
   * @deprecated Use createSoqlExpression instead.
   */
  static createSoqlQueryExpression(
    query: string,
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoqlExpression {
    // Convert boundExpressions to bindings for backward compatibility
    const bindings = (boundExpressions || []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoqlExpression(query, bindings, options);
  }

  /**
   * @param query
   * @param boundExpressions
   * @param options
   * @deprecated Use createSoslExpression instead.
   */
  static createSoslQueryExpression(
    query: string,
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoslExpression {
    // Convert boundExpressions to bindings for backward compatibility
    const bindings = (boundExpressions || []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoslExpression(query, bindings, options);
  }

  static createTriggerContextVariableExpression(
    variableName: string,
    options?: NodeFactoryOptions
  ): TriggerContextVariableExpression {
    return ExpressionFactory.createTriggerContextVariableExpression(variableName, options);
  }

  /**
   * Literal factories.
   * @param value
   * @param raw
   * @param options
   */
  static createStringVal(value: string, raw?: string, options?: NodeFactoryOptions): StringVal {
    return LiteralFactory.createStringVal(value, raw, options);
  }

  static createIntegerVal(value: number, raw?: string, options?: NodeFactoryOptions): IntegerVal {
    return LiteralFactory.createIntegerVal(value, raw, options);
  }

  static createDoubleVal(value: number, raw?: string, options?: NodeFactoryOptions): DoubleVal {
    return LiteralFactory.createDoubleVal(value, raw, options);
  }

  static createLongVal(value: number, raw?: string, options?: NodeFactoryOptions): LongVal {
    return LiteralFactory.createLongVal(value, raw, options);
  }

  static createDecimalVal(value: number, raw?: string, options?: NodeFactoryOptions): DecimalVal {
    return LiteralFactory.createDecimalVal(value, raw, options);
  }

  static createBooleanVal(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return LiteralFactory.createBooleanVal(value, options);
  }

  static createNullVal(options?: NodeFactoryOptions): NullVal {
    return LiteralFactory.createNullVal(options);
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createStringVal instead.
   */
  static createStringLiteral(value: string, raw?: string, options?: NodeFactoryOptions): StringVal {
    return this.createStringVal(value, raw, options);
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */
  static createNumberLiteral(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return this.createIntegerVal(value, raw, options);
  }

  /**
   * @param value
   * @param options
   * @deprecated Use createBooleanVal instead.
   */
  static createBooleanLiteral(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return this.createBooleanVal(value, options);
  }

  /**
   * @param options
   * @deprecated Use createNullVal instead.
   */
  static createNullLiteral(options?: NodeFactoryOptions): NullVal {
    return this.createNullVal(options);
  }

  /**
   * TypeRef creation helpers.
   * In summit-ast, TypeRef extends Node(), so it IS an AST node.
   * @param components
   * @param arrayNesting
   * @param options
   */
  static createTypeRef(
    components: { id: Identifier; args?: TypeRef[] }[],
    arrayNesting = 0,
    options?: NodeFactoryOptions
  ): TypeRef {
    return {
      arrayNesting,
      components: components.map((c) => ({
        args: c.args || [],
        id: c.id,
      })),
      kind: 'TypeRef',
      location: options?.location,
    };
  }

  static createSimpleTypeRef(
    name: string,
    arrayNesting = 0,
    options?: NodeFactoryOptions
  ): TypeRef {
    return {
      arrayNesting,
      components: [
        {
          args: [],
          id: this.createIdentifier(name, options),
        },
      ],
      kind: 'TypeRef',
      location: options?.location,
    };
  }

  /**
   * Declaration factories.
   * @param name
   * @param type
   * @param initializer
   * @param modifiers
   * @param options
   */
  static createVariableDeclaration(
    name: string,
    type: TypeRef,
    initializer?: Expression,
    modifiers?: Modifier[],
    options?: NodeFactoryOptions
  ): VariableDeclaration {
    return DeclarationFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      modifiers,
      options
    );
  }

  static createClassDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: TypeRef,
    implementsClause?: TypeRef[],
    typeParameters?: any[],
    options?: NodeFactoryOptions,
    annotations?: Annotation[]
  ): ClassDeclaration {
    return DeclarationFactory.createClassDeclaration(
      name,
      members,
      modifiers,
      extendsClause,
      implementsClause,
      typeParameters,
      options,
      annotations
    );
  }

  static createInterfaceDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: TypeRef[],
    typeParameters?: any[],
    options?: NodeFactoryOptions
  ): InterfaceDeclaration {
    return DeclarationFactory.createInterfaceDeclaration(
      name,
      members,
      modifiers,
      extendsClause,
      typeParameters,
      options
    );
  }

  static createMethodDeclaration(
    name: string,
    returnType: TypeRef,
    parameters: any[] = [],
    body?: CompoundStatement,
    modifiers: Modifier[] = [],
    typeParameters?: any[],
    annotations?: any[],
    isConstructor = false,
    options?: NodeFactoryOptions
  ): MethodDeclaration {
    return DeclarationFactory.createMethodDeclaration(
      name,
      returnType,
      parameters,
      body,
      modifiers,
      typeParameters,
      annotations,
      isConstructor,
      options
    );
  }

  static createPropertyDeclaration(
    name: string,
    type: TypeRef,
    modifiers: Modifier[] = [],
    getter?: CompoundStatement,
    setter?: CompoundStatement,
    annotations?: any[],
    options?: NodeFactoryOptions
  ): PropertyDeclaration {
    return DeclarationFactory.createPropertyDeclaration(
      name,
      type,
      modifiers,
      getter,
      setter,
      annotations,
      options
    );
  }

  static createEnumDeclaration(
    name: string,
    values: EnumValue[],
    modifiers: Modifier[] = [],
    members?: any[],
    options?: NodeFactoryOptions
  ): EnumDeclaration {
    return DeclarationFactory.createEnumDeclaration(name, values, modifiers, members, options);
  }

  static createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return DeclarationFactory.createEnumValue(id, options);
  }

  static createTypeParameter(
    name: string,
    extendsBound?: TypeRef,
    options?: NodeFactoryOptions
  ): TypeParameter {
    return DeclarationFactory.createTypeParameter(name, extendsBound, options);
  }
}
