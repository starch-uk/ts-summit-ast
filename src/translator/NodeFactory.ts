/**
 * @file Factory for creating AST nodes.
 * Provides a unified interface delegating to specialized factory classes.
 */
import { DEFAULT_ARRAY_NESTING } from '../constants.js';
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
  UntranslatedStatement,
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
  UntranslatedExpression,
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
  Declaration,
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
  TriggerDeclaration,
  TriggerCase,
  FieldDeclarationGroup,
} from '../ast/declaration.js';
import type {
  ConstructorInitializer,
  MapInitializer,
  SizedArrayInitializer,
  ValuesInitializer,
  ExpressionElementValue,
  AnnotationElementValue,
  ArrayElementValue,
} from '../ast/initializer.js';
import type { Identifier } from '../ast/baseNode.js';
import type { Expression } from '../ast/expression.js';
import type { Statement } from '../ast/statement.js';
import type { SoqlOrSoslBinding } from '../ast/expression.js';
import { toCanonicalSourceLocation } from '../ast/baseNode.js';
import type { SourceRange } from '../ast/baseNode.js';
import {
  StatementFactory,
  type CreateEnhancedForLoopStatementOptions,
  type CreateForLoopStatementOptions,
  type CreateIfStatementOptions,
  type CreateSwitchStatementOptions,
  type CreateTryStatementOptions,
} from './statementFactory.js';
import {
  ExpressionFactory,
  LiteralFactory,
  InitializerFactory,
  ElementValueFactory,
  SoqlOrSoslBindingFactory,
  type CreateCallExpressionOptions,
  type CreateTernaryExpressionOptions,
} from './expressionFactory.js';
import {
  DeclarationFactory,
  type CreateClassDeclarationOptions,
  type CreateEnumDeclarationOptions,
  type CreateInterfaceDeclarationOptions,
  type CreateMethodDeclarationOptions,
} from './declarationFactory.js';

/**
 * Options for creating AST nodes.
 */
interface NodeFactoryOptions {
  /**
   * Optional source location information.
   */
  readonly location?: SourceRange;
}

/** Readonly spec for a single type ref component (id and optional args). */
interface TypeRefComponentSpec {
  readonly id: Identifier;
  readonly args?: readonly TypeRef[];
}

/** Options for createPropertyDeclaration (all properties readonly, no wrapper types). */
interface CreatePropertyDeclarationOptions {
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers?: readonly Modifier[];
  readonly getter?: CompoundStatement;
  readonly setter?: CompoundStatement;
  readonly annotations?: readonly Annotation[];
  readonly options?: NodeFactoryOptions;
}

/**
 * Readonly view options for createClassDeclaration used at NodeFactory boundary.
 * Structurally matches the declaration factory options but is kept local here.
 */
