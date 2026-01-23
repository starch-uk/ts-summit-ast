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
  SwitchCase,
  CatchClause,
} from '../ast/statement.js';
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
  LambdaParameter,
  VariableExpression,
  ThisExpression,
  SuperExpression,
  ParenthesizedExpression,
  SoqlExpression,
  SoslExpression,
  TriggerContextVariableExpression,
} from '../ast/expression.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
} from '../ast/literal.js';
import type { TypeRef } from '../ast/baseNode.js';
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
  Parameter,
} from '../ast/declaration.js';
import type {
  Initializer,
  ConstructorInitializer,
  ValuesInitializer,
  SizedArrayInitializer,
  MapInitializer,
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
  ElementValue,
} from '../ast/initializer.js';
import type { Identifier } from '../ast/baseNode.js';
import type { Expression } from '../ast/expression.js';
import type { Statement } from '../ast/statement.js';
import type { SoqlOrSoslBinding } from '../ast/expression.js';
import { StatementFactory } from './statementFactory.js';
import {
  ExpressionFactory,
  LiteralFactory,
  InitializerFactory,
  ElementValueFactory,
  SoqlOrSoslBindingFactory,
} from './expressionFactory.js';
import { DeclarationFactory } from './declarationFactory.js';
import type { SourceRange } from '../ast/baseNode.js';

/**
 * Options for creating AST nodes.
 */
export interface NodeFactoryOptions {
  /**
   * Optional source location information.
   */
  readonly location?: SourceRange;
}

