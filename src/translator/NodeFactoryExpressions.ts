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
} from '../ast/Expression.js';
import type { Expression, Statement } from '../ast/index.js';
import type { TypeRef } from '../ast/Type.js';
import type { Identifier } from '../ast/Identifier.js';
import type { Initializer } from '../ast/Initializer.js';
import type { SoqlOrSoslBinding } from '../ast/SoqlOrSoslBinding.js';
import { InitializerFactory } from './NodeFactoryInitializers.js';
import { SoqlOrSoslBindingFactory } from './NodeFactorySoqlOrSoslBinding.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Options for creating AST nodes.
 */

/**
 * Factory for expression nodes.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class ExpressionFactory {
  /**
   * Creates a binary expression.
   * @param operator - The binary operator to apply (e.g., '+', '-', '==', '!=').
   * @param left - The left-hand side expression.
   * @param right - The right-hand side expression.
   * @param options - Optional factory options.
   * @returns The created binary expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 4 parameters
  public static createBinaryExpression(
    operator: BinaryExpression['operator'],
    left: Readonly<Expression>,
    right: Readonly<Expression>,
    options?: Readonly<NodeFactoryOptions>
  ): BinaryExpression {
    return {
      kind: 'BinaryExpression',
      left,
      location: options?.location,
      operator,
      right,
    };
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
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
  public static createCallExpression(
    methodName: string,

    args: readonly Readonly<Expression>[] = [],

    target?: Readonly<Expression>,
    typeArguments?: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return {
      arguments: [...args],
      kind: 'CallExpression',
      location: options?.location,
      methodName,
      target,
      typeArguments: typeArguments ? [...typeArguments] : undefined,
    };
  }

  /**
   * Creates a variable expression.
   * @param id - The identifier for the variable.
   * @param options - Optional factory options.
   * @returns The created variable expression.
   */
  public static createVariableExpression(
    id: Identifier,
    options?: NodeFactoryOptions
  ): VariableExpression {
    return {
      id,
      kind: 'VariableExpression',
      location: options?.location,
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
    return {
      kind: 'UnaryExpression',
      location: options?.location,
      operand,
      operator,
      prefix,
    };
  }

  /**
   * Creates an assignment expression.
   * @param operator - The assignment operator.
   * @param left - The left-hand side expression (target).
   * @param right - The right-hand side expression (value).
   * @param options - Optional factory options.
   * @returns The created assignment expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Assign expression requires 4 parameters
  public static createAssignExpression(
    operator: AssignExpression['operator'],

    left: Readonly<Expression>,
    right: Expression,
    options?: NodeFactoryOptions
  ): AssignExpression {
    return {
      kind: 'AssignExpression',
      left,
      location: options?.location,
      operator,
      right,
    };
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
    return {
      field: { kind: 'Identifier', location: options?.location, name: fieldName },
      fieldName,
      kind: 'FieldExpression',
      location: options?.location,
      target,
    };
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
    return {
      array,
      index,
      kind: 'ArrayExpression',
      location: options?.location,
    };
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

  /**
   * Creates a ternary (conditional) expression.
   * @param condition - The boolean expression to evaluate.
   * @param thenExpression - The expression to evaluate if condition is true.
   * @param elseExpression - The expression to evaluate if condition is false.
   * @param options - Optional factory options.
   * @returns The created ternary expression.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Ternary expression requires 4 parameters
  public static createTernaryExpression(
    condition: Readonly<Expression>,

    thenExpression: Readonly<Expression>,
    elseExpression: Expression,
    options?: NodeFactoryOptions
  ): TernaryExpression {
    return {
      condition,
      elseExpression,
      kind: 'TernaryExpression',
      location: options?.location,
      thenExpression,
    };
  }

  /**
   * Creates a cast expression.
   * @param type - The type to cast to.
   * @param expression - The expression to cast.
   * @param options - Optional factory options.
   * @returns The created cast expression.
   */
  public static createCastExpression(
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
  }

  /**
   * Creates an instanceof expression.
   * @param expression - The expression to check.
   * @param type - The type to check against.
   * @param options - Optional factory options.
   * @returns The created instanceof expression.
   */
  public static createInstanceOfExpression(
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
  }

  /**
   * Creates a new expression (object instantiation).
   * @param initializer - The initializer for the new object.
   * @param options - Optional factory options.
   * @returns The created new expression.
   */
  public static createNewExpression(
    initializer: Readonly<Initializer>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    return {
      initializer,
      kind: 'NewExpression',
      location: options?.location,
      type: initializer.type,
    };
  }

  /**
   * Creates a new array expression.
   * @param type - The type of the array elements.
   * @param size - The size expression for the array.
   * @param options - Optional factory options.
   * @returns The created new expression with a sized array initializer.
   */
  public static createNewArrayExpression(
    type: Readonly<TypeRef>,

    size: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return this.createNewExpression(initializer, options);
  }

  /**
   * Creates a lambda expression.
   * @param parameters - The list of parameters for the lambda function.
   * @param body - The lambda body (expression or statement).
   * @param options - Optional factory options.
   * @returns The created lambda expression.
   */
  public static createLambdaExpression(
    parameters: readonly LambdaParameter[],

    body: Readonly<Expression | Statement>,

    options?: Readonly<NodeFactoryOptions>
  ): LambdaExpression {
    const result: LambdaExpression = {
      body,
      kind: 'LambdaExpression',
      location: options?.location,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- readonly array is assignable to mutable array for readonly property
      parameters: parameters as any,
    };
    return result;
  }

  /**
   * Creates a this expression.
   * @param options - Optional factory options.
   * @returns The created this expression.
   */
  public static createThisExpression(options?: NodeFactoryOptions): ThisExpression {
    return {
      kind: 'ThisExpression',
      location: options?.location,
    };
  }

  /**
   * Creates a super expression.
   * @param options - Optional factory options.
   * @returns The created super expression.
   */
  public static createSuperExpression(options?: NodeFactoryOptions): SuperExpression {
    return {
      kind: 'SuperExpression',
      location: options?.location,
    };
  }

  /**
   * Creates a parenthesized expression.
   * @param expression - The expression to wrap in parentheses.
   * @param options - Optional factory options.
   * @returns The created parenthesized expression.
   */
  public static createParenthesizedExpression(
    expression: Readonly<Expression>,

    options?: Readonly<NodeFactoryOptions>
  ): ParenthesizedExpression {
    return {
      expression,
      kind: 'ParenthesizedExpression',
      location: options?.location,
    };
  }

  /**
   * Creates a SOQL expression.
   * @param query - The SOQL query string.
   * @param bindings - The list of bindings for the SOQL query.
   * @param options - Optional factory options.
   * @returns The created SOQL expression.
   */
  public static createSoqlExpression(
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
  }

  /**
   * Creates a SOSL expression.
   * @param query - The SOSL query string.
   * @param bindings - The list of bindings for the SOSL query.
   * @param options - Optional factory options.
   * @returns The created SOSL expression.
   */
  public static createSoslExpression(
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
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
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
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoslExpression(query, bindings, options);
  }

  /**
   * Creates a trigger context variable expression.
   * @param variableName - The identifier name for the trigger context variable (e.g., 'isBefore', 'isAfter').
   * @param options - Optional factory options.
   * @returns The created trigger context variable expression.
   */
  public static createTriggerContextVariableExpression(
    variableName: string,
    options?: NodeFactoryOptions
  ): TriggerContextVariableExpression {
    return {
      kind: 'TriggerContextVariableExpression',
      location: options?.location,
      variableName,
    };
  }
}
