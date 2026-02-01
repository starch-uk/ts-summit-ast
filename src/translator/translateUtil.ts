/**
 * @file Translation utility functions, error types, and context interface.
 * Shared utilities for parse tree to AST translation.
 */

import type { ParseTreeNode } from '../parser/parseTree.js';
import type { TypeRef, TypeRefComponent, ASTNode } from '../ast/baseNode.js';
import type {
  Modifier,
  ModifierKeyword,
  Annotation,
  AnnotationArgument,
  TypeParameter,
} from '../ast/declaration.js';
import type { ElementValue } from '../ast/initializer.js';
import type { Expression } from '../ast/expression.js';
import type { Statement } from '../ast/statement.js';
import type { Declaration } from '../ast/declaration.js';
import type { NodeFactoryOptions } from './nodeFactory.js';
import { NodeFactory } from './nodeFactory.js';

/**
 * Error thrown during AST translation from parse tree to AST nodes.
 */
class TranslationError extends Error {
  public readonly node?: Readonly<ParseTreeNode>;
  public readonly cause?: Error;

  public constructor(message: string, node?: Readonly<ParseTreeNode>, cause?: Readonly<Error>) {
    super(message);
    this.name = 'TranslationError';
    this.node = node;
    this.cause = cause;
  }
}

/**
 * Context interface for translation helper modules.
 * Provides access to translation methods and utilities.
 */
export interface TranslateContext {
  /**
   * Translate a parse tree node to an AST node.
   */
  translateNode: (node: Readonly<ParseTreeNode>) => ASTNode;

  /**
   * Try to translate node as a statement.
   */
  tryTranslateStatement: (node: Readonly<ParseTreeNode>, nodeType: string) => Statement | null;

  /**
   * Translate compound statement (block).
   */
  translateCompoundStatement: (node: Readonly<ParseTreeNode>) => Statement;

  /**
   * Try to translate node as an expression.
   */
  tryTranslateExpression: (node: Readonly<ParseTreeNode>, nodeType: string) => Expression | null;

  /**
   * Try to translate node as a declaration.
   */
  tryTranslateDeclaration: (node: Readonly<ParseTreeNode>, nodeType: string) => Declaration | null;

  /**
   * Try to translate node as a type reference.
   */
  tryTranslateType: (node: Readonly<ParseTreeNode>) => TypeRef | null;

  /**
   * Get child expression from node.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Method requires 4 parameters for flexibility
  getChildExpression: (
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    optionalOrAlt?: boolean | string,
    altPropertyName?: string
  ) => Expression | undefined;

  /**
   * Get child statement from node.
   */
  // eslint-disable-next-line @typescript-eslint/max-params -- Method requires 4 parameters for flexibility
  getChildStatement: (
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    altPropertyName?: string,
    optional?: boolean
  ) => Statement | undefined;

  /**
   * Get location option for node factory.
   */
  getLocationOption: (node: Readonly<ParseTreeNode>) => Readonly<NodeFactoryOptions> | undefined;

  /**
   * Get current class name (for constructor detection).
   */
  getClassName: (node: Readonly<ParseTreeNode>) => string | undefined;

  /**
   * Whether to include location information.
   */
  includeLocation: boolean;

  /**
   * Get children from node.
   */
  getChildren: (
    node: Readonly<ParseTreeNode>,
    propertyName?: string,
    altPropertyName?: string
  ) => Readonly<ParseTreeNode>[];

  /**
   * Get child from node.
   */
  getChild: (
    node: Readonly<ParseTreeNode>,
    propertyName: string,
    altPropertyName?: string
  ) => Readonly<ParseTreeNode> | null;

  /**
   * Get property from node.
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Type parameter used for API clarity and type assertions
  getProperty: <T>(node: Readonly<ParseTreeNode>, ...names: readonly string[]) => T | undefined;

  /**
   * Get text from node.
   */
  getText: (node: Readonly<ParseTreeNode>) => string | undefined;

  /**
   * Extract modifiers from node.
   */
  extractModifiers: (node: Readonly<ParseTreeNode>) => Modifier[];

  /**
   * Extract annotations from node.
   */
  extractAnnotations: (node: Readonly<ParseTreeNode>) => Annotation[];

