/**
 * @file Factory for creating type AST nodes.
 * Specialized factory for creating type node types.
 */

import type { TypeRef, TypeRefComponent } from '../ast/Type.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';
import { NodeFactory } from './NodeFactory.js';

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
    options?: NodeFactoryOptions
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
    elementType: TypeRef,
    dimensions = 1,
    options?: NodeFactoryOptions
  ): TypeRef {
    return {
      arrayNesting: elementType.arrayNesting + dimensions,
      components: elementType.components,
      kind: 'TypeRef',
      location: options?.location ?? elementType.location,
    };
  }

  static createGenericType(
    baseType: TypeRef,
    typeArguments: TypeRef[],
    options?: NodeFactoryOptions
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
