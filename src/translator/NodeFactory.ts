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
import type { SourceRange } from '../ast/baseNode.js';
import { StatementFactory } from './statementFactory.js';
import {
  ExpressionFactory,
  LiteralFactory,
  InitializerFactory,
  ElementValueFactory,
  SoqlOrSoslBindingFactory,
} from './expressionFactory.js';
import { DeclarationFactory } from './declarationFactory.js';

/**
 * Options for creating AST nodes.
 */
interface NodeFactoryOptions {
  /**
   * Optional source location information.
   */
  readonly location?: SourceRange;
}

/** Options object for creating an enhanced for-loop statement (variable, iterable, body, options). */
interface CreateEnhancedForLoopStatementOptions {
  readonly variable: Readonly<VariableDeclaration>;
  readonly iterable: Readonly<Expression>;
  readonly body: Readonly<Statement>;
  readonly options?: Readonly<NodeFactoryOptions>;
}

/** Options for createEnumDeclaration. */
interface CreateEnumDeclarationOptions {
  readonly name: string;
  readonly values: readonly EnumValue[];
  readonly modifiers?: readonly Modifier[];
  readonly members?: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly options?: Readonly<NodeFactoryOptions>;
}

/** Options for createIfStatement. */
interface CreateIfStatementOptions {
  readonly condition: Readonly<Expression>;
  readonly thenStatement: Readonly<Statement>;
  readonly elseStatement?: Readonly<Statement>;
  readonly options?: Readonly<NodeFactoryOptions>;
}

/** Options for createMethodDeclaration. */
interface CreateMethodDeclarationOptions {
  readonly name: string;
  readonly returnType: Readonly<TypeRef>;
  readonly parameters?: readonly Parameter[];
  readonly body?: Readonly<CompoundStatement>;
  readonly modifiers?: readonly Modifier[];
  readonly typeParameters?: readonly TypeParameter[];
  readonly annotations?: readonly Annotation[];
  readonly isConstructor?: boolean;
  readonly options?: Readonly<NodeFactoryOptions>;
}

/** Options for createPropertyDeclaration. */
interface CreatePropertyDeclarationOptions {
  readonly name: string;
  readonly type: Readonly<TypeRef>;
  readonly modifiers?: readonly Modifier[];
  readonly getter?: Readonly<CompoundStatement>;
  readonly setter?: Readonly<CompoundStatement>;
  readonly annotations?: readonly Annotation[];
  readonly options?: Readonly<NodeFactoryOptions>;
}

/**
 * Unified factory class for creating AST nodes
 * Delegates to specialized factory classes.
 */
