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
import { toCanonicalSourceLocation } from '../ast/baseNode.js';
import type { TypeRef, Identifier, TypeRefComponent } from '../ast/baseNode.js';
import type { CompoundStatement } from '../ast/statement.js';
import {
  DEFAULT_ARRAY_DIMENSIONS_TO_ADD,
  LAST_ELEMENT_OFFSET,
  SLICE_START_INDEX,
} from '../constants.js';
import type { NodeFactoryOptions } from './nodeFactory.js';
import { NodeFactory } from './nodeFactory.js';

/** Empty modifiers array for readonly default in destructuring. */
const EMPTY_MODIFIERS: readonly Modifier[] = [];

/** Options for createClassDeclaration (all properties readonly). */
interface CreateClassDeclarationOptions {
  readonly annotations?: readonly Annotation[];
  readonly extendsClause?: TypeRef;
  readonly implementsClause?: readonly TypeRef[];
  readonly members: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/**
 * Readonly view options for createClassDeclaration used at API boundaries.
 * Mirrors CreateClassDeclarationOptions but is kept separate so we can evolve
 * call-site contracts independently of the concrete options shape.
 */
interface CreateClassDeclarationOptionsView {
  readonly annotations?: readonly Annotation[];
  readonly extendsClause?: TypeRef;
  readonly implementsClause?: readonly TypeRef[];
  readonly members: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/** Options for createEnumDeclaration (all properties readonly). */
interface CreateEnumDeclarationOptions {
  readonly members?: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly values: readonly EnumValue[];
}

/** Readonly view options for createEnumDeclaration used at API boundaries. */
interface CreateEnumDeclarationOptionsView {
  readonly members?: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly values: readonly EnumValue[];
}

/** Options for createInterfaceDeclaration (all properties readonly). */
interface CreateInterfaceDeclarationOptions {
  readonly extendsClause?: readonly TypeRef[];
  readonly members: readonly (
    | ClassDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/** Readonly view options for createInterfaceDeclaration used at API boundaries. */
interface CreateInterfaceDeclarationOptionsView {
  readonly extendsClause?: readonly TypeRef[];
  readonly members: readonly (
    | ClassDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
  )[];
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly typeParameters?: readonly TypeParameter[];
}

/** Options for createMethodDeclaration (all properties readonly). */
interface CreateMethodDeclarationOptions {
  readonly annotations?: readonly Annotation[];
  readonly body?: CompoundStatement;
  readonly isConstructor?: boolean;
  readonly modifiers?: readonly Modifier[];
  readonly name: string;
  readonly options?: NodeFactoryOptions;
  readonly parameters?: readonly Parameter[];
  readonly returnType: TypeRef;
  readonly typeParameters?: readonly TypeParameter[];
}

/**
 * Factory for declaration nodes.
 */
const DeclarationFactory = {
  createClassDeclaration(opts: CreateClassDeclarationOptionsView): ClassDeclaration {
    const emptyArrayLength = 0;
    return {
      '@type': 'ClassDeclaration',
      annotations:
        opts.annotations && opts.annotations.length > emptyArrayLength
          ? [...opts.annotations]
          : undefined,
      extendsClause: opts.extendsClause,
      implementsClause: opts.implementsClause ? [...opts.implementsClause] : undefined,
      members: [...opts.members],
      modifiers:
        (opts.modifiers ?? EMPTY_MODIFIERS).length > emptyArrayLength
          ? [...(opts.modifiers ?? EMPTY_MODIFIERS)]
          : [],
      name: opts.name,
      typeParameters: opts.typeParameters ? [...opts.typeParameters] : undefined,
      ...(opts.options?.location && {
        sourceLocation: toCanonicalSourceLocation(opts.options.location),
      }),
    };
  },

  createEnumDeclaration(opts: CreateEnumDeclarationOptionsView): EnumDeclaration {
    const { members, modifiers = EMPTY_MODIFIERS, name, options, values } = opts;
    const emptyArrayLength = 0;
    return {
      '@type': 'EnumDeclaration',
      members: members ? [...members] : undefined,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      values: [...values],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },
  createEnumValue(id: Identifier, options?: NodeFactoryOptions): EnumValue {
    return {
      '@type': 'EnumValue',
      id,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createInterfaceDeclaration(opts: CreateInterfaceDeclarationOptionsView): InterfaceDeclaration {
    const {
      extendsClause,
      members,
      modifiers = EMPTY_MODIFIERS,
      name,
      options,
      typeParameters,
    } = opts;
    const emptyArrayLength = 0;
    return {
      '@type': 'InterfaceDeclaration',
      extendsClause: extendsClause ? [...extendsClause] : undefined,
      members: [...members],
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      typeParameters: typeParameters ? [...typeParameters] : undefined,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createMethodDeclaration(opts: CreateMethodDeclarationOptions): MethodDeclaration {
    const {
      annotations,
      body,
      isConstructor = false,
      modifiers = [],
      name,
      options,
      parameters = [],
      returnType,
      typeParameters,
    } = opts;
    const emptyArrayLength = 0;
    return {
      '@type': 'MethodDeclaration',
      annotations: annotations ? [...annotations] : undefined,
      body,
      isConstructor,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      parameters: parameters.length > emptyArrayLength ? [...parameters] : [],
      returnType,
      typeParameters: typeParameters ? [...typeParameters] : undefined,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createPropertyDeclaration(
    name: string,
    type: Readonly<TypeRef>,
    options?: Readonly<{
      annotations?: readonly Readonly<Annotation>[];
      getter?: Readonly<CompoundStatement>;
      modifiers?: readonly Readonly<Modifier>[];
      setter?: Readonly<CompoundStatement>;
    }> &
      Readonly<Partial<NodeFactoryOptions>>
  ): PropertyDeclaration {
    const emptyArrayLength = 0;
    const modifiers = options?.modifiers ?? [];
    return {
      '@type': 'PropertyDeclaration',
      annotations: options?.annotations
        ? options.annotations.length > emptyArrayLength
          ? [...options.annotations]
          : undefined
        : undefined,
      getter: options?.getter,
      modifiers: modifiers.length > emptyArrayLength ? [...modifiers] : [],
      name,
      setter: options?.setter,
      type,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },

  createTypeParameter(
    name: string,
    extendsBound?: Readonly<TypeRef>,

    options?: Readonly<NodeFactoryOptions>
  ): TypeParameter {
    return {
      '@type': 'TypeParameter',
      extendsBound,
      name,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'VariableDeclaration',
      id: NodeFactory.createIdentifier(name, options),
      initializer,
      modifiers: modifiers ? [...modifiers] : undefined,
      type,
      ...(options.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'TypeRef',
      arrayNesting: elementType.arrayNesting + dimensions,
      components: elementType.components,
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
      ...(elementType.sourceLocation &&
        !options?.location && { sourceLocation: elementType.sourceLocation }),
    };
  },

  createClassType(
    name: string,
    packageName?: string,
    options?: Readonly<NodeFactoryOptions>
  ): TypeRef {
    const fullName = packageName != null && packageName !== '' ? `${packageName}.${name}` : name;
    return {
      '@type': 'TypeRef',
      arrayNesting: 0,
      components: [
        {
          args: [],
          id: NodeFactory.createIdentifier(fullName, options),
        },
      ],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
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
      '@type': 'TypeRef',
      arrayNesting: baseType.arrayNesting,
      components: [
        ...baseType.components.slice(SLICE_START_INDEX, lastComponentIndex),
        lastComponent,
      ],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
      ...(baseType.sourceLocation &&
        !options?.location && { sourceLocation: baseType.sourceLocation }),
    };
  },

  createPrimitiveType(name: string, options?: Readonly<NodeFactoryOptions>): TypeRef {
    return {
      '@type': 'TypeRef',
      arrayNesting: 0,
      components: [
        {
          args: [],
          id: NodeFactory.createIdentifier(name, options),
        },
      ],
      ...(options?.location && { sourceLocation: toCanonicalSourceLocation(options.location) }),
    };
  },
};

export type {
  CreateClassDeclarationOptions,
  CreateEnumDeclarationOptions,
  CreateInterfaceDeclarationOptions,
  CreateMethodDeclarationOptions,
};
export { DeclarationFactory, TypeFactory };
