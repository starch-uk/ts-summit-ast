/**
 * @file Declaration node types.
 * AST node types for declarations (classes, interfaces, methods, etc.).
 */

import type { ASTNode, CanonicalSourceLocation } from './baseNode.js';
import type { TypeRef } from './baseNode.js';
import type { Expression } from './expression.js';
import type { CompoundStatement, Statement } from './statement.js';
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
 * Trigger case - when the trigger fires.
 * Matches summit-ast TriggerDeclaration.TriggerCase.
 */
export enum TriggerCase {
  TRIGGER_AFTER_DELETE = 'TRIGGER_AFTER_DELETE',
  TRIGGER_AFTER_INSERT = 'TRIGGER_AFTER_INSERT',
  TRIGGER_AFTER_UNDELETE = 'TRIGGER_AFTER_UNDELETE',
  TRIGGER_AFTER_UPDATE = 'TRIGGER_AFTER_UPDATE',
  TRIGGER_BEFORE_DELETE = 'TRIGGER_BEFORE_DELETE',
  TRIGGER_BEFORE_INSERT = 'TRIGGER_BEFORE_INSERT',
  TRIGGER_BEFORE_UNDELETE = 'TRIGGER_BEFORE_UNDELETE',
  TRIGGER_BEFORE_UPDATE = 'TRIGGER_BEFORE_UPDATE',
}

/** Enclosing type for qualified name resolution (ClassDeclaration, InterfaceDeclaration, or EnumDeclaration). */
export type TypeDeclaration = ClassDeclaration | InterfaceDeclaration | EnumDeclaration;

/**
 * Base interface for all declaration nodes.
 * qualifiedName and parent are populated by attachDeclarationMetadata().
 */
interface Declaration extends ASTNode {
  readonly '@type':
    | 'ClassDeclaration'
    | 'EnumDeclaration'
    | 'InterfaceDeclaration'
    | 'MethodDeclaration'
    | 'PropertyDeclaration'
    | 'TriggerDeclaration'
    | 'VariableDeclaration';

  /**
   * Enclosing type declaration (for nested types/methods).
   * Populated by attachDeclarationMetadata().
   */
  parent?: TypeDeclaration | null;

  /**
   * Fully qualified name (e.g. "Outer.Inner.method").
   * Populated by attachDeclarationMetadata().
   */
  qualifiedName?: string;
}

/**
 * Represents a trigger declaration in the AST.
 * Matches summit-ast TriggerDeclaration.
 */
interface TriggerDeclaration extends Declaration {
  readonly '@type': 'TriggerDeclaration';
  readonly id: Identifier;
  readonly target: Identifier;
  readonly cases: readonly TriggerCase[];
  readonly body: readonly (Declaration | Statement)[];
}

/**
 * Field declaration within a FieldDeclarationGroup (shares type/modifiers with group).
 */
interface FieldDeclaration extends ASTNode {
  readonly '@type': 'FieldDeclaration';
  readonly id: Identifier;
  readonly initializer?: Expression;
}

/**
 * Group of comma-separated field declarations sharing type and modifiers.
 */
interface FieldDeclarationGroup extends ASTNode {
  readonly '@type': 'FieldDeclarationGroup';
  readonly type: TypeRef;
  readonly modifiers: readonly Modifier[];
  readonly declarations: readonly FieldDeclaration[];
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
   * Superclass (upstream: extendsType).
   */
  readonly extendsType?: TypeRef;

  /**
   * Implemented interfaces (upstream: implementsTypes).
   */
  readonly implementsTypes?: readonly TypeRef[];

  /** Inner types (class, interface, enum). */
  readonly innerTypeDeclarations: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
  )[];
  /** Field declaration groups (or VariableDeclaration for backward compat). */
  readonly fieldDeclarations: readonly (FieldDeclarationGroup | VariableDeclaration)[];
  /** Property declarations. */
  readonly propertyDeclarations: readonly PropertyDeclaration[];
  /** Method declarations. */
  readonly methodDeclarations: readonly MethodDeclaration[];

  /**
   * All body declarations in declaration order (derived: innerTypes + fields + properties + methods).
   * Matches upstream bodyDeclarations.
   */
  readonly bodyDeclarations: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | InterfaceDeclaration
    | FieldDeclarationGroup
    | VariableDeclaration
    | MethodDeclaration
    | PropertyDeclaration
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
   * Extended interfaces (upstream: extendsTypes).
   */
  readonly extendsTypes?: readonly TypeRef[];

  /** Inner types. */
  readonly innerTypeDeclarations: readonly (ClassDeclaration | InterfaceDeclaration)[];
  /** Property declarations. */
  readonly propertyDeclarations: readonly PropertyDeclaration[];
  /** Method declarations. */
  readonly methodDeclarations: readonly MethodDeclaration[];

  /**
   * All body declarations (derived: innerTypes + properties + methods).
   * Matches upstream bodyDeclarations.
   */
  readonly bodyDeclarations: readonly (
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
  /** Upstream: parameterDeclarations. */
  readonly parameterDeclarations: readonly Parameter[];

  /**
   * @deprecated Use parameterDeclarations. Kept for backward compatibility.
   */
  readonly parameters?: readonly Parameter[];

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
   * Enum body declarations. Matches upstream bodyDeclarations.
   */
  readonly bodyDeclarations?: readonly (
    | ClassDeclaration
    | EnumDeclaration
    | FieldDeclarationGroup
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
  FieldDeclaration,
  FieldDeclarationGroup,
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
  TriggerDeclaration,
};