  /**
   * Extract type parameters from node.
   */
  extractTypeParameters: (node: Readonly<ParseTreeNode>) => TypeParameter[];

  /**
   * Current class name (for constructor detection).
   */
  currentClassName: string | undefined;

  /**
   * Set current class name (for constructor detection during translation).
   */
  setCurrentClassName: (value: string | undefined) => void;
}

/**
 * Get children from a parse tree node.
 * @param node - The parse tree node.
 * @param propertyName - Optional property name to look for.
 * @param altPropertyName - Optional alternate property name.
 * @returns Array of child nodes.
 */
function getChildren(
  node: Readonly<ParseTreeNode>,
  propertyName?: string,
  altPropertyName?: string
): Readonly<ParseTreeNode>[] {
  // Try named property first
  if (propertyName != null && propertyName in node) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Property access validated by 'in' check
    const value = (node as unknown as Record<string, unknown>)[propertyName];
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Array type validated by Array.isArray
      return value as Readonly<ParseTreeNode>[];
    }
    if (value !== undefined && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Value validated by null check
      return [value as Readonly<ParseTreeNode>];
    }
    return [];
  }

  // Try alternate property name
  if (altPropertyName != null && altPropertyName in node) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Property access validated by 'in' check
    const value = (node as unknown as Record<string, unknown>)[altPropertyName];
    if (Array.isArray(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Array type validated by Array.isArray
      return value as Readonly<ParseTreeNode>[];
    }
    if (value !== undefined && value !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Value validated by null check
      return [value as Readonly<ParseTreeNode>];
    }
    return [];
  }

  // Fall back to children array
  const children = node.children ?? [];
  return [...children] as Readonly<ParseTreeNode>[];
}

/**
 * Get a single child from a parse tree node.
 * @param node - The parse tree node.
 * @param propertyName - Property name to look for.
 * @param altPropertyName - Optional alternate property name.
 * @returns The child node, or null if not found.
 */
function getChild(
  node: Readonly<ParseTreeNode>,
  propertyName: string,
  altPropertyName?: string
): Readonly<ParseTreeNode> | null {
  // First check if it's a direct property
  if (propertyName in node) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Property access validated by 'in' check
    const value = (node as unknown as Record<string, unknown>)[propertyName];
    if (value !== undefined && value !== null && typeof value === 'object' && 'type' in value) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type validated by property checks
      return value as ParseTreeNode;
    }
    return null;
  }

  if (altPropertyName != null && altPropertyName in node) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Property access validated by 'in' check
    const value = (node as unknown as Record<string, unknown>)[altPropertyName];
    if (value !== undefined && value !== null && typeof value === 'object' && 'type' in value) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Type validated by property checks
      return value as Readonly<ParseTreeNode>;
    }
    return null;
  }

  // If not a property, search through children for matching type
  const children = getChildren(node);
  for (const child of children) {
    if (child.type === propertyName || child.type.toLowerCase() === propertyName.toLowerCase()) {
      return child;
    }
  }

  // If altPropertyName provided, also search for it
  if (altPropertyName != null) {
    for (const child of children) {
      if (
        child.type === altPropertyName ||
        child.type.toLowerCase() === altPropertyName.toLowerCase()
      ) {
        return child;
      }
    }
  }

  // No matching child found
  return null;
}

/**
 * Get a property value from a parse tree node.
 * @template T - The type of the property value.
 * @param node - The parse tree node.
 * @param names - Property names to try.
 * @returns The property value, or undefined if not found.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Type parameter used for API clarity and type assertions
function getProperty<T>(node: Readonly<ParseTreeNode>, ...names: readonly string[]): T | undefined {
  for (const name of names) {
    if (name in node) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Property access validated by 'in' check, generic type T is caller's responsibility
      return (node as Record<string, unknown>)[name] as T;
    }
  }
  return undefined;
}

/**
 * Get text content from a parse tree node.
 * @param node - The parse tree node.
 * @returns The text content, or undefined if not found.
 */
function getText(node: Readonly<ParseTreeNode>): string | undefined {
  return node.text ?? getProperty<string>(node, 'value', 'content');
}

/**
 * Get location option for node factory if location is enabled.
 * @param node - The parse tree node containing location information.
 * @param includeLocation - Whether to include location information.
 * @returns The location option object if location is enabled and available, otherwise undefined.
 */
