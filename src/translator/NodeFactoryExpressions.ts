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
import type { TypeRef, Type } from '../ast/Type.js';
import type { Identifier } from '../ast/Identifier.js';
import type { Initializer } from '../ast/Initializer.js';
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

  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
  public static createCallExpression(
    methodName: string,
    args: readonly Readonly<Expression>[] = [],
    target?: Readonly<Expression>,
    typeArguments?: readonly Readonly<TypeRef>[],
    options?: Readonly<NodeFactoryOptions>
  ): CallExpression {
    return {
      arguments: [...args],
      kind: 'CallExpression',
      location: options?.location,
      methodName,
      target,
      typeArguments: (typeArguments as Type[] | undefined) ?? undefined,
    };
  }

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
   * @param methodName
   * @param args
   * @param target
   * @param typeArguments
   * @param options
   * @deprecated Use createCallExpression instead.
   */
  public static createMethodCallExpression(
    methodName: string,
    args: Expression[] = [],
    target?: Expression,
    typeArguments?: TypeRef[],
    options?: NodeFactoryOptions
  ): CallExpression {
    return this.createCallExpression(methodName, args, target, typeArguments, options);
  }

  public static createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Expression,
    prefix: boolean,
    options?: NodeFactoryOptions
  ): UnaryExpression {
    return {
      kind: 'UnaryExpression',
      location: options?.location,
      operand,
      operator,
      prefix,
    };
  }

  public static createAssignExpression(
    operator: AssignExpression['operator'],
    left: Expression,
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
   * @param operator
   * @param left
   * @param right
   * @param options
   * @deprecated Use createAssignExpression instead.
   */
  public static createAssignmentExpression(
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

  public static createTernaryExpression(
    condition: Expression,
    thenExpression: Expression,
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

  public static createCastExpression(
    type: TypeRef,
    expression: Expression,
    options?: NodeFactoryOptions
  ): CastExpression {
    return {
      expression,
      kind: 'CastExpression',
      location: options?.location,
      type,
    };
  }

  public static createInstanceOfExpression(
    expression: Expression,
    type: TypeRef,
    options?: NodeFactoryOptions
  ): InstanceOfExpression {
    return {
      expression,
      kind: 'InstanceOfExpression',
      location: options?.location,
      type,
    };
  }

  public static createNewExpression(
    initializer: Initializer,
    options?: NodeFactoryOptions
  ): NewExpression {
    return {
      initializer,
      kind: 'NewExpression',
      location: options?.location,
      type: initializer.type,
    };
  }

  public static createNewArrayExpression(
    type: TypeRef,
    size: Expression,
    options?: NodeFactoryOptions
  ): NewExpression {
    // Create SizedArrayInitializer and wrap in NewExpression
    const initializer = InitializerFactory.createSizedArrayInitializer(type, size, options);
    return this.createNewExpression(initializer, options);
  }

  public static createLambdaExpression(
    parameters: LambdaParameter[],
    body: Expression | Statement,
    options?: NodeFactoryOptions
  ): LambdaExpression {
    return {
      body,
      kind: 'LambdaExpression',
      location: options?.location,
      parameters,
    };
  }

  public static createThisExpression(options?: NodeFactoryOptions): ThisExpression {
    return {
      kind: 'ThisExpression',
      location: options?.location,
    };
  }

  public static createSuperExpression(options?: NodeFactoryOptions): SuperExpression {
    return {
      kind: 'SuperExpression',
      location: options?.location,
    };
  }

  public static createParenthesizedExpression(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ParenthesizedExpression {
    return {
      expression,
      kind: 'ParenthesizedExpression',
      location: options?.location,
    };
  }

  public static createSoqlExpression(
    query: string,
    bindings: import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: NodeFactoryOptions
  ): SoqlExpression {
    return {
      bindings,
      kind: 'SoqlExpression',
      location: options?.location,
      query,
    };
  }

  public static createSoslExpression(
    query: string,
    bindings: import('../ast/SoqlOrSoslBinding.js').SoqlOrSoslBinding[] = [],
    options?: NodeFactoryOptions
  ): SoslExpression {
    return {
      bindings,
      kind: 'SoslExpression',
      location: options?.location,
      query,
    };
  }

  /**
   * @param query
   * @param boundExpressions
   * @param options
   * @deprecated Use createSoqlExpression instead.
   */
  public static createSoqlQueryExpression(
    query: string,
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoqlExpression {
    // Convert boundExpressions to bindings for backward compatibility
    const bindings = (boundExpressions ?? []).map((expr) =>
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
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
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoslExpression {
    // Convert boundExpressions to bindings for backward compatibility
    const bindings = (boundExpressions ?? []).map((expr) =>
      SoqlOrSoslBindingFactory.createSoqlOrSoslBinding(expr, options)
    );
    return this.createSoslExpression(query, bindings, options);
  }

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
