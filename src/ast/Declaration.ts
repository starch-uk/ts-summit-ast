/**
 * @file Declaration node types.
 * AST node types for declarations (classes, interfaces, methods, etc.).
 */

import type { ASTNode, SourceRange } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Expression } from './expression.js';
import type { CompoundStatement } from './statement.js';
import type { Identifier } from './baseNode.js';
import type { ElementValue } from './initializer.js';

/**
 * Modifier node types.
 */

/**
 * Modifier keywords.
 */
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
  readonly kind:
    | 'ClassDeclaration'
    | 'EnumDeclaration'
    | 'InterfaceDeclaration'
    | 'MethodDeclaration'
    | 'PropertyDeclaration'
    | 'VariableDeclaration';
}

/**
 * Represents a class declaration in the AST.
 */
interface ClassDeclaration extends Declaration {
  readonly kind: 'ClassDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];

  /**
   * Superclass.
   */
  readonly extendsClause?: TypeRef;

  /**
   * Interfaces.
   */
  readonly implementsClause?: TypeRef[];
  readonly members: (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly annotations?: Annotation[];
}

/**
 * Represents an interface declaration in the AST.
 */
interface InterfaceDeclaration extends Declaration {
  readonly kind: 'InterfaceDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly typeParameters?: TypeParameter[];

  /**
   * Extended interfaces.
   */
  readonly extendsClause?: TypeRef[];
  readonly members: (
    | ClassDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
  )[];
}

/**
 * Represents a method declaration in the AST.
 */
interface MethodDeclaration extends Declaration {
  readonly kind: 'MethodDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly returnType: TypeRef;
  readonly typeParameters?: TypeParameter[];
  readonly parameters: Parameter[];

  /**
   * Undefined for abstract/interface methods.
   */
  readonly body?: CompoundStatement;
  readonly annotations?: Annotation[];

  /**
   * True if this is a constructor (summit-ast compatibility).
   */
  readonly isConstructor?: boolean;
}

/**
 * Represents a constructor method declaration in an Apex class.
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
 * Represents a variable declaration in the AST.
 */
interface VariableDeclaration extends Declaration {
  readonly kind: 'VariableDeclaration';
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers?: Modifier[];
  readonly initializer?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Represents a property declaration (getter/setter) in the AST.
 */
interface PropertyDeclaration extends Declaration {
  readonly kind: 'PropertyDeclaration';
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers: Modifier[];
  readonly getter?: CompoundStatement;
  readonly setter?: CompoundStatement;
  readonly annotations?: Annotation[];
}

/**
 * Represents an enum declaration in the AST.
 */
interface EnumDeclaration extends Declaration {
  readonly kind: 'EnumDeclaration';
  readonly name: string;
  readonly modifiers: Modifier[];
  readonly values: EnumValue[];

  /**
   * Enum body members.
   */
  readonly members?: (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
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
  readonly extendsBound?: TypeRef;
}

/**
 * Parameter: Type name.
 */
interface Parameter extends ASTNode {
  readonly kind: 'Parameter';
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers?: Modifier[];
  readonly defaultValue?: Expression;
  readonly annotations?: Annotation[];
}

/**
 * Annotation: `@AnnotationName`(args).
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

  /**
   * Undefined for positional arguments (implicitly "value").
   */
  readonly name?: string;
  readonly value: ElementValue;

  /**
   * True if the name is implicitly set to "value" (unnamed argument).
   */
  readonly isNameImplicit?: boolean;
}

/**
 * Annotation member (method-like).
 */
interface AnnotationMember extends ASTNode {
  readonly kind: 'AnnotationMember';
  readonly name: string;
  readonly type: TypeRef;
  readonly defaultValue?: Expression;
}

export type {
  ModifierKeyword,
  Modifier,
  Declaration,
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
  AnnotationMember,
};
