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
import {
  DEFAULT_ARRAY_DIMENSIONS_TO_ADD,
  LAST_ELEMENT_OFFSET,
  SLICE_START_INDEX,
} from '../constants.js';
import type { NodeFactoryOptions } from './nodeFactory.js';
import { NodeFactory } from './nodeFactory.js';

/**
 * Factory for declaration nodes.
 */
const DeclarationFactory = {
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
  },

  createEnumDeclaration(
    name: string,
    values: Readonly<readonly Readonly<EnumValue>[]>,

    modifiers: readonly Readonly<Modifier>[] = [],

    members?: Readonly<
      readonly (
        | Readonly<ClassDeclaration>
        | Readonly<EnumDeclaration>
        | Readonly<InterfaceDeclaration>
        | Readonly<MethodDeclaration>
        | Readonly<PropertyDeclaration>
        | Readonly<VariableDeclaration>
      )[]
    >,
    options?: Readonly<NodeFactoryOptions>
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
  },
  createEnumValue(id: Readonly<Identifier>, options?: Readonly<NodeFactoryOptions>): EnumValue {
    return {
      id,
      kind: 'EnumValue',
      location: options?.location,
    };
  },

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
  },

  createMethodDeclaration(
    name: string,
    returnType: Readonly<TypeRef>,
    parameters: readonly Readonly<Parameter>[] = [],
    body?: Readonly<CompoundStatement>,

    modifiers: readonly Readonly<Modifier>[] = [],
    typeParameters?: readonly Readonly<TypeParameter>[],
    annotations?: readonly Readonly<Annotation>[],
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
  },

  createPropertyDeclaration(
    name: string,
    type: Readonly<TypeRef>,

    modifiers: readonly Readonly<Modifier>[] = [],
    getter?: Readonly<CompoundStatement>,
    setter?: Readonly<CompoundStatement>,
    annotations?: readonly Readonly<Annotation>[],
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
  },

  createTypeParameter(
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
  },

  createVariableDeclaration(
    options: Readonly<
      NodeFactoryOptions & {
        initializer?: Readonly<Expression>;
        modifiers?: readonly Readonly<Modifier>[];
        name: string;
        type: Readonly<TypeRef>;
      }
    >
  ): VariableDeclaration {
    const { name, type, initializer, modifiers } = options;
    return {
      initializer,
      kind: 'VariableDeclaration',
      location: options.location,
      modifiers: modifiers ? [...modifiers] : undefined,
      name,
      type,
    };
  },
};

// ============================================================================
// Type Factory
// ============================================================================

/**
 * Factory for type nodes.
 */
const TypeFactory = {
  createArrayType(
    elementType: Readonly<TypeRef>,
    dimensions = DEFAULT_ARRAY_DIMENSIONS_TO_ADD,
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    return {
      arrayNesting: elementType.arrayNesting + dimensions,
      components: elementType.components,
      kind: 'TypeRef',
      location: options?.location ?? elementType.location,
    };
  },

  createClassType(
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
  },

  createGenericType(
    baseType: Readonly<TypeRef>,
    typeArguments: readonly TypeRef[],
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    const lastComponentIndex = baseType.components.length - LAST_ELEMENT_OFFSET;
    const lastComponent: TypeRefComponent = {
      ...baseType.components[lastComponentIndex],
      args: typeArguments,
    };
    return {
      arrayNesting: baseType.arrayNesting,
      components: [
        ...baseType.components.slice(SLICE_START_INDEX, lastComponentIndex),
        lastComponent,
      ],
      kind: 'TypeRef',
      location: options?.location ?? baseType.location,
    };
  },

  createPrimitiveType(name: string, options?: Readonly<NodeFactoryOptions>): TypeRef {
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
  },
};

export { DeclarationFactory, TypeFactory };