function getLocationOption(
  node: Readonly<ParseTreeNode>,
  includeLocation: boolean
): Readonly<NodeFactoryOptions> | undefined {
  return includeLocation && node.location
    ? ({ location: node.location } as Readonly<NodeFactoryOptions>)
    : undefined;
}

/**
 * Try to translate a parse tree node as a type reference.
 * @param node - The parse tree node to translate.
 * @param includeLocation - Whether to include location information.
 * @returns The translated type reference, or null if the node is not a type.
 */
function tryTranslateType(node: Readonly<ParseTreeNode>, includeLocation: boolean): TypeRef | null {
  const nodeType = node.type.toLowerCase();

  // Handle base_type nodes (children of type nodes)
  if (nodeType === 'base_type') {
    const name = getText(node) ?? getProperty<string>(node, 'name') ?? 'Object';
    // Void type has empty components array
    if (name.toLowerCase() === 'void') {
      const emptyComponents: TypeRefComponent[] = [];
      const voidArrayNesting = 0;
      return NodeFactory.createTypeRef(
        emptyComponents,
        voidArrayNesting,
        getLocationOption(node, includeLocation)
      );
    }
    return NodeFactory.createSimpleTypeRef(name);
  }

  // Handle primitive_type nodes
  if (nodeType === 'primitive_type') {
    const name = getText(node) ?? getProperty<string>(node, 'name') ?? 'Object';
    // Void type has empty components array
    if (name.toLowerCase() === 'void') {
      const emptyComponents: TypeRefComponent[] = [];
      const voidArrayNesting = 0;
      return NodeFactory.createTypeRef(
        emptyComponents,
        voidArrayNesting,
        getLocationOption(node, includeLocation)
      );
    }
    return NodeFactory.createSimpleTypeRef(name);
  }

  // Handle void_type nodes (synthetic nodes for constructors)
  if (nodeType === 'void_type') {
    const emptyComponents: TypeRefComponent[] = [];
    const voidArrayNesting = 0;
    return NodeFactory.createTypeRef(
      emptyComponents,
      voidArrayNesting,
      getLocationOption(node, includeLocation)
    );
  }

  // Handle type nodes - extract base_type or primitive_type from children
  if (nodeType === 'type') {
    // First, try to get the text directly from the type node
    const directText = getText(node);
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Checking if string has content after trimming
    if (directText != null && directText.trim().length > 0) {
      if (directText.toLowerCase() === 'void') {
        const emptyComponents: TypeRefComponent[] = [];
        const voidArrayNesting = 0;
        return NodeFactory.createTypeRef(
          emptyComponents,
          voidArrayNesting,
          getLocationOption(node, includeLocation)
        );
      }
      // Check for array dimensions
      const arrayDimensionsNode = getChild(node, 'array_dimensions');
      const defaultArrayNesting = 0;
      const parseIntRadix = 10;
      const arrayNesting = arrayDimensionsNode
        ? parseInt(getText(arrayDimensionsNode) ?? String(defaultArrayNesting), parseIntRadix)
        : defaultArrayNesting;
      return NodeFactory.createSimpleTypeRef(directText, arrayNesting);
    }

    // Look for base_type child
    const baseTypeNode = getChild(node, 'base_type') ?? getChild(node, 'primitive_type');
    if (baseTypeNode) {
      const qualifiedName =
        getText(baseTypeNode) ?? getProperty<string>(baseTypeNode, 'name') ?? 'Object';

      // Void type has empty components array (not a component named "void")
      if (qualifiedName.toLowerCase() === 'void') {
        const emptyComponents: TypeRefComponent[] = [];
        const voidArrayNesting = 0;
        return NodeFactory.createTypeRef(
          emptyComponents,
          voidArrayNesting,
          getLocationOption(node, includeLocation)
        );
      }

      // Check for array dimensions
      const arrayDimensionsNode = getChild(node, 'array_dimensions');
      const defaultArrayNesting = 0;
      const parseIntRadix = 10;
      const arrayNesting = arrayDimensionsNode
        ? parseInt(getText(arrayDimensionsNode) ?? String(defaultArrayNesting), parseIntRadix)
        : defaultArrayNesting;

      // Check for type arguments (generics) - they apply only to the last component
      const typeArgumentsNode = getChild(node, 'type_arguments');
      let typeArguments: TypeRef[] = [];
      if (typeArgumentsNode) {
        const typeArgChildren = getChildren(typeArgumentsNode);
        typeArguments = typeArgChildren
          .map((child) => tryTranslateType(child, includeLocation))
          .filter((t): t is TypeRef => t !== null);
      }

      // Split qualified name (e.g. "A.B.C") into components; type args apply only to the last
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Filtering out empty strings
      const parts = qualifiedName.split('.').filter((s) => s.length > 0);
      const lastIndexOffset = 1;
      const components = parts.map((part, i) => ({
        args: i === parts.length - lastIndexOffset ? typeArguments : [],
        id: NodeFactory.createIdentifier(part),
      }));

      return NodeFactory.createTypeRef(
        components,
        arrayNesting,
        getLocationOption(node, includeLocation)
      );
    }

    // Fallback: try to get name directly from type node
    const name = getText(node) ?? getProperty<string>(node, 'name') ?? 'Object';
    // Void type has empty components array
    if (name === 'void') {
      const emptyComponents: TypeRefComponent[] = [];
      const voidArrayNesting = 0;
      return NodeFactory.createTypeRef(
        emptyComponents,
        voidArrayNesting,
        getLocationOption(node, includeLocation)
      );
    }
    return NodeFactory.createSimpleTypeRef(name);
  }
  return null;
}

