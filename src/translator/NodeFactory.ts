/**
 * Factory for creating AST nodes
 * Provides helper functions to construct AST nodes with proper typing
 */

import type { SourceRange } from '../ast/base.js';
import type {
  IfStatement,
  ForStatement,
  ForEachStatement,
  WhileStatement,
  DoWhileStatement,
  SwitchStatement,
  TryStatement,
  ReturnStatement,
  BreakStatement,
  ContinueStatement,
  ThrowStatement,
  Block,
  ExpressionStatement,
  VariableDeclarationStatement,
  DmlStatement,
  DmlOperation,
} from '../ast/nodes/Statement.js';
import type { AnnotationDeclaration } from '../ast/nodes/Declaration.js';
import type {
  BinaryExpression,
  UnaryExpression,
  AssignmentExpression,
  MethodCallExpression,
  FieldAccessExpression,
  ArrayAccessExpression,
  NewExpression,
  CastExpression,
  InstanceOfExpression,
  TernaryExpression,
  LambdaExpression,
  Identifier,
  ThisExpression,
  SuperExpression,
  ParenthesizedExpression,
  SoqlQueryExpression,
  SoslQueryExpression,
  TriggerContextVariableExpression,
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
  ArrayType,
  GenericType,
} from '../ast/nodes/Type.js';
import type {
  VariableDeclaration,
  ClassDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  ConstructorDeclaration,
  PropertyDeclaration,
  EnumDeclaration,
  EnumConstantDeclaration,
  TypeParameter,
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
    thenStatement: Statement,
    elseStatement?: Statement,
    options?: NodeFactoryOptions
  ): IfStatement {
    return {
      kind: 'IfStatement',
      condition,
      thenStatement,
      elseStatement,
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

  /**
   * Create a ForEachStatement node
   */
  static createForEachStatement(
    variable: VariableDeclaration,
    iterable: Expression,
    body: Statement,
    options?: NodeFactoryOptions
  ): ForEachStatement {
    return {
      kind: 'ForEachStatement',
      variable,
      iterable,
      body,
      location: options?.location,
    };
  }

  /**
   * Create a DoWhileStatement node
   */
  static createDoWhileStatement(
    body: Statement,
    condition: Expression,
    options?: NodeFactoryOptions
  ): DoWhileStatement {
    return {
      kind: 'DoWhileStatement',
      body,
      condition,
      location: options?.location,
    };
  }

  /**
   * Create a SwitchStatement node
   */
  static createSwitchStatement(
    expression: Expression,
    cases: any[],
    defaultCase?: any,
    options?: NodeFactoryOptions
  ): SwitchStatement {
    return {
      kind: 'SwitchStatement',
      expression,
      cases,
      defaultCase,
      location: options?.location,
    };
  }

  /**
   * Create a TryStatement node
   */
  static createTryStatement(
    tryBlock: Block,
    catchClauses: any[],
    finallyBlock?: Block,
    options?: NodeFactoryOptions
  ): TryStatement {
    return {
      kind: 'TryStatement',
      tryBlock,
      catchClauses,
      finallyBlock,
      location: options?.location,
    };
  }

  /**
   * Create a BreakStatement node
   */
  static createBreakStatement(
    label?: string,
    options?: NodeFactoryOptions
  ): BreakStatement {
    return {
      kind: 'BreakStatement',
      label,
      location: options?.location,
    };
  }

  /**
   * Create a ContinueStatement node
   */
  static createContinueStatement(
    label?: string,
    options?: NodeFactoryOptions
  ): ContinueStatement {
    return {
      kind: 'ContinueStatement',
      label,
      location: options?.location,
    };
  }

  /**
   * Create a ThrowStatement node
   */
  static createThrowStatement(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ThrowStatement {
    return {
      kind: 'ThrowStatement',
      expression,
      location: options?.location,
    };
  }

  /**
   * Create an UnaryExpression node
   */
  static createUnaryExpression(
    operator: UnaryExpression['operator'],
    operand: Expression,
    prefix: boolean,
    options?: NodeFactoryOptions
  ): UnaryExpression {
    return {
      kind: 'UnaryExpression',
      operator,
      operand,
      prefix,
      location: options?.location,
    };
  }

  /**
   * Create an AssignmentExpression node
   */
  static createAssignmentExpression(
    operator: AssignmentExpression['operator'],
    left: Expression,
    right: Expression,
    options?: NodeFactoryOptions
  ): AssignmentExpression {
    return {
      kind: 'AssignmentExpression',
      operator,
      left,
      right,
      location: options?.location,
    };
  }

  /**
   * Create a FieldAccessExpression node
   */
  static createFieldAccessExpression(
    fieldName: string,
    target?: Expression,
    options?: NodeFactoryOptions
  ): FieldAccessExpression {
    return {
      kind: 'FieldAccessExpression',
      target,
      fieldName,
      location: options?.location,
    };
  }

  /**
   * Create an ArrayAccessExpression node
   */
  static createArrayAccessExpression(
    array: Expression,
    index: Expression,
    options?: NodeFactoryOptions
  ): ArrayAccessExpression {
    return {
      kind: 'ArrayAccessExpression',
      array,
      index,
      location: options?.location,
    };
  }

  /**
   * Create a TernaryExpression node
   */
  static createTernaryExpression(
    condition: Expression,
    thenExpression: Expression,
    elseExpression: Expression,
    options?: NodeFactoryOptions
  ): TernaryExpression {
    return {
      kind: 'TernaryExpression',
      condition,
      thenExpression,
      elseExpression,
      location: options?.location,
    };
  }

  /**
   * Create a CastExpression node
   */
  static createCastExpression(
    type: Type,
    expression: Expression,
    options?: NodeFactoryOptions
  ): CastExpression {
    return {
      kind: 'CastExpression',
      type,
      expression,
      location: options?.location,
    };
  }

  /**
   * Create an InstanceOfExpression node
   */
  static createInstanceOfExpression(
    expression: Expression,
    type: Type,
    options?: NodeFactoryOptions
  ): InstanceOfExpression {
    return {
      kind: 'InstanceOfExpression',
      expression,
      type,
      location: options?.location,
    };
  }

  /**
   * Create a NewExpression node
   */
  static createNewExpression(
    type: Type,
    args?: Expression[],
    arrayInitializer?: Expression[],
    options?: NodeFactoryOptions
  ): NewExpression {
    return {
      kind: 'NewExpression',
      type,
      arguments: args,
      arrayInitializer,
      location: options?.location,
    };
  }

  /**
   * Create a NewArrayExpression node (for new Type[size])
   */
  static createNewArrayExpression(
    type: Type,
    size: Expression,
    options?: NodeFactoryOptions
  ): NewExpression {
    // NewArrayExpression is represented as NewExpression with arrayInitializer
    return {
      kind: 'NewExpression',
      type,
      arrayInitializer: [size],
      location: options?.location,
    };
  }

  /**
   * Create a LambdaExpression node
   */
  static createLambdaExpression(
    parameters: any[],
    body: Expression | Statement,
    options?: NodeFactoryOptions
  ): LambdaExpression {
    return {
      kind: 'LambdaExpression',
      parameters,
      body,
      location: options?.location,
    };
  }

  /**
   * Create a ThisExpression node
   */
  static createThisExpression(options?: NodeFactoryOptions): ThisExpression {
    return {
      kind: 'ThisExpression',
      location: options?.location,
    };
  }

  /**
   * Create a SuperExpression node
   */
  static createSuperExpression(options?: NodeFactoryOptions): SuperExpression {
    return {
      kind: 'SuperExpression',
      location: options?.location,
    };
  }

  /**
   * Create a ParenthesizedExpression node
   */
  static createParenthesizedExpression(
    expression: Expression,
    options?: NodeFactoryOptions
  ): ParenthesizedExpression {
    return {
      kind: 'ParenthesizedExpression',
      expression,
      location: options?.location,
    };
  }

  /**
   * Create a ClassDeclaration node
   */
  static createClassDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: Type,
    implementsClause?: Type[],
    typeParameters?: any[],
    options?: NodeFactoryOptions
  ): ClassDeclaration {
    return {
      kind: 'ClassDeclaration',
      name,
      modifiers,
      typeParameters,
      extendsClause,
      implementsClause,
      members,
      location: options?.location,
    };
  }

  /**
   * Create an InterfaceDeclaration node
   */
  static createInterfaceDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: Type[],
    typeParameters?: any[],
    options?: NodeFactoryOptions
  ): InterfaceDeclaration {
    return {
      kind: 'InterfaceDeclaration',
      name,
      modifiers,
      typeParameters,
      extendsClause,
      members,
      location: options?.location,
    };
  }

  /**
   * Create a MethodDeclaration node
   */
  static createMethodDeclaration(
    name: string,
    returnType: Type,
    parameters: any[] = [],
    body?: Block,
    modifiers: Modifier[] = [],
    typeParameters?: any[],
    annotations?: any[],
    options?: NodeFactoryOptions
  ): MethodDeclaration {
    return {
      kind: 'MethodDeclaration',
      name,
      modifiers,
      returnType,
      typeParameters,
      parameters,
      body,
      annotations,
      location: options?.location,
    };
  }

  /**
   * Create a ConstructorDeclaration node
   */
  static createConstructorDeclaration(
    parameters: any[] = [],
    body: Block,
    modifiers: Modifier[] = [],
    annotations?: any[],
    options?: NodeFactoryOptions
  ): ConstructorDeclaration {
    return {
      kind: 'ConstructorDeclaration',
      modifiers,
      parameters,
      body,
      annotations,
      location: options?.location,
    };
  }

  /**
   * Create a PropertyDeclaration node
   */
  static createPropertyDeclaration(
    name: string,
    type: Type,
    modifiers: Modifier[] = [],
    getter?: Block,
    setter?: Block,
    annotations?: any[],
    options?: NodeFactoryOptions
  ): PropertyDeclaration {
    return {
      kind: 'PropertyDeclaration',
      name,
      type,
      modifiers,
      getter,
      setter,
      annotations,
      location: options?.location,
    };
  }

  /**
   * Create an EnumDeclaration node
   */
  static createEnumDeclaration(
    name: string,
    constants: EnumConstantDeclaration[],
    modifiers: Modifier[] = [],
    members?: any[],
    options?: NodeFactoryOptions
  ): EnumDeclaration {
    return {
      kind: 'EnumDeclaration',
      name,
      modifiers,
      constants,
      members,
      location: options?.location,
    };
  }

  /**
   * Create an EnumConstantDeclaration node
   */
  static createEnumConstantDeclaration(
    name: string,
    args?: Expression[],
    body?: ClassDeclaration,
    options?: NodeFactoryOptions
  ): EnumConstantDeclaration {
    return {
      kind: 'EnumConstantDeclaration',
      name,
      arguments: args,
      body,
      location: options?.location,
    };
  }

  /**
   * Create an ArrayType node
   */
  static createArrayType(
    elementType: Type,
    dimensions: number = 1,
    options?: NodeFactoryOptions
  ): ArrayType {
    return {
      kind: 'ArrayType',
      elementType,
      dimensions,
      location: options?.location,
    };
  }

  /**
   * Create a GenericType node
   */
  static createGenericType(
    baseType: Type,
    typeArguments: Type[],
    options?: NodeFactoryOptions
  ): GenericType {
    return {
      kind: 'GenericType',
      baseType,
      typeArguments,
      location: options?.location,
    };
  }

  /**
   * Create an AnnotationDeclaration node
   */
  static createAnnotationDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    options?: NodeFactoryOptions
  ): AnnotationDeclaration {
    return {
      kind: 'AnnotationDeclaration',
      name,
      modifiers,
      members,
      location: options?.location,
    };
  }

  /**
   * Create a TypeParameter node
   */
  static createTypeParameter(
    name: string,
    extendsBound?: Type,
    options?: NodeFactoryOptions
  ): TypeParameter {
    return {
      kind: 'TypeParameter',
      name,
      extendsBound,
      location: options?.location,
    };
  }

  /**
   * Create a SoqlQueryExpression node
   */
  static createSoqlQueryExpression(
    query: string,
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoqlQueryExpression {
    return {
      kind: 'SoqlQueryExpression',
      query,
      boundExpressions,
      location: options?.location,
    };
  }

  /**
   * Create a SoslQueryExpression node
   */
  static createSoslQueryExpression(
    query: string,
    boundExpressions?: Expression[],
    options?: NodeFactoryOptions
  ): SoslQueryExpression {
    return {
      kind: 'SoslQueryExpression',
      query,
      boundExpressions,
      location: options?.location,
    };
  }

  /**
   * Create a TriggerContextVariableExpression node
   */
  static createTriggerContextVariableExpression(
    variableName: string,
    options?: NodeFactoryOptions
  ): TriggerContextVariableExpression {
    return {
      kind: 'TriggerContextVariableExpression',
      variableName,
      location: options?.location,
    };
  }

  /**
   * Create a DmlStatement node
   */
  static createDmlStatement(
    operation: DmlOperation,
    target: Expression,
    options?: NodeFactoryOptions
  ): DmlStatement {
    return {
      kind: 'DmlStatement',
      operation,
      target,
      location: options?.location,
    };
  }
}
