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
  UntranslatedExpression,
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
import { toCanonicalSourceLocation } from '../ast/baseNode.js';
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
      '@type': 'SoqlOrSoslBinding',
      expr,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ConstructorInitializer',
      args: [...args],
      type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createMapInitializer(
    type: Readonly<TypeRef>,
    pairs: readonly Readonly<{ key: Readonly<Expression>; value: Readonly<Expression> }>[],
    options?: Readonly<NodeFactoryOptions>
  ): MapInitializer {
    return {
      '@type': 'MapInitializer',
      pairs: [...pairs].map(({ key, value }) => ({ first: key, second: value })),
      type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createSizedArrayInitializer(
    type: Readonly<TypeRef>,
    size: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): SizedArrayInitializer {
    return {
      '@type': 'SizedArrayInitializer',
      size,
      type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createValuesInitializer(
    type: Readonly<TypeRef>,
    values: readonly Expression[] = [],
    options?: Readonly<NodeFactoryOptions>
  ): ValuesInitializer {
    return {
      '@type': 'ValuesInitializer',
      type,
      values: [...values],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ArrayExpression',
      array,
      index,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'AssignExpression',
      operator,
      source: options.right,
      target: options.left,
      ...(options.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
   * @param op - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param options - Object with left, right, and optional factory options.
   * @returns The created binary expression.
   */
  createBinaryExpression(
    op: BinaryExpression['op'],
    options: Readonly<{ left: Readonly<Expression>; right: Readonly<Expression> }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): BinaryExpression {
    return {
      '@type': 'BinaryExpression',
      left: options.left,
      op,
      right: options.right,
      ...(options.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a call expression.
   * @param options - MethodName, args, target, typeArguments, options.
   * @returns The created call expression.
   */
  createCallExpression(options: Readonly<CreateCallExpressionOptions>): CallExpression {
    const { args = [], methodName, options: opts, target, typeArguments } = options;
    const EMPTY_LENGTH = 0;
    return {
      '@type': 'CallExpression',
      args: [...args],
      id: {
        '@type': 'Identifier',
        string: methodName,
        ...(opts?.location && { sourceLocation: toCanonicalSourceLocation(opts.location) }),
      },
      receiver: target,
      ...(typeArguments != null &&
        typeArguments.length > EMPTY_LENGTH && { typeArguments: [...typeArguments] }),
      ...(opts?.location && { sourceLocation: toCanonicalSourceLocation(opts.location) }),
    };
  },

  /**
   * Creates a cast expression.
   * @param type - The type to cast to.
   * @param value - The expression to cast.
   * @param options - Optional factory options.
   * @returns The created cast expression.
   */
  createCastExpression(
    type: Readonly<TypeRef>,
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): CastExpression {
    return {
      '@type': 'CastExpression',
      type,
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
   * @param obj - The target expression to access the field on.
   * @param options - Optional factory options.
   * @returns The created field expression.
   */
  createFieldExpression(
    fieldName: string,
    obj?: Expression,
    options?: Readonly<NodeFactoryOptions>
  ): FieldExpression {
    return {
      '@type': 'FieldExpression',
      field: {
        '@type': 'Identifier',
        string: fieldName,
        ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
      },
      obj,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'InstanceOfExpression',
      expression,
      type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'LambdaExpression',
      body,
      parameters: [...parameters],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      ConstructorInitializer | MapInitializer | SizedArrayInitializer | ValuesInitializer
    >,
    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return {
      '@type': 'NewExpression',
      initializer,
      type: initializer.type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'ParenthesizedExpression',
      expression,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'SoqlExpression',
      bindings: [...bindings],
      query,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'SoslExpression',
      bindings: [...bindings],
      query,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'SuperExpression',
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'TernaryExpression',
      condition,
      elseValue: elseExpression,
      thenValue: thenExpression,
      ...(opts?.location && { sourceLocation: toCanonicalSourceLocation(opts.location) }),
    };
  },

  /**
   * Creates a this expression.
   * @param options - Optional factory options.
   * @returns The created this expression.
   */
  createThisExpression(options?: Readonly<NodeFactoryOptions>): ThisExpression {
    return {
      '@type': 'ThisExpression',
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'TriggerContextVariableExpression',
      variableName,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates a unary expression.
   * @param op - The unary operator to apply (e.g., '!', '++', '--').
   * @param options - Object with operand, prefix (boolean), and optional factory options.
   * @returns The created unary expression.
   */
  createUnaryExpression(
    op: UnaryExpression['op'],
    options: Readonly<{ operand: Readonly<Expression>; prefix: boolean }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): UnaryExpression {
    return {
      '@type': 'UnaryExpression',
      op,
      prefix: options.prefix,
      value: options.operand,
      ...(options.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'VariableExpression',
      id,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  /**
   * Creates an untranslated expression placeholder (used when translation fails).
   * @param options - Optional factory options.
   * @returns The created untranslated expression.
   */
  createUntranslatedExpression(options?: Readonly<NodeFactoryOptions>): UntranslatedExpression {
    return {
      '@type': 'UntranslatedExpression',
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'BooleanVal',
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createDecimalVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): DecimalVal {
    return {
      '@type': 'DecimalVal',
      raw: raw ?? String(value),
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createDoubleVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): DoubleVal {
    return {
      '@type': 'DoubleVal',
      raw: raw ?? String(value),
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createIntegerVal(
    value: number,
    raw?: string,
    options?: Readonly<NodeFactoryOptions>
  ): IntegerVal {
    return {
      '@type': 'IntegerVal',
      raw: raw ?? String(value),
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createLongVal(value: number, raw?: string, options?: Readonly<NodeFactoryOptions>): LongVal {
    return {
      '@type': 'LongVal',
      raw: raw ?? String(value),
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'NullVal',
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'StringVal',
      raw: raw ?? `"${value}"`,
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'AnnotationElementValue',
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createArrayElementValue(
    values: readonly (AnnotationElementValue | ArrayElementValue | ExpressionElementValue)[],
    options?: Readonly<NodeFactoryOptions>
  ): ArrayElementValue {
    return {
      '@type': 'ArrayElementValue',
      values: [...values],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createExpressionElementValue(
    value: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): ExpressionElementValue {
    return {
      '@type': 'ExpressionElementValue',
      value,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