/**
 * Extract modifiers from a parse tree node.
 * @param ctx - Translation context with helper methods (getChild, getChildren, getText, getProperty).
 * @param node - The parse tree node to extract modifiers from.
 * @returns An array of Modifier nodes found in the parse tree.
 */
function extractModifiers(
  ctx: Readonly<{
    getChild: (
      node: Readonly<ParseTreeNode>,
      propertyName: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode> | null;
    getChildren: (
      node: Readonly<ParseTreeNode>,
      propertyName?: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode>[];
    getText: (node: Readonly<ParseTreeNode>) => string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Type parameter used for API clarity and type assertions
    getProperty: <T>(node: Readonly<ParseTreeNode>, ...names: readonly string[]) => T | undefined;
  }>,
  node: Readonly<ParseTreeNode>
): Modifier[] {
  const modifiers: Modifier[] = [];
  const modifiersNode = ctx.getChild(node, 'modifiers');
  if (modifiersNode) {
    const modifierChildren = ctx.getChildren(modifiersNode);
    for (const modifierNode of modifierChildren) {
      const modifierText =
        ctx.getText(modifierNode) ?? ctx.getProperty<string>(modifierNode, 'text') ?? '';
      if (modifierText) {
        const lowerText = modifierText.toLowerCase();
        // Map Apex-specific keywords to ModifierKeyword type
        let keyword: ModifierKeyword | null = null;
        if (lowerText === 'public') keyword = 'public';
        else if (lowerText === 'private') keyword = 'private';
        else if (lowerText === 'protected') keyword = 'protected';
        else if (lowerText === 'global') keyword = 'global';
        else if (lowerText === 'static') keyword = 'static';
        else if (lowerText === 'final') keyword = 'final';
        else if (lowerText === 'abstract') keyword = 'abstract';
        else if (lowerText === 'override') keyword = 'override';
        else if (lowerText === 'transient') keyword = 'transient';
        else if (lowerText === 'webservice') keyword = 'webservice';
        else if (lowerText === 'testmethod' || lowerText === 'test') keyword = 'testMethod';
        else if (lowerText === 'future') keyword = 'future';
        else if (lowerText === 'deprecated') keyword = 'deprecated';
        else if (lowerText === 'virtual') keyword = 'virtual';
        else if (lowerText === 'with sharing') keyword = 'with sharing';
        else if (lowerText === 'without sharing') keyword = 'without sharing';
        else if (lowerText === 'inherited sharing') keyword = 'inherited sharing';

        if (keyword) {
          modifiers.push({
            keyword,
            kind: 'Modifier',
            location: modifierNode.location,
          });
        }
      }
    }
  }
  return modifiers;
}

/**
 * Extract type parameters from a parse tree node.
 * @param ctx - Translation context with helper methods (getChild, getChildren, getText, getProperty, tryTranslateType).
 * @param node - The parse tree node to extract type parameters from.
 * @returns An array of TypeParameter nodes found in the parse tree.
 */
function extractTypeParameters(
  ctx: Readonly<{
    getChild: (
      node: Readonly<ParseTreeNode>,
      propertyName: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode> | null;
    getChildren: (
      node: Readonly<ParseTreeNode>,
      propertyName?: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode>[];
    getText: (node: Readonly<ParseTreeNode>) => string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Type parameter used for API clarity and type assertions
    getProperty: <T>(node: Readonly<ParseTreeNode>, ...names: readonly string[]) => T | undefined;
    tryTranslateType: (node: Readonly<ParseTreeNode>) => TypeRef | null;
  }>,
  node: Readonly<ParseTreeNode>
): TypeParameter[] {
  const typeParams: TypeParameter[] = [];
  const typeParamsNode = ctx.getChild(node, 'type_parameters', 'typeParameters');
  if (typeParamsNode) {
    const paramChildren = ctx.getChildren(typeParamsNode);
    for (const paramNode of paramChildren) {
      if (
        paramNode.type === 'type_parameter' ||
        paramNode.type.toLowerCase() === 'type_parameter'
      ) {
        const nameNode = ctx.getChild(paramNode, 'name');
        const name = nameNode
          ? (ctx.getText(nameNode) ?? ctx.getProperty<string>(nameNode, 'name') ?? '')
          : '';
        if (name) {
          // Look for extends bound - it's the child that's not 'name'
          const allChildren = ctx.getChildren(paramNode);
          let extendsBound: TypeRef | undefined = undefined;
          for (const child of allChildren) {
            if (child !== nameNode && (child.type === 'type' || child.type === 'primitive_type')) {
              const bound = ctx.tryTranslateType(child);
              if (bound) {
                extendsBound = bound;
                break;
              }
            }
          }
          typeParams.push({
            extendsBound,
            kind: 'TypeParameter',
            location: paramNode.location,
            name,
          });
        }
      }
    }
  }
  return typeParams;
}

/**
 * Build a single Annotation from an annotation parse node.
 * Used by extractAnnotations and recursively by parseElementValue for nested annotations.
 * @param ctx - Translation context with helper methods (getChild, getChildren, getText, getProperty, parseElementValue).
 * @param annotationNode - The parse tree node representing the annotation.
 * @returns The built Annotation node, or null if the annotation cannot be built.
 */
function buildAnnotationFromNode(
  ctx: Readonly<{
    getChild: (
      node: Readonly<ParseTreeNode>,
      propertyName: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode> | null;
    getChildren: (
      node: Readonly<ParseTreeNode>,
      propertyName?: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode>[];
    getText: (node: Readonly<ParseTreeNode>) => string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- Type parameter used for API clarity and type assertions
    getProperty: <T>(node: Readonly<ParseTreeNode>, ...names: readonly string[]) => T | undefined;
    parseElementValue: (valueNode: Readonly<ParseTreeNode>) => ElementValue | null;
  }>,
  annotationNode: Readonly<ParseTreeNode>
): Annotation | null {
  const annotationNameNode = ctx.getChild(annotationNode, 'name');
  const annotationName = annotationNameNode
    ? (ctx.getText(annotationNameNode) ?? ctx.getProperty<string>(annotationNameNode, 'name') ?? '')
    : '';
  if (!annotationName) return null;

  const argsNode = ctx.getChild(annotationNode, 'arguments', 'args');
  const args: AnnotationArgument[] = [];
  if (argsNode) {
    const argChildren = ctx.getChildren(argsNode);
    for (const argNode of argChildren) {
      const argNameNode = ctx.getChild(argNode, 'name');
      const argName = argNameNode
        ? (ctx.getText(argNameNode) ?? ctx.getProperty<string>(argNameNode, 'name'))
        : undefined;
      // Parser: annotation_argument has children [value] or [name, value]; value has type annotation_expression, new_expression, or expression
      const argChildrenList = ctx.getChildren(argNode);
      const emptyArrayLengthLocal = 0;
      if (argChildrenList.length === emptyArrayLengthLocal) continue;
      const lastIndexOffset = 1;
      const valueNode =
        argChildrenList.find((c) => c.type !== 'name') ??
        argChildrenList[argChildrenList.length - lastIndexOffset];
      const elementValue = ctx.parseElementValue(valueNode);
      if (elementValue === null) continue;
      args.push({
        isNameImplicit: argName == null || argName === '',
        kind: 'AnnotationArgument',
        location: argNode.location,
        name: argName,
        value: elementValue,
      });
    }
  }
  return {
    arguments: args,
    kind: 'Annotation',
    location: annotationNode.location,
    name: annotationName,
  };
}

/**
 * Parse an annotation argument value (annotation_expression, new_expression/array, or expression) into an ElementValue.
 * @param ctx - Translation context with helper methods (getChild, getChildren, getLocationOption, buildAnnotationFromNode, tryTranslateExpression, parseElementValue).
 * @param valueNode - The parse tree node containing the annotation argument value to parse.
 * @returns The parsed ElementValue node, or null if the value cannot be parsed.
 */
function parseElementValue(
  ctx: Readonly<{
    getChild: (
      node: Readonly<ParseTreeNode>,
      propertyName: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode> | null;
    getChildren: (
      node: Readonly<ParseTreeNode>,
      propertyName?: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode>[];
    getLocationOption: (node: Readonly<ParseTreeNode>) => Readonly<NodeFactoryOptions> | undefined;
    buildAnnotationFromNode: (annotationNode: Readonly<ParseTreeNode>) => Annotation | null;
    tryTranslateExpression: (node: Readonly<ParseTreeNode>, nodeType: string) => Expression | null;
    parseElementValue: (valueNode: Readonly<ParseTreeNode>) => ElementValue | null;
  }>,
  valueNode: Readonly<ParseTreeNode>
): ElementValue | null {
  const nodeType = valueNode.type.toLowerCase();
  if (nodeType === 'annotation_expression') {
    const children = ctx.getChildren(valueNode);
    const emptyArrayLength = 0;
    if (children.length === emptyArrayLength) return null;
    const [inner] = children;
    const ann = ctx.buildAnnotationFromNode(inner);
    if (!ann) return null;
    return NodeFactory.createAnnotationElementValue(ann, ctx.getLocationOption(valueNode));
  }
  if (nodeType === 'new_expression') {
    const valsInit =
      ctx.getChild(valueNode, 'values_initializer') ??
      ctx.getChildren(valueNode).find((c) => c.type.toLowerCase() === 'values_initializer');
    if (!valsInit) return null;
    const elNodes = ctx.getChildren(valsInit);
    const evals = elNodes
      .map((e) => ctx.parseElementValue(e))
      .filter((x): x is ElementValue => x != null);
    return NodeFactory.createArrayElementValue(evals, ctx.getLocationOption(valueNode));
  }
  const expr = ctx.tryTranslateExpression(valueNode, nodeType);
  if (expr) {
    return NodeFactory.createExpressionElementValue(expr, ctx.getLocationOption(valueNode));
  }
  return null;
}

/**
 * Extract annotations from a parse tree node.
 * @param ctx - Translation context with helper methods (getChild, getChildren, buildAnnotationFromNode).
 * @param node - The parse tree node to extract annotations from.
 * @returns An array of Annotation nodes found in the parse tree.
 */
function extractAnnotations(
  ctx: Readonly<{
    getChild: (
      node: Readonly<ParseTreeNode>,
      propertyName: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode> | null;
    getChildren: (
      node: Readonly<ParseTreeNode>,
      propertyName?: string,
      altPropertyName?: string
    ) => Readonly<ParseTreeNode>[];
    buildAnnotationFromNode: (annotationNode: Readonly<ParseTreeNode>) => Annotation | null;
  }>,
  node: Readonly<ParseTreeNode>
): Annotation[] {
  const annotations: Annotation[] = [];
  const annotationsNode = ctx.getChild(node, 'annotations');
  if (annotationsNode) {
    const annotationChildren = ctx.getChildren(annotationsNode);
    for (const annotationNode of annotationChildren) {
      const ann = ctx.buildAnnotationFromNode(annotationNode);
      if (ann) annotations.push(ann);
    }
  }
  return annotations;
}

export {
  TranslationError,
  getChildren,
  getChild,
  getProperty,
  getText,
  getLocationOption,
  tryTranslateType,
  extractModifiers,
  extractTypeParameters,
  buildAnnotationFromNode,
  parseElementValue,
  extractAnnotations,
};
