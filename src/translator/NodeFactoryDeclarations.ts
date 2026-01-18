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
  ClassMember,
  InterfaceMember,
  Parameter,
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
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Factory pattern requires class
export class DeclarationFactory {
  // eslint-disable-next-line @typescript-eslint/max-params -- Factory method requires 5 parameters
  public static createVariableDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    initializer?: Readonly<Expression>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers?: readonly Readonly<Modifier>[],
    options?: Readonly<NodeFactoryOptions>
  ): VariableDeclaration {
    return {
      initializer,
      kind: 'VariableDeclaration',
      location: options?.location,
      modifiers: modifiers ? [...modifiers] : undefined,
      name,
      type,
    };
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Class declaration requires 8 parameters
  public static createClassDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    members: readonly ClassMember[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    extendsClause?: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    implementsClause?: readonly TypeRef[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeParameters?: readonly TypeParameter[],
    options?: Readonly<NodeFactoryOptions>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    annotations?: readonly Annotation[]
  ): ClassDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    const emptyArrayLength = 0;
    return {
      annotations:
        annotations && annotations.length > emptyArrayLength ? [...annotations] : undefined,
      extendsClause,
      implementsClause: implementsClause ? [...implementsClause] : undefined,
      kind: 'ClassDeclaration',
      location: options?.location,
      members: [...members],
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      typeParameters: typeParameters ? [...typeParameters] : undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Interface declaration requires 6 parameters
  public static createInterfaceDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    members: readonly InterfaceMember[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    extendsClause?: readonly TypeRef[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeParameters?: readonly TypeParameter[],
    options?: Readonly<NodeFactoryOptions>
  ): InterfaceDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    const emptyArrayLength = 0;
    return {
      extendsClause: extendsClause ? [...extendsClause] : undefined,
      kind: 'InterfaceDeclaration',
      location: options?.location,
      members: [...members],
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      typeParameters: typeParameters ? [...typeParameters] : undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Method declaration requires 9 parameters
  public static createMethodDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    returnType: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    parameters: readonly Parameter[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    body?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    typeParameters?: readonly TypeParameter[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    annotations?: readonly Annotation[],
    isConstructor = false,
    options?: Readonly<NodeFactoryOptions>
  ): MethodDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    const emptyArrayLength = 0;
    return {
      annotations: annotations ? [...annotations] : undefined,
      body,
      isConstructor,
      kind: 'MethodDeclaration',
      location: options?.location,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      parameters: parameters.length > emptyArrayLength ? [...parameters] : [],
      returnType,
      typeParameters: typeParameters ? [...typeParameters] : undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Property declaration requires 7 parameters
  public static createPropertyDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    type: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    getter?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    setter?: Readonly<CompoundStatement>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    annotations?: readonly Annotation[],
    options?: Readonly<NodeFactoryOptions>
  ): PropertyDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    const emptyArrayLength = 0;
    return {
      annotations: annotations ? [...annotations] : undefined,
      getter,
      kind: 'PropertyDeclaration',
      location: options?.location,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      setter,
      type,
    };
  }

  // eslint-disable-next-line @typescript-eslint/max-params -- Enum declaration requires 5 parameters
  public static createEnumDeclaration(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    values: readonly EnumValue[],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    modifiers: readonly Modifier[] = [],
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Array parameter
    members?: readonly ClassMember[],
    options?: NodeFactoryOptions
  ): EnumDeclaration {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Check for non-empty array
    const emptyArrayLength = 0;
    return {
      kind: 'EnumDeclaration',
      location: options?.location,
      members: members ? [...members] : undefined,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      values: [...values],
    };
  }

  public static createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return {
      id,
      kind: 'EnumValue',
      location: options?.location,
    };
  }

  public static createTypeParameter(
    name: string,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Parameter is already readonly
    extendsBound?: Readonly<TypeRef>,
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Options object needs to be mutable
    options?: Readonly<NodeFactoryOptions>
  ): TypeParameter {
    return {
      extendsBound,
      kind: 'TypeParameter',
      location: options?.location,
      name,
    };
  }
}