const NodeFactory = {
  createAnnotationElementValue(
    value: Readonly<Annotation>,

    options?: Readonly<NodeFactoryOptions>
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
    values: readonly ElementValue[],
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
   * @param left - The left-hand side expression (target).
   * @param right - The right-hand side expression (value).
   * @param options - Optional factory options.
   * @returns The created assignment expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Assign expression requires 4 parameters
  createAssignExpression(
    operator: AssignExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, left, right, options);
  },

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
  createAssignmentExpression(
    operator: AssignExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): AssignExpression {
    return this.createAssignExpression(operator, left, right, options);
  },

  /**
   * Creates a binary expression.
   * @param operator - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param left - The left-hand side expression.
   * @param right - The right-hand side expression.
   * @param options - Optional factory options.
   * @returns The created binary expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Binary expression requires 4 parameters
  createBinaryExpression(
    operator: BinaryExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): BinaryExpression {
    return ExpressionFactory.createBinaryExpression(operator, left, right, options);
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
   * @param methodName - The name of the method to call.
   * @param args - The arguments to pass to the method.
   * @param target - The target expression on which to call the method.
   * @param typeArguments - The type arguments for generic method calls.
   * @param options - Optional factory options.
   * @returns The created call expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Call expression requires 5 parameters
  createCallExpression(
    methodName: string,

    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return ExpressionFactory.createCallExpression(methodName, args, target, typeArguments, options);
  },
  createCastExpression(
    type: Readonly<TypeRef>,
    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return ExpressionFactory.createCastExpression(type, expression, options);
  },

  /* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- params use Readonly<> but rule still flags */
  // eslint-disable-next-line @typescript-eslint/max-params -- Class declaration requires 8 params
  createClassDeclaration(
    name: string,

    members: Readonly<
      readonly (
        | Readonly<ClassDeclaration>
        | Readonly<EnumDeclaration>
        | Readonly<InterfaceDeclaration>
        | Readonly<MethodDeclaration>
        | Readonly<PropertyDeclaration>
        | Readonly<VariableDeclaration>
      )[]
    >,

    modifiers: readonly Readonly<Modifier>[] = [],
    extendsClause?: Readonly<TypeRef>,
    implementsClause?: readonly Readonly<TypeRef>[],
    typeParameters?: readonly Readonly<TypeParameter>[],

    options?: Readonly<NodeFactoryOptions>,
    annotations?: readonly Readonly<Annotation>[]
  ): ClassDeclaration {
    /* eslint-enable @typescript-eslint/prefer-readonly-parameter-types */
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
    return StatementFactory.createEnhancedForLoopStatement(
      opts.variable,
      opts.iterable,
      opts.body,
      opts.options
    );
  },

  /**
   * Creates an enum declaration.
   * @param opts - Options (name, values, modifiers, members, options).
   * @returns The created enum declaration.
   */
  /* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- opts use Readonly<> but rule still flags */
  createEnumDeclaration(opts: Readonly<CreateEnumDeclarationOptions>): EnumDeclaration {
    /* eslint-enable @typescript-eslint/prefer-readonly-parameter-types */
    return DeclarationFactory.createEnumDeclaration(
      opts.name,
      opts.values,
      opts.modifiers ?? [],
      opts.members,
      opts.options
    );
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

  // eslint-disable-next-line @typescript-eslint/max-params -- For loop statement requires 5 parameters
  createForLoopStatement(
    body: Readonly<Statement>,

    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return StatementFactory.createForLoopStatement(body, init, condition, update, options);
  },

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
  createForStatement(
    body: Readonly<Statement>,

    init?: Readonly<ExpressionStatement | VariableDeclarationStatement>,
    condition?: Readonly<Expression>,
    update?: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ForLoopStatement {
    return NodeFactory.createForLoopStatement(body, init, condition, update, options);
  },
  createIdentifier(name: string, options?: Readonly<NodeFactoryOptions>): Identifier {
    return {
      kind: 'Identifier',
      location: options?.location,
      name,
    };
  },

  /**
   * Creates an if statement.
   * @param opts - Options (condition, thenStatement, elseStatement, options).
   * @returns The created if statement.
   */
  createIfStatement(opts: Readonly<CreateIfStatementOptions>): IfStatement {
    return StatementFactory.createIfStatement(
      opts.condition,
      opts.thenStatement,
      opts.elseStatement,
      opts.options
    );
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

  /* eslint-disable @typescript-eslint/prefer-readonly-parameter-types -- params use Readonly<> but rule still flags */
  // eslint-disable-next-line @typescript-eslint/max-params -- Interface declaration requires 6 params
  createInterfaceDeclaration(
    name: string,
    members: Readonly<
      readonly (
        | Readonly<ClassDeclaration>
        | Readonly<InterfaceDeclaration>
        | Readonly<MethodDeclaration>
        | Readonly<PropertyDeclaration>
      )[]
    >,

    modifiers: readonly Readonly<Modifier>[] = [],
    extendsClause?: readonly Readonly<TypeRef>[],
    typeParameters?: readonly Readonly<TypeParameter>[],

    options?: Readonly<NodeFactoryOptions>
  ): InterfaceDeclaration {
    /* eslint-enable @typescript-eslint/prefer-readonly-parameter-types */
    return DeclarationFactory.createInterfaceDeclaration(
      name,
      members,
      modifiers,
      extendsClause,
      typeParameters,
      options
    );
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
   * @param methodName - The name of the method to call.
   * @param args - The arguments to pass to the method.
   * @param target - The target expression on which to call the method.
   * @param typeArguments - The type arguments for generic method calls.
   * @param options - Optional factory options.
   * @returns The created call expression.
   * @deprecated Use createCallExpression instead.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Method call expression requires 5 parameters
  createMethodCallExpression(
    methodName: string,

    args: readonly Expression[] = [],
    target?: Readonly<Expression>,
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return this.createCallExpression(methodName, args, target, typeArguments, options);
  },

  /**
   * Creates a method declaration.
   * @param opts - Options (name, returnType, parameters, body, modifiers, typeParameters, annotations, isConstructor, options).
   * @returns The created method declaration.
   */
  createMethodDeclaration(opts: Readonly<CreateMethodDeclarationOptions>): MethodDeclaration {
    return DeclarationFactory.createMethodDeclaration(
      opts.name,
      opts.returnType,
      opts.parameters ?? [],
      opts.body,
      opts.modifiers ?? [],
      opts.typeParameters,
      opts.annotations,
      opts.isConstructor ?? false,
      opts.options
    );
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
    initializer: Readonly<Readonly<Initializer>>,

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
    return DeclarationFactory.createPropertyDeclaration(
      opts.name,
      opts.type,
      opts.modifiers ?? [],
      opts.getter,
      opts.setter,
      opts.annotations,
      opts.options
    );
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
   * @param expression - The expression to switch on.
   * @param cases - The list of switch case statements.
   * @param defaultCase - The default case statement, if any.
   * @param options - Optional factory options.
   * @returns The created switch statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Switch statement requires 4 parameters
  createSwitchStatement(
    expression: Readonly<Expression>,
    cases: readonly SwitchCase[],
    defaultCase?: Readonly<SwitchCase>,

    options?: Readonly<NodeFactoryOptions>
  ): SwitchStatement {
    return StatementFactory.createSwitchStatement(expression, [...cases], defaultCase, options);
  },

  // eslint-disable-next-line @typescript-eslint/max-params -- Ternary expression requires 4 parameters
  createTernaryExpression(
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

  /**
   * Creates a try statement.
   * @param tryBlock - The compound statement to execute in the try block.
   * @param catchClauses - The list of catch clause handlers.
   * @param finallyBlock - The compound statement to execute in the finally block, if any.
   * @param options - Optional factory options.
   * @returns The created try statement.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Try statement requires 4 parameters
  createTryStatement(
    tryBlock: Readonly<CompoundStatement>,
    catchClauses: readonly CatchClause[],
    finallyBlock?: Readonly<CompoundStatement>,

    options?: Readonly<NodeFactoryOptions>
  ): TryStatement {
    return StatementFactory.createTryStatement(tryBlock, [...catchClauses], finallyBlock, options);
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
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- components use Readonly<> but rule still flags
    components: Readonly<
      readonly { id: Readonly<Identifier>; args?: readonly Readonly<TypeRef>[] }[]
    >,
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
  },

  /**
   * Creates a unary expression.
   * @param operator - The unary operator to apply (e.g., '!', '++', '--').
   * @param operand - The expression to apply the operator to.
   * @param prefix - Whether the operator is prefix (true) or postfix (false).
   * @param options - Optional factory options.
   * @returns The created unary expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Unary expression requires 4 parameters
  createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Readonly<Expression>,
    prefix: boolean,
    options?: Readonly<NodeFactoryOptions>
  ): UnaryExpression {
    return ExpressionFactory.createUnaryExpression(operator, operand, prefix, options);
  },
  createValuesInitializer(
    type: Readonly<TypeRef>,

    values: readonly Expression[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return InitializerFactory.createValuesInitializer(type, [...values], options);
  },

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
  createVariableDeclaration(
    name: string,
    type: Readonly<TypeRef>,
    initializer?: Readonly<Expression>,

    modifiers?: readonly Modifier[],

    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclaration {
    return DeclarationFactory.createVariableDeclaration({
      initializer,
      modifiers,
      name,
      type,
      ...(options ?? {}),
    });
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
};

export {
  NodeFactory,
  type CreateEnhancedForLoopStatementOptions,
  type CreateEnumDeclarationOptions,
  type CreateIfStatementOptions,
  type CreateMethodDeclarationOptions,
  type CreatePropertyDeclarationOptions,
  type NodeFactoryOptions,
};