/**
 * Unified factory class for creating AST nodes
 * Delegates to specialized factory classes.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class NodeFactory {
  /**
   * Creates an if statement.
   * @param condition - The boolean expression to evaluate.
   * @param thenStatement - The statement to execute if the condition is true.
   * @param elseStatement - The statement to execute if the condition is false (optional).
   * @param options - Optional factory options.
   * @returns The created if statement.
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
   * Creates a for loop statement.
   * @param body - The body statement of the for loop.
   * @param init - The initialization statement.
   * @param condition - The loop condition expression.
   * @param update - The update expression.
   * @param options - Optional factory options.
   * @returns The created for loop statement.
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
   * Creates a while loop statement.
   * @param condition - The loop condition expression.
   * @param body - The body statement of the while loop.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   * @deprecated Use createWhileLoopStatement instead.
   */
  public static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileLoopStatement {
    return this.createWhileLoopStatement(condition, body, options);
  }

  /**
   * Creates a return statement.
   * @param expression - The expression to return, if any.
   * @param options - Optional factory options.
   * @returns The created return statement.
   */
  public static createReturnStatement(
    expression?: Expression,
    options?: NodeFactoryOptions
  ): ReturnStatement {
    return StatementFactory.createReturnStatement(expression, options);
  }

  /**
   * Creates a compound statement (block).
   * @param statements - The list of statements to include in the compound statement.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   */
  public static createCompoundStatement(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return StatementFactory.createCompoundStatement([...statements], options);
  }

  /**
   * Creates a block statement.
   * @param statements - The list of statements to include in the block.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   * @deprecated Use createCompoundStatement instead.
   */
  public static createBlock(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return this.createCompoundStatement(statements, options);
  }

  /**
   * Creates an expression statement.
   * @param expression - The expression to wrap in a statement.
   * @param options - Optional factory options.
   * @returns The created expression statement.
   */
  public static createExpressionStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionStatement {
    return StatementFactory.createExpressionStatement(expression, options);
  }

  /**
   * Creates a variable declaration statement.
   * @param declaration - The variable declaration to wrap in a statement.
   * @param options - Optional factory options.
   * @returns The created variable declaration statement.
   */
  public static createVariableDeclarationStatement(
    declaration: Readonly<VariableDeclaration>,
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclarationStatement {
    return StatementFactory.createVariableDeclarationStatement(declaration, options);
  }

  /**
   * Creates an enhanced for loop statement.
   * @param variable - The variable declaration for the loop iteration variable.
   * @param iterable - The expression representing the collection to iterate over.
   * @param body - The statement to execute in each iteration.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Enhanced for loop statement requires 4 parameters
  public static createEnhancedForLoopStatement(
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * Creates a do-while loop statement.
   * @param body - The statement to execute before checking the condition.
   * @param condition - The boolean expression to evaluate after each iteration.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   */
  public static createDoWhileLoopStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileLoopStatement {
    return StatementFactory.createDoWhileLoopStatement(body, condition, options);
  }

  /**
   * Creates a for-each loop statement.
   * @param variable - The loop variable declaration.
   * @param iterable - The iterable expression.
   * @param body - The body statement of the for-each loop.
   * @param options - Optional factory options.
   * @returns The created enhanced for loop statement.
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- ForEach statement requires 4 parameters
  public static createForEachStatement(
    variable: Readonly<VariableDeclaration>,
    iterable: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): EnhancedForLoopStatement {
    return this.createEnhancedForLoopStatement(variable, iterable, body, options);
  }

  /**
   * Creates a do-while loop statement.
   * @param body - The body statement of the do-while loop.
   * @param condition - The loop condition expression.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  public static createDoWhileStatement(
    body: Readonly<Statement>,
    condition: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return this.createDoWhileLoopStatement(body, condition, options);
  }

  /**
   * Creates a switch statement.
   * @param expression - The expression to switch on.
   * @param cases - The list of switch case statements.
   * @param defaultCase - The default case statement, if any.
   * @param options - Optional factory options.
   * @returns The created switch statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Switch statement requires 4 parameters
  public static createSwitchStatement(
    expression: Readonly<Expression>,
    cases: readonly SwitchCase[],
    defaultCase?: Readonly<SwitchCase>,

    options?: Readonly<NodeFactoryOptions>
  ): SwitchStatement {
    return StatementFactory.createSwitchStatement(expression, [...cases], defaultCase, options);
  }

  /**
   * Creates a try statement.
   * @param tryBlock - The compound statement to execute in the try block.
   * @param catchClauses - The list of catch clause handlers.
   * @param finallyBlock - The compound statement to execute in the finally block, if any.
   * @param options - Optional factory options.
   * @returns The created try statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Try statement requires 4 parameters
  public static createTryStatement(
    tryBlock: Readonly<CompoundStatement>,
    catchClauses: readonly CatchClause[],
    finallyBlock?: Readonly<CompoundStatement>,

    options?: Readonly<NodeFactoryOptions>
  ): TryStatement {
    return StatementFactory.createTryStatement(tryBlock, [...catchClauses], finallyBlock, options);
  }

  /**
   * Creates a break statement.
   * @param label - The optional label to break to.
   * @param options - Optional factory options.
   * @returns The created break statement.
   */
  public static createBreakStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): BreakStatement {
    return StatementFactory.createBreakStatement(label, options);
  }

  /**
   * Creates a continue statement.
   * @param label - The optional label to continue to.
   * @param options - Optional factory options.
   * @returns The created continue statement.
   */
  public static createContinueStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): ContinueStatement {
    return StatementFactory.createContinueStatement(label, options);
  }

  /**
   * Creates a throw statement.
   * @param expression - The expression to throw.
   * @param options - Optional factory options.
   * @returns The created throw statement.
   */
  public static createThrowStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ThrowStatement {
    return StatementFactory.createThrowStatement(expression, options);
  }

  /**
   * Creates a DML statement.
   * @param operation - The DML operation type.
   * @param target - The target expression.
   * @param options - Optional factory options.
   * @returns The created DML statement.
   */
  public static createDmlStatement(
    operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
    target: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DmlStatement {
    return StatementFactory.createDmlStatement(operation, target, options);
  }

  /**
   * Creates a binary expression.
   * @param operator - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param left - The left-hand side expression.
   * @param right - The right-hand side expression.
   * @param options - Optional factory options.
   * @returns The created binary expression.
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

  /**
   * Creates a call expression.
   * @param methodName - The name of the method to call.
   * @param args - The arguments to pass to the method.
   * @param target - The target expression on which to call the method.
   * @param typeArguments - The type arguments for generic method calls.
   * @param options - Optional factory options.
   * @returns The created call expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Call expression requires 5 parameters
  public static createCallExpression(
    methodName: string,

    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
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
   * Creates a method call expression.
   * @param methodName - The name of the method to call.
   * @param args - The arguments to pass to the method.
   * @param target - The target expression on which to call the method.
   * @param typeArguments - The type arguments for generic method calls.
   * @param options - Optional factory options.
   * @returns The created call expression.
   * @deprecated Use createCallExpression instead.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Method call expression requires 5 parameters
  public static createMethodCallExpression(
    methodName: string,

    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return this.createCallExpression(methodName, args, target, typeArguments, options);
  }

  /**
   * Creates a unary expression.
   * @param operator - The unary operator to apply (e.g., '!', '++', '--').
   * @param operand - The expression to apply the operator to.
   * @param prefix - Whether the operator is prefix (true) or postfix (false).
   * @param options - Optional factory options.
   * @returns The created unary expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Unary expression requires 4 parameters
  public static createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Readonly<Expression>,
    prefix: boolean,
    options?: Readonly<NodeFactoryOptions>
  ): UnaryExpression {
    return ExpressionFactory.createUnaryExpression(operator, operand, prefix, options);
  }

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator (e.g., '=', '+=', '-=').
   * @param left - The left-hand side expression (target).
   * @param right - The right-hand side expression (value).
   * @param options - Optional factory options.
   * @returns The created assignment expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Assign expression requires 4 parameters
  public static createAssignExpression(
    operator: AssignExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, left, right, options);
  }

  /**
   * Creates a field access expression.
   * @param fieldName - The name of the field to access.
   * @param target - The target expression to access the field on.
   * @param options - Optional factory options.
   * @returns The created field expression.
   */
  public static createFieldExpression(
    fieldName: string,
    target?: Expression,
    options?: NodeFactoryOptions
  ): FieldExpression {
    return ExpressionFactory.createFieldExpression(fieldName, target, options);
  }

  /**
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
   */
  public static createArrayExpression(
    array: Expression,
    index: Expression,
    options?: NodeFactoryOptions
  ): ArrayExpression {
    return ExpressionFactory.createArrayExpression(array, index, options);
  }

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator (e.g., '=', '+=', '-=').
   * @param left - The left-hand side expression (target).
   * @param right - The right-hand side expression (value).
   * @param options - Optional factory options.
   * @returns The created assignment expression.
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
   * Creates a field access expression.
   * @param fieldName - The name of the field to access.
   * @param target - The target expression to access the field on.
   * @param options - Optional factory options.
   * @returns The created field expression.
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
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
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
    type: Readonly<TypeRef>,
    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return ExpressionFactory.createCastExpression(type, expression, options);
  }

  public static createInstanceOfExpression(
    expression: Readonly<Expression>,
    type: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): InstanceOfExpression {
    return ExpressionFactory.createInstanceOfExpression(expression, type, options);
  }

  public static createNewExpression(
    initializer: Readonly<Initializer>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  /**
   * Creates a constructor initializer.
   * @param type - The type to instantiate.
   * @param args - The constructor arguments.
   * @param options - Optional factory options.
   * @returns The created constructor initializer.
   */
  public static createConstructorInitializer(
    type: Readonly<TypeRef>,

    args: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ConstructorInitializer {
    return InitializerFactory.createConstructorInitializer(type, args, options);
  }

  public static createValuesInitializer(
    type: Readonly<TypeRef>,

    values: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return InitializerFactory.createValuesInitializer(type, [...values], options);
  }

  public static createSizedArrayInitializer(
    type: Readonly<TypeRef>,
    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return InitializerFactory.createSizedArrayInitializer(type, size, options);
  }

  public static createMapInitializer(
    type: Readonly<TypeRef>,
    pairs: readonly { key: Expression; value: Expression }[],
    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return InitializerFactory.createMapInitializer(type, [...pairs], options);
  }

  /**
   * Creates an expression element value.
   * @param value - The expression AST node to wrap as an element value.
   * @param options - Optional factory options.
   * @returns The created expression element value.
   */
  public static createExpressionElementValue(
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionElementValue {
    return ElementValueFactory.createExpressionElementValue(value, options);
  }

  public static createAnnotationElementValue(
    value: Readonly<Annotation>,

    options?: Readonly<NodeFactoryOptions>
  ): AnnotationElementValue {
    return ElementValueFactory.createAnnotationElementValue(value, options);
  }

  public static createArrayElementValue(
    values: readonly ElementValue[],
    options?: Readonly<NodeFactoryOptions>
  ): ArrayElementValue {
    return ElementValueFactory.createArrayElementValue([...values], options);
  }

  public static createNewArrayExpression(
    type: Readonly<TypeRef>,

    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return ExpressionFactory.createNewExpression(initializer, options);
  }

  public static createLambdaExpression(
    parameters: readonly LambdaParameter[],

    body: Readonly<Expression | Statement>,

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

    bindings: readonly SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    return ExpressionFactory.createSoqlExpression(query, [...bindings], options);
  }

  public static createSoslExpression(
    query: string,

    bindings: readonly SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    return ExpressionFactory.createSoslExpression(query, [...bindings], options);
  }

  public static createSoqlOrSoslBinding(
    expr: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): SoqlOrSoslBinding {
    return SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options);
  }

  /**
   * Creates a SOQL query expression.
   * @param query - The SOQL query string.
   * @param boundExpressions - The bound expressions for the query.
   * @param options - Optional factory options.
   * @returns The created SOQL expression.
   * @deprecated Use createSoqlExpression instead.
   */
  public static createSoqlQueryExpression(
    query: string,

    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    // Convert boundExpressions to bindings for backward compatibility

    const bindings = (boundExpressions ?? []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoqlExpression(query, bindings, options);
  }

  /**
   * Creates a SOSL query expression.
   * @param query - The SOSL query string.
   * @param boundExpressions - The bound expressions for the query.
   * @param options - Optional factory options.
   * @returns The created SOSL expression.
   * @deprecated Use createSoslExpression instead.
   */
  public static createSoslQueryExpression(
    query: string,

    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    // Convert boundExpressions to bindings for backward compatibility

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
   * Creates a string literal value.
   * @param value - The string value for the literal node.
   * @param raw - The raw string value as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created string literal value.
   */
  public static createStringVal(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringVal {
    return LiteralFactory.createStringVal(value, raw, options);
  }

  /**
   * Creates an integer literal value.
   * @param value - The integer value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created integer literal value.
   */
  public static createIntegerVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): IntegerVal {
    return LiteralFactory.createIntegerVal(value, raw, options);
  }

  /**
   * Creates a double literal value.
   * @param value - The double value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created double literal value.
   */
  public static createDoubleVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DoubleVal {
    return LiteralFactory.createDoubleVal(value, raw, options);
  }

  /**
   * Creates a long literal value.
   * @param value - The long value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created long literal value.
   */
  public static createLongVal(value: number, raw?: string, options?: NodeFactoryOptions): LongVal {
    return LiteralFactory.createLongVal(value, raw, options);
  }

  /**
   * Creates a decimal literal value.
   * @param value - The decimal value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created decimal literal value.
   */
  public static createDecimalVal(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): DecimalVal {
    return LiteralFactory.createDecimalVal(value, raw, options);
  }

  /**
   * Creates a boolean literal value.
   * @param value - The boolean value for the literal node.
   * @param options - Optional factory options.
   * @returns The created boolean literal value.
   */
  public static createBooleanVal(
    value: boolean,
    options?: Readonly<NodeFactoryOptions>
  ): BooleanVal {
    return LiteralFactory.createBooleanVal(value, options);
  }

  /**
   * Creates a null literal value.
   * @param options - Optional factory options.
   * @returns The created null literal value.
   */
  public static createNullVal(options?: Readonly<NodeFactoryOptions>): NullVal {
    return LiteralFactory.createNullVal(options);
  }

  /**
   * Creates a string literal value.
   * @param value - The string value for the literal node.
   * @param raw - The raw string value as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created string literal value.
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
   * Creates a numeric literal value.
   * @param value - The numeric value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created numeric literal value.
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
   * Creates a boolean literal value.
   * @param value - The boolean value for the literal node.
   * @param options - Optional factory options.
   * @returns The created boolean literal value.
   * @deprecated Use createBooleanVal instead.
   */
  public static createBooleanLiteral(value: boolean, options?: NodeFactoryOptions): BooleanVal {
    return this.createBooleanVal(value, options);
  }

  /**
   * Creates a null literal value.
   * @param options - Optional factory options.
   * @returns The created null literal value.
   * @deprecated Use createNullVal instead.
   */
  public static createNullLiteral(options?: Readonly<NodeFactoryOptions>): NullVal {
    return this.createNullVal(options);
  }

  /**
   * Creates a complex type reference.
   * In summit-ast, TypeRef extends Node(), so it IS an AST node.
   * @param components - The list of identifier components and their type arguments.
   * @param arrayNesting - The array nesting level (0 for non-array).
   * @param options - Optional factory options.
   * @returns The created type reference.
   */
  public static createTypeRef(
    components: readonly { id: Identifier; args?: TypeRef[] }[],
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Default array nesting
    arrayNesting = 0,

    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    return {
      arrayNesting,
      // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array method callback parameter
      components: components.map((c) => ({
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
   * Creates a variable declaration.
   * @param name - The identifier name for the variable.
   * @param type - The declared type of the variable.
   * @param initializer - The optional initializer expression.
   * @param modifiers - Optional modifiers (e.g., 'final', 'static').
   * @param options - Optional factory options.
   * @returns The created variable declaration.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Variable declaration requires 5 parameters
  public static createVariableDeclaration(
    name: string,
    type: Readonly<TypeRef>,
    initializer?: Readonly<Expression>,

    modifiers?: readonly Modifier[],

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

    members: readonly (
      | ClassDeclaration
      | EnumDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
      | VariableDeclaration
    )[],

    modifiers: readonly Modifier[] = [],
    extendsClause?: Readonly<TypeRef>,
    implementsClause?: readonly TypeRef[],
    typeParameters?: readonly TypeParameter[],

    options?: Readonly<NodeFactoryOptions>,
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
    members: readonly (
      | ClassDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
    )[],

    modifiers: readonly Modifier[] = [],
    extendsClause?: readonly TypeRef[],
    typeParameters?: readonly TypeParameter[],

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

    returnType: Readonly<TypeRef>,
    parameters: readonly Parameter[] = [],
    body?: Readonly<CompoundStatement>,

    modifiers: readonly Modifier[] = [],
    typeParameters?: readonly TypeParameter[],
    annotations?: readonly Annotation[],
    isConstructor = false,

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
    type: Readonly<TypeRef>,

    modifiers: readonly Modifier[] = [],
    getter?: Readonly<CompoundStatement>,
    setter?: Readonly<CompoundStatement>,

    annotations?: readonly Annotation[],

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

    values: readonly EnumValue[],

    modifiers: readonly Modifier[] = [],

    members?: readonly (
      | ClassDeclaration
      | EnumDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
      | VariableDeclaration
    )[],

    options?: Readonly<NodeFactoryOptions>
  ): EnumDeclaration {
    return DeclarationFactory.createEnumDeclaration(name, values, modifiers, members, options);
  }

  public static createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return DeclarationFactory.createEnumValue(id, options);
  }

  public static createTypeParameter(
    name: string,
    extendsBound?: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): TypeParameter {
    return DeclarationFactory.createTypeParameter(name, extendsBound, options);
  }
}
