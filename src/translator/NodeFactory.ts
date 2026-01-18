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
  ClassMember,
  InterfaceMember,
  Parameter,
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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class NodeFactory {
  /**
   * Create an if statement node.
   * @param condition - The condition expression.
   * @param thenStatement - The then statement.
   * @param elseStatement - The else statement (optional).
   * @param options - Additional options.
   * @returns The created IfStatement node.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- If statement requires 4 parameters
  public static createIfStatement(
    condition: Readonly<Expression>,
    thenStatement: Readonly<Statement>,
    elseStatement?: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): IfStatement {
    return StatementFactory.createIfStatement(condition, thenStatement, elseStatement, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- For loop statement requires 5 parameters
  public static createForLoopStatement(
    body: Readonly<Statement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Union type parameter
    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return StatementFactory.createForLoopStatement(body, init, condition, update, options);
  }

  public static createWhileLoopStatement(
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
  // eslint-disable-next-line @typescript-eslint/max-params -- For statement requires 5 parameters
  public static createForStatement(
    body: Readonly<Statement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Union type parameter
    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return this.createForLoopStatement(body, init, condition, update, options);
  }

  /**
   * @param condition
   * @param body
   * @param options
   * @deprecated Use createWhileLoopStatement instead.
   */
  public static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return this.createWhileLoopStatement(condition, body, options);
  }

  public static createReturnStatement(
    expression?: Expression,
    options?: NodeFactoryOptions
  ): ReturnStatement {
    return StatementFactory.createReturnStatement(expression, options);
  }

  public static createCompoundStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return StatementFactory.createCompoundStatement([...statements], options);
  }

  /**
   * @param statements
   * @param options
   * @deprecated Use createCompoundStatement instead.
   */
  public static createBlock(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return this.createCompoundStatement(statements, options);
  }

  public static createExpressionStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionStatement {
    return StatementFactory.createExpressionStatement(expression, options);
  }

  public static createVariableDeclarationStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    declaration: Readonly<VariableDeclaration>,
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclarationStatement {
    return StatementFactory.createVariableDeclarationStatement(declaration, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Enhanced for loop statement requires 4 parameters
  public static createEnhancedForLoopStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  public static createDoWhileLoopStatement(
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
  // eslint-disable-next-line @typescript-eslint/max-params -- ForEach statement requires 4 parameters
  public static createForEachStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return this.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * @param body
   * @param condition
   * @param options
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  public static createDoWhileStatement(
    body: Readonly<Statement>,
    condition: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return this.createDoWhileLoopStatement(body, condition, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Switch statement requires 4 parameters
  public static createSwitchStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    expression: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    cases: readonly import('../ast/Statement.js').SwitchCase[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    defaultCase?: Readonly<import('../ast/Statement.js').SwitchCase>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): SwitchStatement {
    return StatementFactory.createSwitchStatement(expression, [...cases], defaultCase, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Try statement requires 4 parameters
  public static createTryStatement(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    tryBlock: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    catchClauses: readonly import('../ast/Statement.js').CatchClause[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    finallyBlock?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): TryStatement {
    return StatementFactory.createTryStatement(tryBlock, [...catchClauses], finallyBlock, options);
  }

  public static createBreakStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): BreakStatement {
    return StatementFactory.createBreakStatement(label, options);
  }

  public static createContinueStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): ContinueStatement {
    return StatementFactory.createContinueStatement(label, options);
  }

  public static createThrowStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ThrowStatement {
    return StatementFactory.createThrowStatement(expression, options);
  }

  public static createDmlStatement(
    operation: DmlOperation,
    target: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
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
  // eslint-disable-next-line @typescript-eslint/max-params -- Binary expression requires 4 parameters
  public static createBinaryExpression(
    operator: BinaryExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): BinaryExpression {
    return ExpressionFactory.createBinaryExpression(operator, left, right, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Call expression requires 5 parameters
  public static createCallExpression(
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return ExpressionFactory.createCallExpression(methodName, args, target, typeArguments, options);
  }

  public static createVariableExpression(
    id: Identifier,
    options?: NodeFactoryOptions
  ): VariableExpression {
    return ExpressionFactory.createVariableExpression(id, options);
  }

  public static createIdentifier(name: string, options?: NodeFactoryOptions): Identifier {
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
  // eslint-disable-next-line @typescript-eslint/max-params -- Method call expression requires 5 parameters
  public static createMethodCallExpression(
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return this.createCallExpression(methodName, args, target, typeArguments, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Unary expression requires 4 parameters
  public static createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Readonly<Expression>,
    prefix: boolean,
    options?: Readonly<NodeFactoryOptions>
  ): UnaryExpression {
    return ExpressionFactory.createUnaryExpression(operator, operand, prefix, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Assign expression requires 4 parameters
  public static createAssignExpression(
    operator: AssignExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, left, right, options);
  }

  public static createFieldExpression(
    fieldName: string,
    target?: Expression,
    options?: NodeFactoryOptions
  ): FieldExpression {
    return ExpressionFactory.createFieldExpression(fieldName, target, options);
  }

  public static createArrayExpression(
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
  // eslint-disable-next-line @typescript-eslint/max-params -- Assignment expression requires 4 parameters
  public static createAssignmentExpression(
    operator: AssignExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): AssignExpression {
    return this.createAssignExpression(operator, left, right, options);
  }

  /**
   * @param fieldName
   * @param target
   * @param options
   * @deprecated Use createFieldExpression instead.
   */
  public static createFieldAccessExpression(
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
  public static createArrayAccessExpression(
    array: Expression,
    index: Expression,
    options?: NodeFactoryOptions
  ): ArrayExpression {
    return this.createArrayExpression(array, index, options);
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Ternary expression requires 4 parameters
  public static createTernaryExpression(
    condition: Readonly<Expression>,
    thenExpression: Readonly<Expression>,
    elseExpression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): TernaryExpression {
    return ExpressionFactory.createTernaryExpression(
      condition,
      thenExpression,
      elseExpression,
      options
    );
  }

  public static createCastExpression(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    expression: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return ExpressionFactory.createCastExpression(type, expression, options);
  }

  public static createInstanceOfExpression(
    expression: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): InstanceOfExpression {
    return ExpressionFactory.createInstanceOfExpression(expression, type, options);
  }

  public static createNewExpression(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    initializer: Readonly<Initializer>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  /**
   * Initializer factory methods.
   * @param type
   * @param args
   * @param options
   */
  public static createConstructorInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    args: readonly Expression[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): ConstructorInitializer {
    return InitializerFactory.createConstructorInitializer(type, args, options);
  }

  public static createValuesInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    values: readonly Expression[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return InitializerFactory.createValuesInitializer(type, [...values], options);
  }

  public static createSizedArrayInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    size: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return InitializerFactory.createSizedArrayInitializer(type, size, options);
  }

  public static createMapInitializer(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    pairs: readonly { key: Expression; value: Expression }[],
    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return InitializerFactory.createMapInitializer(type, [...pairs], options);
  }

  /**
   * ElementValue factory methods.
   * @param value
   * @param options
   */
  public static createExpressionElementValue(
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): import('../ast/ElementValue.js').ExpressionElementValue {
    return ElementValueFactory.createExpressionElementValue(value, options);
  }

  public static createAnnotationElementValue(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    value: Readonly<import('../ast/Declaration.js').Annotation>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): import('../ast/ElementValue.js').AnnotationElementValue {
    return ElementValueFactory.createAnnotationElementValue(value, options);
  }

  public static createArrayElementValue(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    values: readonly import('../ast/ElementValue.js').ElementValue[],
    options?: Readonly<NodeFactoryOptions>
  ): import('../ast/ElementValue.js').ArrayElementValue {
    return ElementValueFactory.createArrayElementValue([...values], options);
  }

  public static createNewArrayExpression(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    size: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  public static createLambdaExpression(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    parameters: readonly import('../ast/Expression.js').LambdaParameter[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    body: Readonly<Expression | Statement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): LambdaExpression {
    return ExpressionFactory.createLambdaExpression(parameters, body, options);
  }

  public static createThisExpression(options?: NodeFactoryOptions): ThisExpression {
    return ExpressionFactory.createThisExpression(options);
  }

  public static createSuperExpression(options?: NodeFactoryOptions): SuperExpression {
    return ExpressionFactory.createSuperExpression(options);
  }

  public static createParenthesizedExpression(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ParenthesizedExpression {
    return ExpressionFactory.createParenthesizedExpression(expression, options);
  }

  public static createSoqlExpression(
    query: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    bindings: readonly import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    return ExpressionFactory.createSoqlExpression(query, [...bindings], options);
  }

  public static createSoslExpression(
    query: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    bindings: readonly import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    return ExpressionFactory.createSoslExpression(query, [...bindings], options);
  }

  public static createSoqlOrSoslBinding(
    expr: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding {
    return SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options);
  }

  /**
   * @param query
   * @param boundExpressions
   * @param options
   * @deprecated Use createSoqlExpression instead.
   */
  public static createSoqlQueryExpression(
    query: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    // Convert boundExpressions to bindings for backward compatibility
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Use nullish coalescing for undefined check
    const bindings = (boundExpressions ?? []).map((expr) =>
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
  public static createSoslQueryExpression(
    query: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    // Convert boundExpressions to bindings for backward compatibility
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Use nullish coalescing for undefined check
    const bindings = (boundExpressions ?? []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoslExpression(query, bindings, options);
  }

  public static createTriggerContextVariableExpression(
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
  public static createStringVal(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringVal {
    return LiteralFactory.createStringVal(value, raw, options);
  }

  public static createIntegerVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return LiteralFactory.createIntegerVal(value, raw, options);
  }

  public static createDoubleVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DoubleVal {
    return LiteralFactory.createDoubleVal(value, raw, options);
  }

  public static createLongVal(value: number, raw?: string, options?: NodeFactoryOptions): LongVal {
    return LiteralFactory.createLongVal(value, raw, options);
  }

  public static createDecimalVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DecimalVal {
    return LiteralFactory.createDecimalVal(value, raw, options);
  }

  public static createBooleanVal(
    value: boolean,
    options?: Readonly<NodeFactoryOptions>
  ): BooleanVal {
    return LiteralFactory.createBooleanVal(value, options);
  }

  public static createNullVal(options?: Readonly<NodeFactoryOptions>): NullVal {
    return LiteralFactory.createNullVal(options);
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createStringVal instead.
   */
  public static createStringLiteral(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringVal {
    return this.createStringVal(value, raw, options);
  }

  /**
   * @param value
   * @param raw
   * @param options
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */
  public static createNumberLiteral(
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
  public static createBooleanLiteral(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return this.createBooleanVal(value, options);
  }

  /**
   * @param options
   * @deprecated Use createNullVal instead.
   */
  public static createNullLiteral(options?: Readonly<NodeFactoryOptions>): NullVal {
    return this.createNullVal(options);
  }

  /**
   * TypeRef creation helpers.
   * In summit-ast, TypeRef extends Node(), so it IS an AST node.
   * @param components
   * @param arrayNesting
   * @param options
   */
  public static createTypeRef(
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    components: readonly { id: Identifier; args?: TypeRef[] }[],
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Default array nesting
    arrayNesting = 0,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    return {
      arrayNesting,
      // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array method callback parameter
      components: components.map((c) => ({
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Default to empty array
        args: c.args ?? [],
        id: c.id,
      })),
      kind: 'TypeRef',
      location: options?.location,
    };
  }

  public static createSimpleTypeRef(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Default array nesting
    arrayNesting = 0,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
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
  // eslint-disable-next-line @typescript-eslint/max-params -- Variable declaration requires 5 parameters
  public static createVariableDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    initializer?: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers?: readonly Modifier[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclaration {
    return DeclarationFactory.createVariableDeclaration(
      name,
      type,
      initializer,
      modifiers,
      options
    );
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Class declaration requires 8 parameters
  public static createClassDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    members: readonly ClassMember[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    extendsClause?: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    implementsClause?: readonly TypeRef[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeParameters?: readonly TypeParameter[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    annotations?: readonly Annotation[]
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Interface declaration requires 6 parameters
  public static createInterfaceDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-explicit-any -- Array parameter, any type from Declaration.ts
    members: readonly InterfaceMember[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    extendsClause?: readonly TypeRef[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-explicit-any -- Array parameter, any type from Declaration.ts
    typeParameters?: readonly TypeParameter[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Method declaration requires 9 parameters
  public static createMethodDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    returnType: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    parameters: readonly Parameter[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    body?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-explicit-any -- Array parameter, any type from Declaration.ts
    typeParameters?: readonly TypeParameter[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types, @typescript-eslint/no-explicit-any -- Array parameter, any type from Declaration.ts
    annotations?: readonly Annotation[],
    isConstructor = false,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Property declaration requires 7 parameters
  public static createPropertyDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    getter?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    setter?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    annotations?: readonly import('../ast/Declaration.js').Annotation[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Enum declaration requires 5 parameters
  public static createEnumDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    values: readonly EnumValue[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    members?: readonly ClassMember[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): EnumDeclaration {
    return DeclarationFactory.createEnumDeclaration(name, values, modifiers, members, options);
  }

  public static createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return DeclarationFactory.createEnumValue(id, options);
  }

  public static createTypeParameter(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    extendsBound?: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): TypeParameter {
    return DeclarationFactory.createTypeParameter(name, extendsBound, options);
  }
}
