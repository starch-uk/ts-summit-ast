/**
 * @file Factory for creating expression AST nodes.
 * Specialized factory for creating expression node types.
 */

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
  LambdaParameter,
} from '../ast/expression.js';
import type { Expression, Statement } from '../ast/index.js';
import type { TypeRef, Identifier } from '../ast/baseNode.js';
import type { SoqlOrSoslBinding } from '../ast/expression.js';
import type {
  StringVal,
  IntegerVal,
  DoubleVal,
  LongVal,
  DecimalVal,
  BooleanVal,
  NullVal,
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
import type { Annotation } from '../ast/declaration.js';
import type { NodeFactoryOptions } from './nodeFactory.js';

/** Options for createCallExpression. */
interface CreateCallExpressionOptions {
  readonly args?: readonly Readonly<Expression>[];
  readonly methodName: string;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly target?: Readonly<Expression>;
  readonly typeArguments?: readonly TypeRef[];
}

/** Options for createTernaryExpression. */
interface CreateTernaryExpressionOptions {
  readonly condition: Readonly<Expression>;
  readonly elseExpression: Readonly<Expression>;
  readonly options?: Readonly<NodeFactoryOptions>;
  readonly thenExpression: Readonly<Expression>;
}

// ============================================================================
// SoqlOrSoslBinding Factory (used by ExpressionFactory)
// ============================================================================

/**
 * Factory for creating SoqlOrSoslBinding AST nodes.
 */
const SoqlOrSoslBindingFactory = {
  /**
   * Creates a SoqlOrSoslBinding AST node.
   * @param expr - The expression to bind.
   * @param options - Optional factory options.
   * @returns The created SoqlOrSoslBinding node.
   */
  createSoqlOrSoslBinding(
    expr: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): SoqlOrSoslBinding {
    return {
      expr,
      kind: 'SoqlOrSoslBinding',
      // Use the expression's location if available
      location: options?.location ?? expr.location,
    };
  },
};

// ============================================================================
// Initializer Factory (defined before ExpressionFactory which uses it)
// ============================================================================

/**
 * Factory for creating Initializer AST nodes.
 */
const InitializerFactory = {
  createConstructorInitializer(
    type: Readonly<TypeRef>,
    args: readonly Readonly<Expression>[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): ConstructorInitializer {
    return {
      args: [...args],
      kind: 'ConstructorInitializer',
      location: options?.location,
      type,
    };
  },

  createMapInitializer(
    type: Readonly<TypeRef>,
    pairs: readonly Readonly<{ key: Readonly<Expression>; value: Readonly<Expression> }>[],
    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return {
      kind: 'MapInitializer',
      location: options?.location,
      pairs: [...pairs],
      type,
    };
  },

  createSizedArrayInitializer(
    type: Readonly<TypeRef>,
    size: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return {
      kind: 'SizedArrayInitializer',
      location: options?.location,
      size,
      type,
    };
  },

  createValuesInitializer(
    type: Readonly<TypeRef>,
    values: readonly Expression[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return {
      kind: 'ValuesInitializer',
      location: options?.location,
      type,
      values: [...values],
    };
  },
};

// ============================================================================
// Expression Factory
// ============================================================================

/**
 * Factory for expression nodes.
 */
const ExpressionFactory = {
  /**
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
   * @deprecated Use createArrayExpression instead.
   */
  createArrayAccessExpression(
    array: Expression,
    index: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ArrayExpression {
    return ExpressionFactory.createArrayExpression(array, index, options);
  },

  /**
   * Creates an array access expression.
   * @param array - The expression representing the array to access.
   * @param index - The expression representing the index to access.
   * @param options - Optional factory options.
   * @returns The created array expression.
   */
  createArrayExpression(
    array: Expression,
    index: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): ArrayExpression {
    return {
      array,
      index,
      kind: 'ArrayExpression',
      location: options?.location,
    };
  },

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator.
   * @param options - Object with left (target), right (value), and optional factory options.
   * @returns The created assignment expression.
   */
  createAssignExpression(
    operator: AssignExpression['operator'],
    options: Readonly<{ left: Readonly<Expression>; right: Expression }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): AssignExpression {
    return {
      kind: 'AssignExpression',
      left: options.left,
      location: options.location,
      operator,
      right: options.right,
    };
  },

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator (e.g., '=', '+=', '-=').
   * @param options - Object with left (target), right (value), and optional factory options.
   * @returns The created assignment expression.
   * @deprecated Use createAssignExpression instead.
   */
  createAssignmentExpression(
    operator: AssignExpression['operator'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): AssignExpression {
    return ExpressionFactory.createAssignExpression(operator, options);
  },

  /**
   * Creates a binary expression.
   * @param operator - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param options - Object with left, right, and optional factory options.
   * @returns The created binary expression.
   */
  createBinaryExpression(
    operator: BinaryExpression['operator'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): BinaryExpression {
    return {
      kind: 'BinaryExpression',
      left: options.left,
      location: options.location,
      operator,
      right: options.right,
    };
  },

  /**
   * Creates a call expression.
   * @param options - MethodName, args, target, typeArguments, options.
   * @returns The created call expression.
   */
  createCallExpression(options: Readonly<CreateCallExpressionOptions>): CallExpression {
    const { args = [], methodName, options: opts, target, typeArguments } = options;
    return {
      arguments: [...args],
      kind: 'CallExpression',
      location: opts?.location,
      methodName,
      target,
      typeArguments: typeArguments ? [...typeArguments] : undefined,
    };
  },

  /**
   * Creates a cast expression.
   * @param type - The type to cast to.
   * @param expression - The expression to cast.
   * @param options - Optional factory options.
   * @returns The created cast expression.
   */
  createCastExpression(
    type: Readonly<TypeRef>,

    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return {
      expression,
      kind: 'CastExpression',
      location: options?.location,
      type,
    };
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
    target?: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): FieldExpression {
    return ExpressionFactory.createFieldExpression(fieldName, target, options);
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
    target?: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): FieldExpression {
    return {
      field: { kind: 'Identifier', location: options?.location, name: fieldName },
      fieldName,
      kind: 'FieldExpression',
      location: options?.location,
      target,
    };
  },

  /**
   * Creates an instanceof expression.
   * @param expression - The expression to check.
   * @param type - The type to check against.
   * @param options - Optional factory options.
   * @returns The created instanceof expression.
   */
  createInstanceOfExpression(
    expression: Readonly<Expression>,
    type: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): InstanceOfExpression {
    return {
      expression,
      kind: 'InstanceOfExpression',
      location: options?.location,
      type,
    };
  },

  /**
   * Creates a lambda expression.
   * @param parameters - The list of parameters for the lambda function.
   * @param body - The lambda body (expression or statement).
   * @param options - Optional factory options.
   * @returns The created lambda expression.
   */
  createLambdaExpression(
    parameters: readonly LambdaParameter[],

    body: Readonly<Expression | Statement>,

    options?: Readonly<NodeFactoryOptions>
  ): LambdaExpression {
    return {
      body,
      kind: 'LambdaExpression',
      location: options?.location,
      parameters: [...parameters],
    };
  },

  /**
   * Creates a method call expression.
   * @param options - MethodName, args, target, typeArguments, options.
   * @returns The created call expression.
   * @deprecated Use createCallExpression instead.
   */
  createMethodCallExpression(options: Readonly<CreateCallExpressionOptions>): CallExpression {
    return ExpressionFactory.createCallExpression(options);
  },

  /**
   * Creates a new array expression.
   * @param type - The type of the array elements.
   * @param size - The size expression for the array.
   * @param options - Optional factory options.
   * @returns The created new expression with a sized array initializer.
   */
  createNewArrayExpression(
    type: Readonly<TypeRef>,

    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return ExpressionFactory.createNewExpression(initializer, options);
  },

  /**
   * Creates a new expression (object instantiation).
   * @param initializer - The initializer for the new object.
   * @param options - Optional factory options.
   * @returns The created new expression.
   */
  createNewExpression(
    initializer: Readonly<
      Readonly<ConstructorInitializer | MapInitializer | SizedArrayInitializer | ValuesInitializer>
    >,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return {
      initializer,
      kind: 'NewExpression',
      location: options?.location,
      type: initializer.type,
    };
  },

  /**
   * Creates a parenthesized expression.
   * @param expression - The expression to wrap in parentheses.
   * @param options - Optional factory options.
   * @returns The created parenthesized expression.
   */
  createParenthesizedExpression(
    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): ParenthesizedExpression {
    return {
      expression,
      kind: 'ParenthesizedExpression',
      location: options?.location,
    };
  },

  /**
   * Creates a SOQL expression.
   * @param query - The SOQL query string.
   * @param bindings - The list of bindings for the SOQL query.
   * @param options - Optional factory options.
   * @returns The created SOQL expression.
   */
  createSoqlExpression(
    query: string,

    bindings: readonly SoqlOrSoslBinding[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): SoqlExpression {
    return {
      bindings: [...bindings],
      kind: 'SoqlExpression',
      location: options?.location,
      query,
    };
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
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
    );
    return ExpressionFactory.createSoqlExpression(query, bindings, options);
  },

  /**
   * Creates a SOSL expression.
   * @param query - The SOSL query string.
   * @param bindings - The list of bindings for the SOSL query.
   * @param options - Optional factory options.
   * @returns The created SOSL expression.
   */
  createSoslExpression(
    query: string,

    bindings: readonly SoqlOrSoslBinding[] = [],

    options?: Readonly<NodeFactoryOptions>
  ): SoslExpression {
    return {
      bindings: [...bindings],
      kind: 'SoslExpression',
      location: options?.location,
      query,
    };
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
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
    );
    return ExpressionFactory.createSoslExpression(query, bindings, options);
  },

  /**
   * Creates a super expression.
   * @param options - Optional factory options.
   * @returns The created super expression.
   */
  createSuperExpression(options?: Readonly<NodeFactoryOptions>): SuperExpression {
    return {
      kind: 'SuperExpression',
      location: options?.location,
    };
  },

  /**
   * Creates a ternary (conditional) expression.
   * @param options - Condition, thenExpression, elseExpression, options.
   * @returns The created ternary expression.
   */
  createTernaryExpression(options: Readonly<CreateTernaryExpressionOptions>): TernaryExpression {
    const { condition, elseExpression, options: opts, thenExpression } = options;
    return {
      condition,
      elseExpression,
      kind: 'TernaryExpression',
      location: opts?.location,
      thenExpression,
    };
  },

  /**
   * Creates a this expression.
   * @param options - Optional factory options.
   * @returns The created this expression.
   */
  createThisExpression(options?: Readonly<NodeFactoryOptions>): ThisExpression {
    return {
      kind: 'ThisExpression',
      location: options?.location,
    };
  },

  /**
   * Creates a trigger context variable expression.
   * @param variableName - The identifier name for the trigger context variable (e.g., 'isBefore', 'isAfter').
   * @param options - Optional factory options.
   * @returns The created trigger context variable expression.
   */
  createTriggerContextVariableExpression(
    variableName: string,
    options?: Readonly<NodeFactoryOptions>
  ): TriggerContextVariableExpression {
    return {
      kind: 'TriggerContextVariableExpression',
      location: options?.location,
      variableName,
    };
  },

  /**
   * Creates a unary expression.
   * @param operator - The unary operator to apply (e.g., '!', '++', '--').
   * @param options - Object with operand, prefix (boolean), and optional factory options.
   * @returns The created unary expression.
   */
  createUnaryExpression(
    operator: UnaryExpression['operator'],
    options: Readonly<{ operand: Readonly<Expression>; prefix: boolean }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): UnaryExpression {
    return {
      kind: 'UnaryExpression',
      location: options.location,
      operand: options.operand,
      operator,
      prefix: options.prefix,
    };
  },

  /**
   * Creates a variable expression.
   * @param id - The identifier for the variable.
   * @param options - Optional factory options.
   * @returns The created variable expression.
   */
  createVariableExpression(
    id: Identifier,
    options?: Readonly<NodeFactoryOptions>
  ): VariableExpression {
    return {
      id,
      kind: 'VariableExpression',
      location: options?.location,
    };
  },
};

// ============================================================================
// Literal Factory
// ============================================================================

/**
 * Factory for literal nodes.
 */
const LiteralFactory = {
  /**
   * Creates a boolean literal node (deprecated).
   * @param value - The boolean value (true or false) to store in the literal.
   * @param options - Optional factory options for location and other metadata.
   * @returns The created boolean literal expression.
   * @deprecated Use createBooleanVal instead.
   */
  createBooleanLiteral(value: boolean, options?: Readonly<NodeFactoryOptions>): BooleanVal {
    return LiteralFactory.createBooleanVal(value, options);
  },

  createBooleanVal(value: boolean, options?: Readonly<NodeFactoryOptions>): BooleanVal {
    return {
      kind: 'BooleanVal',
      location: options?.location,
      value,
    };
  },

  createDecimalVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): DecimalVal {
    return {
      kind: 'DecimalVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  },

  createDoubleVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): DoubleVal {
    return {
      kind: 'DoubleVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  },

  createIntegerVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): IntegerVal {
    return {
      kind: 'IntegerVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  },

  createLongVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): LongVal {
    return {
      kind: 'LongVal',
      location: options?.location,
      raw: raw ?? String(value),
      value,
    };
  },

  /**
   * Creates a null literal node (deprecated).
   * @param options - Optional factory options.
   * @returns The created null literal expression.
   * @deprecated Use createNullVal instead.
   */

  createNullLiteral(options?: Readonly<NodeFactoryOptions>): NullVal {
    return LiteralFactory.createNullVal(options);
  },
  createNullVal(options?: Readonly<NodeFactoryOptions>): NullVal {
    return {
      kind: 'NullVal',
      location: options?.location,
    };
  },

  /**
   * Creates a numeric literal node (deprecated).
   * @param value - The numeric value.
   * @param raw - The raw string representation.
   * @param options - Optional factory options.
   * @returns The created numeric literal expression.
   * @deprecated Use createIntegerVal, createDoubleVal, createLongVal, or createDecimalVal instead.
   */
  createNumberLiteral(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): IntegerVal {
    return LiteralFactory.createIntegerVal(value, raw, options);
  },

  /**
   * Creates a string literal node (deprecated).
   * @param value - The string content to store in the literal.
   * @param raw - The original string representation including quotes.
   * @param options - Optional factory options for location and other metadata.
   * @returns The created string literal expression.
   * @deprecated Use createStringVal instead.
   */
  createStringLiteral(
    value: string,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): StringVal {
    return LiteralFactory.createStringVal(value, raw, options);
  },
  createStringVal(value: string, raw?: string, options?: Readonly<NodeFactoryOptions>): StringVal {
    return {
      kind: 'StringVal',
      location: options?.location,
      raw: raw ?? `"${value}"`,
      value,
    };
  },
};

// ============================================================================
// ElementValue Factory
// ============================================================================

/**
 * Factory for creating ElementValue AST nodes.
 */
const ElementValueFactory = {
  createAnnotationElementValue(
    value: Readonly<Annotation>,
    options?: Readonly<NodeFactoryOptions>
  ): AnnotationElementValue {
    return {
      kind: 'AnnotationElementValue',
      location: options?.location,
      value,
    };
  },

  createArrayElementValue(
    values: readonly (AnnotationElementValue | ArrayElementValue | ExpressionElementValue)[],
    options?: Readonly<NodeFactoryOptions>
  ): ArrayElementValue {
    return {
      kind: 'ArrayElementValue',
      location: options?.location,
      values: [...values],
    };
  },

  createExpressionElementValue(
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionElementValue {
    return {
      kind: 'ExpressionElementValue',
      location: options?.location,
      value,
    };
  },
};

export type { CreateCallExpressionOptions, CreateTernaryExpressionOptions };
export {
  ExpressionFactory,
  SoqlOrSoslBindingFactory,
  LiteralFactory,
  InitializerFactory,
  ElementValueFactory,
};
