/**
 * @file Factory for creating declaration AST nodes.
 * Specialized factory for creating declaration node types.
 */

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
} from '../ast/Declaration.js';
import type { Expression } from '../ast/Expression.js';
import type { TypeRef } from '../ast/Type.js';
import type { CompoundStatement } from '../ast/Statement.js';
import type { Identifier } from '../ast/Identifier.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Options for creating AST nodes.
 */

/**
 * Factory for declaration nodes.
 */
export class DeclarationFactory {
  static createVariableDeclaration(
    name: string,
    type: TypeRef,
    initializer?: Expression,
    modifiers?: Modifier[],
    options?: NodeFactoryOptions
  ): VariableDeclaration {
    return {
      initializer,
      kind: 'VariableDeclaration',
      location: options?.location,
      modifiers,
      name,
      type,
    };
  }

  static createClassDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: TypeRef,
    implementsClause?: TypeRef[],
    typeParameters?: any[],
    options?: NodeFactoryOptions,
    annotations?: Annotation[]
  ): ClassDeclaration {
    return {
      annotations: annotations && annotations.length > 0 ? annotations : undefined,
      extendsClause,
      implementsClause,
      kind: 'ClassDeclaration',
      location: options?.location,
      members,
      modifiers,
      name,
      typeParameters,
    };
  }

  static createInterfaceDeclaration(
    name: string,
    members: any[],
    modifiers: Modifier[] = [],
    extendsClause?: TypeRef[],
    typeParameters?: any[],
    options?: NodeFactoryOptions
  ): InterfaceDeclaration {
    return {
      extendsClause,
      kind: 'InterfaceDeclaration',
      location: options?.location,
      members,
      modifiers,
      name,
      typeParameters,
    };
  }

  static createMethodDeclaration(
    name: string,
    returnType: TypeRef,
    parameters: any[] = [],
    body?: CompoundStatement,
    modifiers: Modifier[] = [],
    typeParameters?: any[],
    annotations?: any[],
    isConstructor = false,
    options?: NodeFactoryOptions
  ): MethodDeclaration {
    return {
      annotations,
      body,
      isConstructor,
      kind: 'MethodDeclaration',
      location: options?.location,
      modifiers,
      name,
      parameters,
      returnType,
      typeParameters,
    };
  }

  static createPropertyDeclaration(
    name: string,
    type: TypeRef,
    modifiers: Modifier[] = [],
    getter?: CompoundStatement,
    setter?: CompoundStatement,
    annotations?: any[],
    options?: NodeFactoryOptions
  ): PropertyDeclaration {
    return {
      annotations,
      getter,
      kind: 'PropertyDeclaration',
      location: options?.location,
      modifiers,
      name,
      setter,
      type,
    };
  }

  static createEnumDeclaration(
    name: string,
    values: EnumValue[],
    modifiers: Modifier[] = [],
    members?: any[],
    options?: NodeFactoryOptions
  ): EnumDeclaration {
    return {
      kind: 'EnumDeclaration',
      location: options?.location,
      members,
      modifiers,
      name,
      values,
    };
  }

  static createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return {
      id,
      kind: 'EnumValue',
      location: options?.location,
    };
  }

  static createTypeParameter(
    name: string,
    extendsBound?: TypeRef,
    options?: NodeFactoryOptions
  ): TypeParameter {
    return {
      extendsBound,
      kind: 'TypeParameter',
      location: options?.location,
      name,
    };
  }
}
