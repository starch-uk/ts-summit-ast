/**
 * @file Declaration node types.
 * AST node types for declarations (classes, interfaces, methods, etc.).
 */

import type { ASTNode, CanonicalSourceLocation } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Expression } from './expression.js';
import type { CompoundStatement } from './statement.js';
import type { Identifier } from './baseNode.js';
import type {
  AnnotationElementValue,
  ArrayElementValue,
  ExpressionElementValue,
} from './initializer.js';

/**
 * Modifier node types.
 */

/**
 * Modifier node.
 */
interface Modifier extends ASTNode {
  readonly '@type': 'Modifier';
  readonly keyword:
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
}

/**
 * Compilation unit (root): single type declaration. Uses canonical name typeDeclaration.
 */
interface CompilationUnit extends ASTNode {
  readonly '@type': 'CompilationUnit';
  readonly typeDeclaration: Declaration;
  readonly file?: string;
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Base interface for all declaration nodes.
 */
interface Declaration extends ASTNode {
  readonly '@type':
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
  readonly '@type': 'ClassDeclaration';
  readonly name: string;
  readonly modifiers: readonly Modifier[];
  readonly typeParameters?: readonly TypeParameter[];

  /**
   * Superclass.
   */
  readonly extendsClause?: TypeRef;

  /**
   * Interfaces.
   */
  readonly implementsClause?: readonly TypeRef[];
  readonly members: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | MethodDeclaration
    | PropertyDeclaration
    | VariableDeclaration
  )[];
  readonly annotations?: readonly Annotation[];
}

/**
 * Represents an interface declaration in the AST.
 */
interface InterfaceDeclaration extends Declaration {
  readonly '@type': 'InterfaceDeclaration';
  readonly name: string;
  readonly modifiers: readonly Modifier[];
  readonly typeParameters?: readonly TypeParameter[];

  /**
   * Extended interfaces.
   */
  readonly extendsClause?: readonly TypeRef[];
  readonly members: readonly (
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
  readonly '@type': 'MethodDeclaration';
  readonly name: string;
  readonly modifiers: readonly Modifier[];
  readonly returnType: TypeRef;
  readonly typeParameters?: readonly TypeParameter[];
  readonly parameters: readonly Parameter[];

  /**
   * Undefined for abstract/interface methods.
   */
  readonly body?: CompoundStatement;
  readonly annotations?: readonly Annotation[];

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
  readonly '@type': 'ConstructorDeclaration';
  readonly modifiers: readonly Modifier[];
  readonly parameters: readonly Parameter[];
  readonly body: CompoundStatement;
  readonly annotations?: readonly Annotation[];
  readonly sourceLocation?: CanonicalSourceLocation;
}

/**
 * Represents a variable declaration in the AST.
 */
interface VariableDeclaration extends Declaration {
  readonly '@type': 'VariableDeclaration';
  readonly id: Identifier;
  readonly type: TypeRef;
  readonly modifiers?: readonly Modifier[];
  readonly initializer?: Expression;
  readonly annotations?: readonly Annotation[];
}

/**
 * Represents a property declaration (getter/setter) in the AST.
 */
interface PropertyDeclaration extends Declaration {
  readonly '@type': 'PropertyDeclaration';
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers: readonly Modifier[];
  readonly getter?: CompoundStatement;
  readonly setter?: CompoundStatement;
  readonly annotations?: readonly Annotation[];
}

/**
 * Represents an enum declaration in the AST.
 */
interface EnumDeclaration extends Declaration {
  readonly '@type': 'EnumDeclaration';
  readonly name: string;
  readonly modifiers: readonly Modifier[];
  readonly values: readonly EnumValue[];

  /**
   * Enum body members.
   */
  readonly members?: readonly (
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
  readonly '@type': 'EnumValue';
  readonly id: Identifier;
}

/**
 * Type parameter: <T extends Bound>.
 */
interface TypeParameter extends ASTNode {
  readonly '@type': 'TypeParameter';
  readonly name: string;
  readonly extendsBound?: TypeRef;
}

/**
 * Parameter: Type name.
 */
interface Parameter extends ASTNode {
  readonly '@type': 'Parameter';
  readonly name: string;
  readonly type: TypeRef;
  readonly modifiers?: readonly Modifier[];
  readonly defaultValue?: Expression;
  readonly annotations?: readonly Annotation[];
}

/**
 * Annotation: `@AnnotationName`(args).
 */
interface Annotation extends ASTNode {
  readonly '@type': 'Annotation';
  readonly name: string;
  readonly arguments?: readonly AnnotationArgument[];
}

/**
 * Annotation argument: key = value or just value.
 * In summit-ast, ElementArgument extends NodeWithSourceLocation.
 */
interface AnnotationArgument extends ASTNode {
  readonly '@type': 'AnnotationArgument';

  /**
   * Undefined for positional arguments (implicitly "value").
   */
  readonly name?: string;
  readonly value: AnnotationElementValue | ArrayElementValue | ExpressionElementValue;

  /**
   * True if the name is implicitly set to "value" (unnamed argument).
   */
  readonly isNameImplicit?: boolean;
}

/**
 * Annotation member (method-like).
 */
interface AnnotationMember extends ASTNode {
  readonly '@type': 'AnnotationMember';
  readonly name: string;
  readonly type: TypeRef;
  readonly defaultValue?: Expression;
}

export type {
  CompilationUnit,
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
