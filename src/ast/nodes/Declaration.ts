/**
 * Declaration node types
 */

import type { ASTNode } from '../base.js';
import type { Type } from './Type.js';
import type { Expression } from './Expression.js';
import type { Block } from './Statement.js';
import type { Modifier } from './Modifier.js';

/**
 * Base interface for all declaration nodes
 */
export interface Declaration extends ASTNode {
  readonly kind: DeclarationKind;
}

/**
 * Discriminated union type for all declaration kinds
 */
export type DeclarationKind =
  | 'ClassDeclaration'
  | 'InterfaceDeclaration'
  | 'MethodDeclaration'
  | 'ConstructorDeclaration'
  | 'VariableDeclaration'
  | 'PropertyDeclaration'
  | 'EnumDeclaration'
  | 'EnumConstantDeclaration'
  | 'AnnotationDeclaration';

/**
 * Class declaration
 */
export interface ClassDeclaration extends Declaration {
  readonly kind: 'ClassDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];
  readonly extendsClause?: Type; // Superclass
  readonly implementsClause?: Type[]; // Interfaces
  readonly members: ClassMember[];
}

/**
 * Interface declaration
 */
export interface InterfaceDeclaration extends Declaration {
  readonly kind: 'InterfaceDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];
  readonly extendsClause?: Type[]; // Extended interfaces
  readonly members: InterfaceMember[];
}

/**
 * Method declaration
 */
export interface MethodDeclaration extends Declaration {
  readonly kind: 'MethodDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly returnType: Type;
  readonly typeParameters?: TypeParameter[];
  readonly parameters: Parameter[];
  readonly body?: Block; // undefined for abstract/interface methods
  readonly annotations?: Annotation[];
}

/**
 * Constructor declaration
 */
export interface ConstructorDeclaration extends Declaration {
  readonly kind: 'ConstructorDeclaration';
  readonly modifiers: Modifier[];
  readonly parameters: Parameter[];
  readonly body: Block;
  readonly annotations?: Annotation[];
}

/**
 * Variable declaration
 */
export interface VariableDeclaration extends Declaration {
  readonly kind: 'VariableDeclaration';
  readonly name: string;
  readonly type: Type;
  readonly modifiers?: Modifier[];
  readonly initializer?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Property declaration (getter/setter)
 */
export interface PropertyDeclaration extends Declaration {
  readonly kind: 'PropertyDeclaration';
  readonly name: string;
  readonly type: Type;
  readonly modifiers: Modifier[];
  readonly getter?: Block;
  readonly setter?: Block;
  readonly annotations?: Annotation[];
}

/**
 * Enum declaration
 */
export interface EnumDeclaration extends Declaration {
  readonly kind: 'EnumDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly constants: EnumConstantDeclaration[];
  readonly members?: ClassMember[]; // Enum body members
}

/**
 * Enum constant declaration
 */
export interface EnumConstantDeclaration extends Declaration {
  readonly kind: 'EnumConstantDeclaration';
  readonly name: string;
  readonly arguments?: Expression[];
  readonly body?: ClassDeclaration; // Anonymous class body
}

/**
 * Annotation declaration
 */
export interface AnnotationDeclaration extends Declaration {
  readonly kind: 'AnnotationDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly members: AnnotationMember[];
}

/**
 * Type parameter: <T extends Bound>
 */
export interface TypeParameter extends ASTNode {
  readonly kind: 'TypeParameter';
  readonly name: string;
  readonly extendsBound?: Type;
}

/**
 * Parameter: Type name
 */
export interface Parameter extends ASTNode {
  readonly kind: 'Parameter';
  readonly name: string;
  readonly type: Type;
  readonly modifiers?: Modifier[];
  readonly defaultValue?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Annotation: @AnnotationName(args)
 */
export interface Annotation extends ASTNode {
  readonly kind: 'Annotation';
  readonly name: string;
  readonly arguments?: AnnotationArgument[];
}

/**
 * Annotation argument: key = value or just value
 */
export interface AnnotationArgument extends ASTNode {
  readonly kind: 'AnnotationArgument';
  readonly name?: string; // undefined for positional arguments
  readonly value: Expression;
}

/**
 * Class member (method, field, inner class, etc.)
 */
export type ClassMember =
  | MethodDeclaration
  | ConstructorDeclaration
  | VariableDeclaration
  | PropertyDeclaration
  | ClassDeclaration
  | InterfaceDeclaration
  | EnumDeclaration;

/**
 * Interface member (method, property, etc.)
 */
export type InterfaceMember =
  | MethodDeclaration
  | PropertyDeclaration
  | InterfaceDeclaration
  | ClassDeclaration;

/**
 * Annotation member (method-like)
 */
export interface AnnotationMember extends ASTNode {
  readonly kind: 'AnnotationMember';
  readonly name: string;
  readonly type: Type;
  readonly defaultValue?: Expression;
}

/**
 * Union type for all declaration node types
 */
export type DeclarationNode =
  | ClassDeclaration
  | InterfaceDeclaration
  | MethodDeclaration
  | ConstructorDeclaration
  | VariableDeclaration
  | PropertyDeclaration
  | EnumDeclaration
  | EnumConstantDeclaration
  | AnnotationDeclaration;
