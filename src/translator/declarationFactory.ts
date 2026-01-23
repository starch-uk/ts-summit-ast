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
  Parameter,
} from '../ast/declaration.js';
import type { Expression } from '../ast/expression.js';
import type { TypeRef, Identifier, TypeRefComponent } from '../ast/baseNode.js';
import type { CompoundStatement } from '../ast/statement.js';
import type { NodeFactoryOptions } from './nodeFactory.js';
import { NodeFactory } from './nodeFactory.js';

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
    type: Readonly<TypeRef>,
    initializer?: Readonly<Expression>,

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
    members: readonly (
      | ClassDeclaration
      | EnumDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
      | VariableDeclaration
    )[],

    modifiers: readonly Modifier[] = [],
    extendsClause?: Readonly<TypeRef>,
    implementsClause?: readonly TypeRef[],
    typeParameters?: readonly TypeParameter[],
    options?: Readonly<NodeFactoryOptions>,
    annotations?: readonly Annotation[]
  ): ClassDeclaration {
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
    members: readonly (
      | ClassDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
    )[],

    modifiers: readonly Modifier[] = [],
    extendsClause?: readonly TypeRef[],
    typeParameters?: readonly TypeParameter[],
    options?: Readonly<NodeFactoryOptions>
  ): InterfaceDeclaration {
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
    returnType: Readonly<TypeRef>,
    parameters: readonly Parameter[] = [],
    body?: Readonly<CompoundStatement>,

    modifiers: readonly Modifier[] = [],
    typeParameters?: readonly TypeParameter[],
    annotations?: readonly Annotation[],
    isConstructor = false,
    options?: Readonly<NodeFactoryOptions>
  ): MethodDeclaration {
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
    type: Readonly<TypeRef>,

    modifiers: readonly Modifier[] = [],
    getter?: Readonly<CompoundStatement>,
    setter?: Readonly<CompoundStatement>,
    annotations?: readonly Annotation[],
    options?: Readonly<NodeFactoryOptions>
  ): PropertyDeclaration {
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

    values: readonly EnumValue[],

    modifiers: readonly Modifier[] = [],

    members?: readonly (
      | ClassDeclaration
      | EnumDeclaration
      | InterfaceDeclaration
      | MethodDeclaration
      | PropertyDeclaration
      | VariableDeclaration
    )[],
    options?: NodeFactoryOptions
  ): EnumDeclaration {
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
    extendsBound?: Readonly<TypeRef>,

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

// ============================================================================
// Type Factory
// ============================================================================

/**
 * Factory for type nodes.
 */
export class TypeFactory {
  static createPrimitiveType(name: string, options?: NodeFactoryOptions): TypeRef {
    return {
      arrayNesting: 0,
      components: [
        {
          args: [],
          id: NodeFactory.createIdentifier(name, options),
        },
      ],
      kind: 'TypeRef',
      location: options?.location,
    };
  }

  static createClassType(
    name: string,
    packageName?: string,
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    const fullName = packageName != null && packageName !== '' ? `${packageName}.${name}` : name;
    return {
      arrayNesting: 0,
      components: [
        {
          args: [],
          id: NodeFactory.createIdentifier(fullName, options),
        },
      ],
      kind: 'TypeRef',
      location: options?.location,
    };
  }

  static createArrayType(
    elementType: Readonly<TypeRef>,
    dimensions = 1,
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    return {
      arrayNesting: elementType.arrayNesting + dimensions,
      components: elementType.components,
      kind: 'TypeRef',
      location: options?.location ?? elementType.location,
    };
  }

  static createGenericType(
    baseType: Readonly<TypeRef>,
    typeArguments: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    const lastComponentIndex = baseType.components.length - 1;
    const lastComponent: TypeRefComponent = {
      ...baseType.components[lastComponentIndex],
      args: typeArguments,
    };
    return {
      arrayNesting: baseType.arrayNesting,
      components: [...baseType.components.slice(0, lastComponentIndex), lastComponent],
      kind: 'TypeRef',
      location: options?.location ?? baseType.location,
    };
  }
}
