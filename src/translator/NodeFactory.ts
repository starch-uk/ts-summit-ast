/**
 * Factory for creating AST nodes
 * Provides helper functions to construct AST nodes with proper typing
 */

import type { SourceRange } from '../ast/base.js';
import type {
  IfStatement,
  ForStatement,
  WhileStatement,
  ReturnStatement,
  Block,
  ExpressionStatement,
  VariableDeclarationStatement,
} from '../ast/nodes/Statement.js';
import type {
  BinaryExpression,
  MethodCallExpression,
  Identifier,
} from '../ast/nodes/Expression.js';
import type {
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
} from '../ast/nodes/Literal.js';
import type {
  PrimitiveType,
  ClassType,
} from '../ast/nodes/Type.js';
import type {
  VariableDeclaration,
} from '../ast/nodes/Declaration.js';
import type { Modifier } from '../ast/nodes/Modifier.js';
import type { Expression } from '../ast/nodes/Expression.js';
import type { Statement } from '../ast/nodes/Statement.js';
import type { Type } from '../ast/nodes/Type.js';

/**
 * Options for creating AST nodes
 */
export interface NodeFactoryOptions {
  readonly location?: SourceRange;
}

/**
 * Factory class for creating AST nodes
 */
export class NodeFactory {
  /**
   * Create an IfStatement node
   */
  static createIfStatement(
    condition: Expression,
    thenBody: Statement,
    elseBody?: Statement,
    options?: NodeFactoryOptions
  ): IfStatement {
    return {
      kind: 'IfStatement',
      condition,
      thenBody,
      elseBody,
      location: options?.location,
    };
  }

  /**
   * Create a ForStatement node
   */
  static createForStatement(
    body: Statement,
    init?: ExpressionStatement | VariableDeclarationStatement,
    condition?: Expression,
    update?: Expression,
    options?: NodeFactoryOptions
  ): ForStatement {
    return {
      kind: 'ForStatement',
      init,
      condition,
      update,
      body,
      location: options?.location,
    };
  }

  /**
   * Create a WhileStatement node
   */
  static createWhileStatement(
    condition: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): WhileStatement {
    return {
      kind: 'WhileStatement',
      condition,
      body,
      location: options?.location,
    };
  }

  /**
   * Create a ReturnStatement node
   */
  static createReturnStatement(
    expression?: Expression,
    options?: NodeFactoryOptions
  ): ReturnStatement {
    return {
      kind: 'ReturnStatement',
      expression,
      location: options?.location,
    };
  }

  /**
   * Create a Block node
   */
  static createBlock(
    statements: Statement[],
    options?: NodeFactoryOptions
  ): Block {
    return {
      kind: 'Block',
      statements,
      location: options?.location,
    };
  }

  /**
   * Create an ExpressionStatement node
   */
  static createExpressionStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ExpressionStatement {
    return {
      kind: 'ExpressionStatement',
      expression,
      location: options?.location,
    };
  }

  /**
   * Create a BinaryExpression node
   */
  static createBinaryExpression(
    operator: BinaryExpression['operator'],
    left: Expression,
    right: Expression,
    options?: NodeFactoryOptions
  ): BinaryExpression {
    return {
      kind: 'BinaryExpression',
      operator,
      left,
      right,
      location: options?.location,
    };
  }

  /**
   * Create a MethodCallExpression node
   */
  static createMethodCallExpression(
    methodName: string,
    args: Expression[] = [],
    target?: Expression,
    typeArguments?: Type[],
    options?: NodeFactoryOptions
  ): MethodCallExpression {
    return {
      kind: 'MethodCallExpression',
      target,
      methodName,
      arguments: args,
      typeArguments,
      location: options?.location,
    };
  }

  /**
   * Create an Identifier node
   */
  static createIdentifier(
    name: string,
    options?: NodeFactoryOptions
  ): Identifier {
    return {
      kind: 'Identifier',
      name,
      location: options?.location,
    };
  }

  /**
   * Create a StringLiteral node
   */
  static createStringLiteral(
    value: string,
    raw?: string,
    options?: NodeFactoryOptions
  ): StringLiteral {
    return {
      kind: 'StringLiteral',
      value,
      raw: raw ?? `"${value}"`,
      location: options?.location,
    };
  }

  /**
   * Create a NumberLiteral node
   */
  static createNumberLiteral(
    value: number,
    raw?: string,
    options?: NodeFactoryOptions
  ): NumberLiteral {
    return {
      kind: 'NumberLiteral',
      value,
      raw: raw ?? String(value),
      location: options?.location,
    };
  }

  /**
   * Create a BooleanLiteral node
   */
  static createBooleanLiteral(
    value: boolean,
    options?: NodeFactoryOptions
  ): BooleanLiteral {
    return {
      kind: 'BooleanLiteral',
      value,
      location: options?.location,
    };
  }

  /**
   * Create a NullLiteral node
   */
  static createNullLiteral(options?: NodeFactoryOptions): NullLiteral {
    return {
      kind: 'NullLiteral',
      location: options?.location,
    };
  }

  /**
   * Create a PrimitiveType node
   */
  static createPrimitiveType(
    name: string,
    options?: NodeFactoryOptions
  ): PrimitiveType {
    return {
      kind: 'PrimitiveType',
      name,
      location: options?.location,
    };
  }

  /**
   * Create a ClassType node
   */
  static createClassType(
    name: string,
    packageName?: string,
    options?: NodeFactoryOptions
  ): ClassType {
    return {
      kind: 'ClassType',
      name,
      packageName,
      location: options?.location,
    };
  }

  /**
   * Create a VariableDeclaration node
   */
  static createVariableDeclaration(
    name: string,
    type: Type,
    initializer?: Expression,
    modifiers?: Modifier[],
    options?: NodeFactoryOptions
  ): VariableDeclaration {
    return {
      kind: 'VariableDeclaration',
      name,
      type,
      modifiers,
      initializer,
      location: options?.location,
    };
  }

  /**
   * Create a VariableDeclarationStatement node
   */
  static createVariableDeclarationStatement(
    declaration: VariableDeclaration,
    options?: NodeFactoryOptions
  ): VariableDeclarationStatement {
    return {
      kind: 'VariableDeclarationStatement',
      declaration,
      location: options?.location,
    };
  }
}