interface CreateClassDeclarationOptionsView {
  readonly annotations?: readonly Annotation[];
  readonly extendsType?: TypeRef;
  readonly implementsTypes?: readonly TypeRef[];
  readonly bodyDeclarations: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | FieldDeclarationGroup
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/** Readonly view options for createEnumDeclaration at NodeFactory boundary. */
interface CreateEnumDeclarationOptionsView {
  readonly bodyDeclarations?: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | FieldDeclarationGroup
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly values: readonly EnumValue[];
}

/** Readonly view options for createTriggerDeclaration at NodeFactory boundary. */
interface CreateTriggerDeclarationOptionsView {
  readonly body: readonly (Declaration | Statement)[];
  readonly cases: readonly TriggerCase[];
  readonly id: Identifier;
  readonly options?: NodeFactoryOptions;
  readonly target: Identifier;
}

/** Readonly view options for createInterfaceDeclaration at NodeFactory boundary. */
interface CreateInterfaceDeclarationOptionsView {
  readonly extendsTypes?: readonly TypeRef[];
  readonly bodyDeclarations: readonly (
    | ClassDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/**
 * Unified factory class for creating AST nodes
 * Delegates to specialized factory classes.
 */
const NodeFactory = {
  createAnnotationElementValue(
    value: Annotation,

    options?: NodeFactoryOptions
  ): AnnotationElementValue {
    return ElementValueFactory.createAnnotationElementValue(value, options);
  },

  /**
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
   * @deprecated Use createArrayExpression instead.
   */
  createArrayAccessExpression(
    array: Readonly<Expression>,
    index: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ArrayExpression {
    return NodeFactory.createArrayExpression(array, index, options);
  },

  createArrayElementValue(
    values: readonly (AnnotationElementValue | ArrayElementValue | ExpressionElementValue)[],
    options?: Readonly<NodeFactoryOptions>
  ): ArrayElementValue {
    return ElementValueFactory.createArrayElementValue([...values], options);
  },

  /**
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
   */
  createArrayExpression(
    array: Readonly<Expression>,
    index: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ArrayExpression {
    return ExpressionFactory.createArrayExpression(array, index, options);
  },

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator (e.g., '=', '+=', '-=').
   * @param options - Object with left and right expressions and optional factory options.
   * @returns The created assignment expression.
   */
  createAssignExpression(
    operator: AssignExpression['operator'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, options);
  },

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator (e.g., '=', '+=', '-=').
   * @param options - Object with left and right expressions and optional factory options.
   * @returns The created assignment expression.
   * @deprecated Use createAssignExpression instead.
   */
  createAssignmentExpression(
    operator: AssignExpression['operator'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): AssignExpression {
    return this.createAssignExpression(operator, options);
  },

  /**
   * Creates a binary expression.
   * @param operator - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param options - Object with left and right expressions and optional factory options.
   * @returns The created binary expression.
   */
  createBinaryExpression(
    operator: BinaryExpression['op'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): BinaryExpression {
    return ExpressionFactory.createBinaryExpression(operator, options);
  },

  /**
   * Creates a block statement.
   * @param statements - The list of statements to include in the block.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   * @deprecated Use createCompoundStatement instead.
   */
  createBlock(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return NodeFactory.createCompoundStatement(statements, options);
  },

  /**
   * Creates a boolean literal value.
   * @param value - The boolean value for the literal node.
   * @param options - Optional factory options.
   * @returns The created boolean literal value.
   * @deprecated Use createBooleanVal instead.
   */
  createBooleanLiteral(value: boolean, options?: Readonly<NodeFactoryOptions>): BooleanVal {
    return this.createBooleanVal(value, options);
  },

  /**
   * Creates a boolean literal value.
   * @param value - The boolean value for the literal node.
   * @param options - Optional factory options.
   * @returns The created boolean literal value.
   */
  createBooleanVal(value: boolean, options?: Readonly<NodeFactoryOptions>): BooleanVal {
    return LiteralFactory.createBooleanVal(value, options);
  },

  /**
   * Creates a break statement.
   * @param label - The optional label to break to.
   * @param options - Optional factory options.
   * @returns The created break statement.
   */
  createBreakStatement(label?: string, options?: Readonly<NodeFactoryOptions>): BreakStatement {
    return StatementFactory.createBreakStatement(label, options);
  },

  /**
   * Creates a call expression.
   * @param opts - Options (methodName, args, target, typeArguments, options).
   * @returns The created call expression.
   */
  createCallExpression(opts: Readonly<CreateCallExpressionOptions>): CallExpression {
    return ExpressionFactory.createCallExpression(opts);
  },
  createCastExpression(
    type: Readonly<TypeRef>,
    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return ExpressionFactory.createCastExpression(type, expression, options);
  },

  createClassDeclaration(opts: CreateClassDeclarationOptionsView): ClassDeclaration {
    return DeclarationFactory.createClassDeclaration(opts);
  },

  /**
   * Creates a compound statement (block).
   * @param statements - The list of statements to include in the compound statement.
   * @param options - Optional factory options.
   * @returns The created compound statement.
   */
  createCompoundStatement(
    statements: readonly Statement[],
    options?: Readonly<NodeFactoryOptions>
  ): CompoundStatement {
    return StatementFactory.createCompoundStatement([...statements], options);
  },

  /**
   * Creates a constructor initializer.
   * @param type - The type to instantiate.
   * @param args - The constructor arguments.
   * @param options - Optional factory options.
   * @returns The created constructor initializer.
   */
  createConstructorInitializer(
    type: Readonly<TypeRef>,

    args: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ConstructorInitializer {
    return InitializerFactory.createConstructorInitializer(type, args, options);
  },

  /**
   * Creates a continue statement.
   * @param label - The optional label to continue to.
   * @param options - Optional factory options.
   * @returns The created continue statement.
   */
  createContinueStatement(
    label?: string,
    options?: Readonly<NodeFactoryOptions>
  ): ContinueStatement {
    return StatementFactory.createContinueStatement(label, options);
  },

  /**
   * Creates a decimal literal value.
   * @param value - The decimal value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created decimal literal value.
   */
  createDecimalVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): DecimalVal {
    return LiteralFactory.createDecimalVal(value, raw, options);
  },

  /**
   * Creates a DML statement.
   * @param operation - The DML operation type.
   * @param target - The target expression.
   * @param options - Optional factory options.
   * @returns The created DML statement.
   */
  createDmlStatement(
    operation: 'delete' | 'insert' | 'merge' | 'undelete' | 'update' | 'upsert',
    target: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DmlStatement {
    return StatementFactory.createDmlStatement(operation, target, options);
  },

  /**
   * Creates a do-while loop statement.
   * @param body - The statement to execute before checking the condition.
   * @param condition - The boolean expression to evaluate after each iteration.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   */
  createDoWhileLoopStatement(
    body: Readonly<Statement>,
    condition: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return StatementFactory.createDoWhileLoopStatement(body, condition, options);
  },

  /**
   * Creates a do-while loop statement.
   * @param body - The body statement of the do-while loop.
   * @param condition - The loop condition expression.
   * @param options - Optional factory options.
   * @returns The created do-while loop statement.
   * @deprecated Use createDoWhileLoopStatement instead.
   */
  createDoWhileStatement(
    body: Readonly<Statement>,
    condition: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): DoWhileLoopStatement {
    return NodeFactory.createDoWhileLoopStatement(body, condition, options);
  },

  /**
   * Creates a double literal value.
   * @param value - The double value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created double literal value.
   */
  createDoubleVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): DoubleVal {
    return LiteralFactory.createDoubleVal(value, raw, options);
  },

  /**
   * Creates an enhanced for loop statement.
   * @param opts - Options (variable, iterable, body, options).
   * @returns The created enhanced for loop statement.
   */
  createEnhancedForLoopStatement(
    opts: Readonly<CreateEnhancedForLoopStatementOptions>
  ): EnhancedForLoopStatement {
    return StatementFactory.createEnhancedForLoopStatement(opts);
  },

  /**
   * Creates an enum declaration.
   * @param opts - Options (name, values, modifiers, members, options).
   * @returns The created enum declaration.
   */
  createEnumDeclaration(opts: CreateEnumDeclarationOptionsView): EnumDeclaration {
    return DeclarationFactory.createEnumDeclaration(opts);
  },

  createEnumValue(
    id: Readonly<Readonly<Identifier>>,
    options?: Readonly<NodeFactoryOptions>
  ): EnumValue {
    return DeclarationFactory.createEnumValue(id, options);
  },

  /**
   * Creates an expression element value.
   * @param value - The expression AST node to wrap as an element value.
   * @param options - Optional factory options.
   * @returns The created expression element value.
   */

  createExpressionElementValue(
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionElementValue {
    return ElementValueFactory.createExpressionElementValue(value, options);
  },

  /**
   * Creates an expression statement.
   * @param expression - The expression to wrap in a statement.
   * @param options - Optional factory options.
   * @returns The created expression statement.
   */
  createExpressionStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionStatement {
    return StatementFactory.createExpressionStatement(expression, options);
  },

  /**
   * Creates a field access expression.
   * @param fieldName - The name of the field to access.
   * @param target - The target expression to access the field on.
   * @param options - Optional factory options.
   * @returns The created field expression.
   * @deprecated Use createFieldExpression instead.
   */
  createFieldAccessExpression(
    fieldName: string,
    target?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): FieldExpression {
    return NodeFactory.createFieldExpression(fieldName, target, options);
  },

  /**
   * Creates a field access expression.
   * @param fieldName - The name of the field to access.
   * @param target - The target expression to access the field on.
   * @param options - Optional factory options.
   * @returns The created field expression.
   */
  createFieldExpression(
    fieldName: string,
    target?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): FieldExpression {
    return ExpressionFactory.createFieldExpression(fieldName, target, options);
  },

  /**
   * Creates a for-each loop statement.
   * @param opts - Options (variable, iterable, body, options).
   * @returns The created enhanced for loop statement.
   * @deprecated Use createEnhancedForLoopStatement instead.
   */
  createForEachStatement(
    opts: Readonly<CreateEnhancedForLoopStatementOptions>
  ): EnhancedForLoopStatement {
    return NodeFactory.createEnhancedForLoopStatement(opts);
  },
  createForLoopStatement(opts: Readonly<CreateForLoopStatementOptions>): ForLoopStatement {
    return StatementFactory.createForLoopStatement(opts);
  },

  /**
   * Creates a for loop statement.
   * @param opts - Body, init, condition, update, options.
   * @returns The created for loop statement.
   * @deprecated Use createForLoopStatement instead.
   */

  createForStatement(opts: Readonly<CreateForLoopStatementOptions>): ForLoopStatement {
    return NodeFactory.createForLoopStatement(opts);
  },
  createIdentifier(name: string, options?: Readonly<NodeFactoryOptions>): Identifier {
    return {
      '@type': 'Identifier',
      string: name,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates an if statement.
   * @param opts - Options (condition, thenStatement, elseStatement, options).
   * @returns The created if statement.
   */
  createIfStatement(opts: Readonly<CreateIfStatementOptions>): IfStatement {
    return StatementFactory.createIfStatement(opts);
  },
  createInstanceOfExpression(
    expression: Readonly<Expression>,
    type: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): InstanceOfExpression {
    return ExpressionFactory.createInstanceOfExpression(expression, type, options);
  },

  /**
   * Creates an integer literal value.
   * @param value - The integer value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created integer literal value.
   */

  createIntegerVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): IntegerVal {
    return LiteralFactory.createIntegerVal(value, raw, options);
  },

  createInterfaceDeclaration(opts: CreateInterfaceDeclarationOptionsView): InterfaceDeclaration {
    return DeclarationFactory.createInterfaceDeclaration(opts);
  },

  createLambdaExpression(
    parameters: readonly LambdaParameter[],

    body: Readonly<Expression | Statement>,

    options?: Readonly<NodeFactoryOptions>
  ): LambdaExpression {
    return ExpressionFactory.createLambdaExpression(parameters, body, options);
  },

  /**
   * Creates a long literal value.
   * @param value - The long value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created long literal value.
   */

  createLongVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): LongVal {
    return LiteralFactory.createLongVal(value, raw, options);
  },

  createMapInitializer(
    type: Readonly<TypeRef>,
    pairs: readonly { readonly key: Readonly<Expression>; readonly value: Readonly<Expression> }[],
    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return InitializerFactory.createMapInitializer(type, [...pairs], options);
  },

  /**
   * Creates a method call expression.
   * @param opts - Options (methodName, args, target, typeArguments, options).
   * @returns The created call expression.
   * @deprecated Use createCallExpression instead.
   */

  createMethodCallExpression(opts: Readonly<CreateCallExpressionOptions>): CallExpression {
    return this.createCallExpression(opts);
  },

  /**
   * Creates a method declaration.
   * @param opts - Options (name, returnType, parameters, body, modifiers, typeParameters, annotations, isConstructor, options).
   * @returns The created method declaration.
   */
  createMethodDeclaration(opts: Readonly<CreateMethodDeclarationOptions>): MethodDeclaration {
    return DeclarationFactory.createMethodDeclaration(opts);
  },
  createNewArrayExpression(
    type: Readonly<TypeRef>,

    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return ExpressionFactory.createNewExpression(initializer, options);
  },

  createNewExpression(
    initializer: Readonly<
      Readonly<ConstructorInitializer | MapInitializer | SizedArrayInitializer | ValuesInitializer>
    >,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return ExpressionFactory.createNewExpression(initializer, options);
  },

  /**
   * Creates a null literal value.
   * @param options - Optional factory options.
   * @returns The created null literal value.
   * @deprecated Use createNullVal instead.
   */

  createNullLiteral(options?: Readonly<NodeFactoryOptions>): NullVal {
    return this.createNullVal(options);
  },

  /**
   * Creates a null literal value.
   * @param options - Optional factory options.
   * @returns The created null literal value.
   */

  createNullVal(options?: Readonly<NodeFactoryOptions>): NullVal {
    return LiteralFactory.createNullVal(options);
  },

  /**
   * Creates a numeric literal value.
   * @param value - The numeric value for the literal node.
   * @param raw - The raw numeric literal text as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created numeric literal value.
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */

  createNumberLiteral(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): IntegerVal {
    return this.createIntegerVal(value, raw, options);
  },

  createParenthesizedExpression(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ParenthesizedExpression {
    return ExpressionFactory.createParenthesizedExpression(expression, options);
  },

  /**
   * Creates a property declaration.
   * @param opts - Options (name, type, modifiers, getter, setter, annotations, options).
   * @returns The created property declaration.
   */

  createPropertyDeclaration(opts: Readonly<CreatePropertyDeclarationOptions>): PropertyDeclaration {
    return DeclarationFactory.createPropertyDeclaration(opts.name, opts.type, {
      annotations: opts.annotations,
      getter: opts.getter,
      modifiers: opts.modifiers,
      setter: opts.setter,
      ...opts.options,
    });
  },

  /**
   * Creates a return statement.
   * @param expression - The expression to return, if any.
   * @param options - Optional factory options.
   * @returns The created return statement.
   */
  createReturnStatement(
    expression?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ReturnStatement {
    return StatementFactory.createReturnStatement(expression, options);
  },

  createSimpleTypeRef(
    name: string,
    arrayNesting = DEFAULT_ARRAY_NESTING,

    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    return {
      '@type': 'TypeRef',
      arrayNesting,
      components: [
        {
          args: [],
          id: this.createIdentifier(name, options),
        },
      ],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createSizedArrayInitializer(
    type: Readonly<TypeRef>,
    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return InitializerFactory.createSizedArrayInitializer(type, size, options);
  },
  createSoqlExpression(
    query: string,

    bindings: readonly SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    return ExpressionFactory.createSoqlExpression(query, [...bindings], options);
  },
  createSoqlOrSoslBinding(
    expr: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): SoqlOrSoslBinding {
    return SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options);
  },

  /**
   * Creates a SOQL query expression.
   * @param query - The SOQL query string.
   * @param boundExpressions - The bound expressions for the query.
   * @param options - Optional factory options.
   * @returns The created SOQL expression.
   * @deprecated Use createSoqlExpression instead.
   */

  createSoqlQueryExpression(
    query: string,

    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    // Convert boundExpressions to bindings for backward compatibility

    const bindings = (boundExpressions ?? []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoqlExpression(query, bindings, options);
  },
  createSoslExpression(
    query: string,

    bindings: readonly SoqlOrSoslBinding[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    return ExpressionFactory.createSoslExpression(query, [...bindings], options);
  },

  /**
   * Creates a SOSL query expression.
   * @param query - The SOSL query string.
   * @param boundExpressions - The bound expressions for the query.
   * @param options - Optional factory options.
   * @returns The created SOSL expression.
   * @deprecated Use createSoslExpression instead.
   */
  createSoslQueryExpression(
    query: string,

    boundExpressions?: readonly Expression[],
    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    // Convert boundExpressions to bindings for backward compatibility

    const bindings = (boundExpressions ?? []).map((expr) =>
      this.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoslExpression(query, bindings, options);
  },

  /**
   * Creates a string literal value.
   * @param value - The string value for the literal node.
   * @param raw - The raw string value as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created string literal value.
   * @deprecated Use createStringVal instead.
   */
  createStringLiteral(
    value: string,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): StringVal {
    return this.createStringVal(value, raw, options);
  },

  /**
   * Creates a string literal value.
   * @param value - The string value for the literal node.
   * @param raw - The raw string value as it appeared in source.
   * @param options - Optional factory options.
   * @returns The created string literal value.
   */
  createStringVal(value: string, raw?: string, options?: Readonly<NodeFactoryOptions>): StringVal {
    return LiteralFactory.createStringVal(value, raw, options);
  },
  createSuperExpression(options?: Readonly<NodeFactoryOptions>): SuperExpression {
    return ExpressionFactory.createSuperExpression(options);
  },

  /**
   * Creates a switch statement.
   * @param opts - Options (expression, cases, defaultCase, options).
   * @returns The created switch statement.
   */
  createSwitchStatement(opts: Readonly<CreateSwitchStatementOptions>): SwitchStatement {
    return StatementFactory.createSwitchStatement(opts);
  },
  createTernaryExpression(opts: Readonly<CreateTernaryExpressionOptions>): TernaryExpression {
    return ExpressionFactory.createTernaryExpression(opts);
  },

  createThisExpression(options?: Readonly<NodeFactoryOptions>): ThisExpression {
    return ExpressionFactory.createThisExpression(options);
  },

  /**
   * Creates a throw statement.
   * @param expression - The expression to throw.
   * @param options - Optional factory options.
   * @returns The created throw statement.
   */
  createThrowStatement(
    expression: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ThrowStatement {
    return StatementFactory.createThrowStatement(expression, options);
  },
  createTriggerContextVariableExpression(
    variableName: string,
    options?: Readonly<NodeFactoryOptions>
  ): TriggerContextVariableExpression {
    return ExpressionFactory.createTriggerContextVariableExpression(variableName, options);
  },
  createTriggerDeclaration(opts: CreateTriggerDeclarationOptionsView): TriggerDeclaration {
    return DeclarationFactory.createTriggerDeclaration(opts);
  },

  /**
   * Creates a try statement.
   * @param opts - Options (tryBlock, catchClauses, finallyBlock, options).
   * @returns The created try statement.
   */
  createTryStatement(opts: Readonly<CreateTryStatementOptions>): TryStatement {
    return StatementFactory.createTryStatement(opts);
  },

  createTypeParameter(
    name: string,
    extendsBound?: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): TypeParameter {
    return DeclarationFactory.createTypeParameter(name, extendsBound, options);
  },

  /**
   * Creates a complex type reference.
   * In summit-ast, TypeRef extends Node(), so it IS an AST node.
   * @param components - The list of identifier components and their type arguments.
   * @param arrayNesting - The array nesting level (0 for non-array).
   * @param options - Optional factory options.
   * @returns The created type reference.
   */
  createTypeRef(
    components: readonly TypeRefComponentSpec[],
    arrayNesting = DEFAULT_ARRAY_NESTING,
    options?: NodeFactoryOptions
  ): TypeRef {
    return {
      '@type': 'TypeRef',
      arrayNesting,
      components: components.map((c) => ({
        args: c.args ?? [],
        id: c.id,
      })),
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a unary expression.
   * @param operator - The unary operator to apply (e.g., '!', '++', '--').
   * @param options - Object with operand, prefix, and optional factory options.
   * @returns The created unary expression.
   */
  createUnaryExpression(
    operator: UnaryExpression['op'],
    options: Readonly<{ operand: Readonly<Expression>; prefix: boolean }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): UnaryExpression {
    return ExpressionFactory.createUnaryExpression(operator, options);
  },
  createValuesInitializer(
    type: Readonly<TypeRef>,

    values: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return InitializerFactory.createValuesInitializer(type, [...values], options);
  },

  /**
   * Creates a field declaration group (grouped field declarators sharing type/modifiers).
   * @param opts - Options (type, modifiers, declarations with id/initializer, options).
   * @returns The created field declaration group.
   */
  createFieldDeclarationGroup(
    opts: Readonly<{
      type: Readonly<TypeRef>;
      modifiers: readonly Modifier[];
      declarations: readonly { id: Identifier; initializer?: Expression }[];
      options?: NodeFactoryOptions;
    }>
  ): FieldDeclarationGroup {
    return DeclarationFactory.createFieldDeclarationGroup(opts);
  },

  /**
   * Creates a variable declaration.
   * @param opts - Options (name, type, initializer, modifiers, options).
   * @returns The created variable declaration.
   */
  createVariableDeclaration(
    opts: Readonly<
      NodeFactoryOptions & {
        initializer?: Readonly<Expression>;
        modifiers?: readonly Modifier[];
        name: string;
        type: Readonly<TypeRef>;
      }
    >
  ): VariableDeclaration {
    return DeclarationFactory.createVariableDeclaration(opts);
  },

  /**
   * Creates a variable declaration statement.
   * @param declaration - The variable declaration to wrap in a statement.
   * @param options - Optional factory options.
   * @returns The created variable declaration statement.
   */
  createVariableDeclarationStatement(
    declaration: Readonly<VariableDeclaration>,
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclarationStatement {
    return StatementFactory.createVariableDeclarationStatement(declaration, options);
  },
  createVariableExpression(
    id: Identifier,
    options?: Readonly<NodeFactoryOptions>
  ): VariableExpression {
    return ExpressionFactory.createVariableExpression(id, options);
  },

  createWhileLoopStatement(
    condition: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): WhileLoopStatement {
    return StatementFactory.createWhileLoopStatement(condition, body, options);
  },

  /**
   * Creates a while loop statement.
   * @param condition - The loop condition expression.
   * @param body - The body statement of the while loop.
   * @param options - Optional factory options.
   * @returns The created while loop statement.
   * @deprecated Use createWhileLoopStatement instead.
   */
  createWhileStatement(
    condition: Readonly<Expression>,
    body: Readonly<Statement>,
    options?: Readonly<NodeFactoryOptions>
  ): WhileLoopStatement {
    return NodeFactory.createWhileLoopStatement(condition, body, options);
  },

  createUntranslatedStatement(options?: Readonly<NodeFactoryOptions>): UntranslatedStatement {
    return StatementFactory.createUntranslatedStatement(options);
  },

  createUntranslatedExpression(options?: Readonly<NodeFactoryOptions>): UntranslatedExpression {
    return ExpressionFactory.createUntranslatedExpression(options);
  },
};

export {
  NodeFactory,
  type CreateCallExpressionOptions,
  type CreateClassDeclarationOptions,
  type CreateEnhancedForLoopStatementOptions,
  type CreateEnumDeclarationOptions,
  type CreateForLoopStatementOptions,
  type CreateIfStatementOptions,
  type CreateInterfaceDeclarationOptions,
  type CreateMethodDeclarationOptions,
  type CreatePropertyDeclarationOptions,
  type CreateSwitchStatementOptions,
  type CreateTernaryExpressionOptions,
  type CreateTryStatementOptions,
  type NodeFactoryOptions,
};
