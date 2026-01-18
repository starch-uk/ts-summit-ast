/**
 * @file Declaration node types.
 * AST node types for declarations (classes, interfaces, methods, etc.).
 */

import type { ASTNode } from './base.js';
import type { Type } from './Type.js';
import type { Expression } from './Expression.js';
import type { CompoundStatement } from './Statement.js';
import type { Identifier } from './Identifier.js';

/**
 * Modifier node types.
 */

/**
 * Modifier keywords.
 */
/* eslint-disable @typescript-eslint/no-type-alias -- Type alias needed for union type in AST structure */
type ModifierKeyword =
  | 'abstract'
  | 'deprecated'
  | 'final'
  | 'future'
  | 'global'
  | 'inherited sharing'
  | 'native'
  | 'override'
  | 'private'
  | 'protected'
  | 'public'
  | 'static'
  | 'strictfp'
  | 'synchronized'
  | 'testMethod'
  | 'transient'
  | 'virtual'
  | 'volatile'
  | 'webservice'
  | 'with sharing'
  | 'without sharing';
/* eslint-enable @typescript-eslint/no-type-alias */

/**
 * Modifier node.
 */
interface Modifier extends ASTNode {
  readonly kind: 'Modifier';
  readonly keyword: ModifierKeyword;
}

/**
 * Base interface for all declaration nodes.
 */
interface Declaration extends ASTNode {
  readonly kind: DeclarationKind;
}

/**
 * Discriminated union type for all declaration kinds.
 */
type DeclarationKind =
  | 'ClassDeclaration'
  | 'EnumDeclaration'
  | 'InterfaceDeclaration'
  | 'MethodDeclaration'
  | 'PropertyDeclaration'
  | 'VariableDeclaration';

/**
 * Class declaration.
 */
interface ClassDeclaration extends Declaration {
  readonly kind: 'ClassDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];

  /**
   * Superclass.
   */
  readonly extendsClause?: Type;
  readonly implementsClause?: Type[]; /**
   * Interfaces.
   */
  readonly members: ClassMember[];
  readonly annotations?: Annotation[];
}

/**
 * Interface declaration.
 */
interface InterfaceDeclaration extends Declaration {
  readonly kind: 'InterfaceDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];
  readonly extendsClause?: Type[]; /**
   * Extended interfaces.
   */
  readonly members: InterfaceMember[];
}

/**
 * Method declaration.
 */
interface MethodDeclaration extends Declaration {
  readonly kind: 'MethodDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly returnType: Type;
  readonly typeParameters?: TypeParameter[];
  readonly parameters: Parameter[];
  readonly body?: CompoundStatement; /**
   * Undefined for abstract/interface methods.
   */
  readonly annotations?: Annotation[];
  readonly isConstructor?: boolean; /**
   * True if this is a constructor (summit-ast compatibility).
   */
}

import type { SourceRange } from './base.js';

/**
 * Constructor declaration.
 * @deprecated Use MethodDeclaration with isConstructor: true instead (summit-ast compatibility).
 * This interface is kept for backward compatibility but is not part of DeclarationKind.
 */
interface ConstructorDeclaration {
  readonly kind: 'ConstructorDeclaration';
  readonly modifiers: Modifier[];
  readonly parameters: Parameter[];
  readonly body: CompoundStatement;
  readonly annotations?: Annotation[];
  readonly location?: SourceRange;
}

/**
 * Variable declaration.
 */
interface VariableDeclaration extends Declaration {
  readonly kind: 'VariableDeclaration';
  readonly name: string;
  readonly type: Type;
  readonly modifiers?: Modifier[];
  readonly initializer?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Property declaration (getter/setter).
 */
interface PropertyDeclaration extends Declaration {
  readonly kind: 'PropertyDeclaration';
  readonly name: string;
  readonly type: Type;
  readonly modifiers: Modifier[];
  readonly getter?: CompoundStatement;
  readonly setter?: CompoundStatement;
  readonly annotations?: Annotation[];
}

/**
 * Enum declaration.
 */
interface EnumDeclaration extends Declaration {
  readonly kind: 'EnumDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly values: EnumValue[];

  /**
   * Enum body members.
   */
  readonly members?: ClassMember[];
}

/**
 * Enum value (not a declaration type - summit-ast compatibility).
 * In summit-ast, EnumValue extends Node() (not NodeWithSourceLocation),
 * but delegates getSourceLocation() to the identifier.
 */
interface EnumValue extends ASTNode {
  readonly kind: 'EnumValue';
  readonly id: Identifier;
}

/**
 * Type parameter: <T extends Bound>.
 */
interface TypeParameter extends ASTNode {
  readonly kind: 'TypeParameter';
  readonly name: string;
  readonly extendsBound?: Type;
}

/**
 * Parameter: Type name.
 */
interface Parameter extends ASTNode {
  readonly kind: 'Parameter';
  readonly name: string;
  readonly type: Type;
  readonly modifiers?: Modifier[];
  readonly defaultValue?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Annotation: @AnnotationName(args).
 */
interface Annotation extends ASTNode {
  readonly kind: 'Annotation';
  readonly name: string;
  readonly arguments?: AnnotationArgument[];
}

/**
 * Annotation argument: key = value or just value.
 * In summit-ast, ElementArgument extends NodeWithSourceLocation.
 */
interface AnnotationArgument extends ASTNode {
  readonly kind: 'AnnotationArgument';
  readonly name?: string; /**
   * Undefined for positional arguments (implicitly "value").
   */
  readonly value: import('./ElementValue.js').ElementValue;

  /**
   * True if the name is implicitly set to "value" (unnamed argument).
   */
  readonly isNameImplicit?: boolean;
}

/**
 * Class member (method, field, inner class, etc.).
 */
type ClassMember =
  | ClassDeclaration
  | EnumDeclaration
  | InterfaceDeclaration
  | MethodDeclaration
  | PropertyDeclaration
  | VariableDeclaration;

/**
 * Interface member (method, property, etc.).
 */
type InterfaceMember =
  | ClassDeclaration
  | InterfaceDeclaration
  | MethodDeclaration
  | PropertyDeclaration;

/**
 * Annotation member (method-like).
 */
interface AnnotationMember extends ASTNode {
  readonly kind: 'AnnotationMember';
  readonly name: string;
  readonly type: Type;
  readonly defaultValue?: Expression;
}

/**
 * Union type for all declaration node types.
 */
type DeclarationNode =
  | ClassDeclaration
  | EnumDeclaration
  | InterfaceDeclaration
  | MethodDeclaration
  | PropertyDeclaration
  | VariableDeclaration;

export type {
  ModifierKeyword,
  Modifier,
  Declaration,
  DeclarationKind,
  ClassDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  ConstructorDeclaration,
  VariableDeclaration,
  PropertyDeclaration,
  EnumDeclaration,
  EnumValue,
  TypeParameter,
  Parameter,
  Annotation,
  AnnotationArgument,
  ClassMember,
  InterfaceMember,
  AnnotationMember,
  DeclarationNode,
};
