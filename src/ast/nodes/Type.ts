/**
 * Type node types
 */

import type { ASTNode } from '../base.js';

/**
 * Base interface for all type nodes
 */
export interface Type extends ASTNode {
  readonly kind: TypeKind;
}

/**
 * Discriminated union type for all type kinds
 */
export type TypeKind =
  | 'PrimitiveType'
  | 'ClassType'
  | 'InterfaceType'
  | 'ArrayType'
  | 'GenericType'
  | 'VoidType'
  | 'WildcardType';

/**
 * Primitive type: int, boolean, String, etc.
 */
export interface PrimitiveType extends Type {
  readonly kind: 'PrimitiveType';
  readonly name: string; // 'int', 'boolean', 'String', 'Double', etc.
}

/**
 * Class type: ClassName
 */
export interface ClassType extends Type {
  readonly kind: 'ClassType';
  readonly name: string;
  readonly packageName?: string; // Fully qualified name parts
}

/**
 * Interface type: InterfaceName
 */
export interface InterfaceType extends Type {
  readonly kind: 'InterfaceType';
  readonly name: string;
  readonly packageName?: string;
}

/**
 * Array type: Type[]
 */
export interface ArrayType extends Type {
  readonly kind: 'ArrayType';
  readonly elementType: Type;
  readonly dimensions: number; // Number of array dimensions
}

/**
 * Generic type: List<Type> or Map<KeyType, ValueType>
 */
export interface GenericType extends Type {
  readonly kind: 'GenericType';
  readonly baseType: Type; // The generic class/interface
  readonly typeArguments: Type[];
}

/**
 * Void type: void
 */
export interface VoidType extends Type {
  readonly kind: 'VoidType';
}

/**
 * Wildcard type: ? or ? extends Type or ? super Type
 */
export interface WildcardType extends Type {
  readonly kind: 'WildcardType';
  readonly extendsBound?: Type;
  readonly superBound?: Type;
}

/**
 * Union type for all type node types
 */
export type TypeNode =
  | PrimitiveType
  | ClassType
  | InterfaceType
  | ArrayType
  | GenericType
  | VoidType
  | WildcardType;
