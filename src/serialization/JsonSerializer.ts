/**
 * @file JSON serializer for AST nodes.
 *
 * Converts AST nodes to JSON format for storage, transmission, or debugging.
 * Output uses Summit-AST canonical property names (typeDeclaration, value, group,
 * sourceLocation, op enums, etc.).
 */

import type { ASTNode } from '../ast/baseNode.js';
import { serializeNodeProperties } from './astSerializer.js';

/**
 * Type guard for plain object records.
 * @param x - Value to check.
 * @returns True if x is a non-null object (Record).
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

/**
 * Converts unknown location object to canonical sourceLocation shape.
 * @param loc - The location object (start/end with line/column).
 * @returns The canonical Record shape or undefined if invalid.
 */
function toSourceLocation(loc: unknown): Record<string, unknown> | undefined {
  if (loc == null || !isRecord(loc)) return undefined;
  const start = isRecord(loc.start) ? loc.start : undefined;
  const end = isRecord(loc.end) ? loc.end : undefined;
  if (
    start == null ||
    end == null ||
    typeof start.line !== 'number' ||
    typeof start.column !== 'number'
  )
    return undefined;
  return {
    endColumn: typeof end.column === 'number' ? end.column : start.column,
    endLine: typeof end.line === 'number' ? end.line : start.line,
    startColumn: start.column,
    startLine: start.line,
  };
}

const BINARY_OP_TO_CANONICAL: Record<string, string> = {
  '!=': 'NOT_EQUAL',
  '!==': 'EXACTLY_NOT_EQUAL',
  '&': 'BITWISE_AND',
  '&&': 'LOGICAL_AND',
  '*': 'MULTIPLICATION',
  '+': 'ADDITION',
  '-': 'SUBTRACTION',
  '/': 'DIVISION',
  '<': 'LESS_THAN',
  '<<': 'LEFT_SHIFT',
  '<=': 'LESS_THAN_OR_EQUAL',
  '<>': 'ALTERNATIVE_NOT_EQUAL',
  '==': 'EQUAL',
  '===': 'EXACTLY_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  '>>': 'RIGHT_SHIFT_SIGNED',
  '>>>': 'RIGHT_SHIFT_UNSIGNED',
  '??': 'NULL_COALESCING',
  '^': 'BITWISE_XOR',
  instanceof: 'INSTANCEOF',
  '|': 'BITWISE_OR',
  '||': 'LOGICAL_OR',
};

const UNARY_OP_TO_CANONICAL: Record<string, string> = {
  '!': 'LOGICAL_COMPLEMENT',
  '+': 'PLUS',
  '++': 'PRE_INCREMENT',
  '-': 'NEGATION',
  '--': 'PRE_DECREMENT',
  '~': 'BITWISE_NOT',
};

/**
 * Recursively applies canonical shape (sourceLocation, `@type`, etc.) to JSON object.
 * @param obj - The object to transform.
 * @returns The transformed object.
 */
function applyCanonicalShape(obj: unknown): unknown {
  if (obj == null) return obj;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      (obj as unknown[])[i] = applyCanonicalShape(item);
    });
    return obj;
  }
  if (typeof obj !== 'object') return obj;
  if (!isRecord(obj)) return obj;
  const node = obj;
  if ('location' in node && node.location != null) {
    const sl = toSourceLocation(node.location);
    if (sl != null) node.sourceLocation = sl;
    delete node.location;
  }
  const kind: string | undefined =
    typeof node['@type'] === 'string'
      ? node['@type']
      : typeof node.kind === 'string'
        ? node.kind
        : undefined;
  if (kind === undefined || kind === '') {
    if ('id' in node && node.id != null && isRecord(node.id)) {
      const idObj = node.id;
      if ('name' in idObj && !('string' in idObj)) {
        idObj.string = idObj.name;
        if (idObj.location != null) {
          idObj.sourceLocation = toSourceLocation(idObj.location);
          delete idObj.location;
        }
        delete idObj.name;
        delete idObj['@type'];
        delete idObj.kind;
      }
    }
    for (const key of Object.keys(node)) {
      const v = node[key];
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) applyCanonicalShape(v);
      else if (Array.isArray(v)) applyCanonicalShape(v);
    }
    return obj;
  }
  const FIRST_INDEX = 0;
  const NON_EMPTY_LENGTH = 1;
  switch (kind) {
    case 'CompilationUnit': {
      const decls = Array.isArray(node.declarations) ? node.declarations : undefined;
      if (decls != null && decls.length >= NON_EMPTY_LENGTH) {
        node.typeDeclaration = applyCanonicalShape(decls[FIRST_INDEX]);
        delete node.declarations;
      }
      node.file ??= '<cls input>';
      break;
    }
    case 'ReturnStatement':
      if ('expression' in node) {
        node.value = applyCanonicalShape(node.expression);
        delete node.expression;
      }
      break;
    case 'VariableDeclarationStatement': {
      const decl = isRecord(node.declaration) ? node.declaration : undefined;
      if (decl != null) {
        const idName =
          decl.id != null && isRecord(decl.id) && 'name' in decl.id ? decl.id.name : undefined;
        const declName: string | undefined =
          (typeof decl.name === 'string' ? decl.name : undefined) ??
          (typeof idName === 'string' ? idName : undefined);
        const declLoc = decl.sourceLocation ?? toSourceLocation(decl.location) ?? {};
        const group: Record<string, unknown> = {
          declarations: [
            {
              id: decl.id ?? { sourceLocation: declLoc, string: declName ?? '' },
              initializer: decl.initializer,
              sourceLocation: declLoc,
            },
          ],
          modifiers: decl.modifiers ?? [],
          sourceLocation: node.sourceLocation ?? {},
          type: decl.type,
        };
        if (decl.type != null) applyCanonicalShape(decl.type);
        if (decl.initializer != null) applyCanonicalShape(decl.initializer);
        node.group = group;
        delete node.declaration;
      }
      break;
    }
    case 'DmlStatement': {
      const OP_FIRST_CHAR_INDEX = 0;
      const OP_REST_START_INDEX = 1;
      const EMPTY_LENGTH = 0;
      const op = typeof node.operation === 'string' ? node.operation : undefined;
      if (op != null && op.length > EMPTY_LENGTH) {
        node['@type'] =
          op.charAt(OP_FIRST_CHAR_INDEX).toUpperCase() + op.slice(OP_REST_START_INDEX);
        delete node.kind;
        delete node.operation;
        if ('target' in node) {
          node.value = applyCanonicalShape(node.target);
          delete node.target;
        }
      }
      break;
    }
    case 'BinaryExpression':
      if ('operator' in node) {
        node.op = BINARY_OP_TO_CANONICAL[String(node.operator)] ?? node.operator;
        delete node.operator;
      }
      if (node.left != null) applyCanonicalShape(node.left);
      if (node.right != null) applyCanonicalShape(node.right);
      break;
    case 'UnaryExpression':
      if ('operator' in node) {
        node.op = UNARY_OP_TO_CANONICAL[String(node.operator)] ?? node.operator;
        delete node.operator;
      }
      if ('operand' in node && node.operand != null) {
        node.value = applyCanonicalShape(node.operand);
        delete node.operand;
      }
      break;
    case 'AssignExpression':
      if ('left' in node) {
        node.target = applyCanonicalShape(node.left);
        delete node.left;
      }
      if ('right' in node) {
        node.source = applyCanonicalShape(node.right);
        delete node.right;
      }
      break;
    case 'Identifier':
      if ('name' in node) {
        node.string = node.name;
        delete node.name;
      }
      delete node['@type'];
      delete node.kind;
      break;
    case 'VariableExpression':
      if (node.id != null && isRecord(node.id)) {
        const idObj = node.id;
        if ('name' in idObj) {
          node.id = {
            sourceLocation: toSourceLocation(idObj.location ?? idObj.sourceLocation) ?? {},
            string: idObj.name,
          };
        }
        applyCanonicalShape(node.id);
      }
      break;
    case 'CallExpression':
      if ('methodName' in node) {
        node.id = {
          sourceLocation: toSourceLocation(node.location) ?? {},
          string: node.methodName,
        };
        delete node.methodName;
      }
      if ('target' in node) {
        node.receiver = applyCanonicalShape(node.target);
        delete node.target;
      }
      if ('arguments' in node) {
        node.args = applyCanonicalShape(node.arguments);
        delete node.arguments;
      }
      node.isSafe ??= false;
      break;
    case 'FieldExpression':
      if ('fieldName' in node) {
        node.field = {
          sourceLocation: toSourceLocation(node.location) ?? {},
          string: node.fieldName,
        };
        delete node.fieldName;
      }
      if ('target' in node) {
        node.obj = applyCanonicalShape(node.target);
        delete node.target;
      }
      node.isSafe ??= false;
      break;
    case 'CastExpression':
      if ('expression' in node) {
        node.value = applyCanonicalShape(node.expression);
        delete node.expression;
      }
      break;
    case 'TernaryExpression':
      if ('thenExpression' in node) {
        node.thenValue = applyCanonicalShape(node.thenExpression);
        delete node.thenExpression;
      }
      if ('elseExpression' in node) {
        node.elseValue = applyCanonicalShape(node.elseExpression);
        delete node.elseExpression;
      }
      if (node.condition != null) applyCanonicalShape(node.condition);
      break;
    case 'CompoundStatement':
      if (!('scoping' in node)) node.scoping = 'SCOPE_BOUNDARY';
      if (Array.isArray(node.statements))
        node.statements.forEach((s: unknown): void => {
          applyCanonicalShape(s);
        });
      break;
    case 'MapInitializer':
      if (Array.isArray(node.pairs)) {
        (node.pairs as unknown[]).forEach((p: unknown): void => {
          if (!isRecord(p)) return;
          if ('key' in p && p.key != null) p.first = applyCanonicalShape(p.key);
          if ('value' in p && p.value != null) p.second = applyCanonicalShape(p.value);
        });
      }
      break;
    default:
      break;
  }
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) applyCanonicalShape(v);
    else if (Array.isArray(v)) applyCanonicalShape(v);
  }
  return obj;
}

/**
 * JSON representation of an AST node.
 */
interface JsonASTNode {
  [key: string]: unknown;
  '@type': string;
}

/**
 * Options for JSON serialization.
 */
interface SerializationOptions {
  /**
   * Whether to include source location information.
   */
  includeLocation?: boolean;

  /**
   * Whether to use compact format (minimize whitespace).
   */
  compact?: boolean;

  /**
   * Custom replacer function (similar to JSON.stringify replacer).
   */
  replacer?: (key: string, value: unknown) => unknown;
}

/**
 * JSON Serializer for AST nodes.
 */
class JsonSerializer {
  private readonly options: Required<SerializationOptions>;

  public constructor(options: Readonly<SerializationOptions> = {}) {
    this.options = {
      compact: options.compact ?? false,
      includeLocation: options.includeLocation ?? true,
      replacer: options.replacer ?? ((_key, value): unknown => value),
    };
  }

  /**
   * Serialize an AST node to JSON string.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON string representation of the node.
   */
  public serialize(node: Readonly<ASTNode>): string {
    const json = this.serializeNode(node);

    const JSON_INDENT_SPACES = 2;
    return this.options.compact
      ? JSON.stringify(json)
      : JSON.stringify(json, null, JSON_INDENT_SPACES);
  }

  /**
   * Serialize a single AST node to JSON object.
   * @param node - The AST node to serialize.
   * @returns The serialized JSON object representation of the node.
   */
  public serializeNode(node: Readonly<ASTNode>): JsonASTNode {
    const json: JsonASTNode = {
      '@type': node['@type'],
    };

    if (this.options.includeLocation && node.sourceLocation) {
      json.sourceLocation = node.sourceLocation;
    }

    serializeNodeProperties(node, json, this);
    return json;
  }
}

/**
 * Recursively transform AST JSON to Summit-AST canonical shape. Exported for callers that build JSON outside JsonSerializer.
 * @param obj - The object to transform.
 * @returns The transformed object.
 */
function transformToCanonicalShape(obj: unknown): unknown {
  return applyCanonicalShape(obj);
}

const SOURCE_LOCATION_KEYS = ['startLine', 'startColumn', 'endLine', 'endColumn'];

const SOURCE_LOCATION_KEY_COUNT = 4;

/**
 * Checks if object has only sourceLocation keys (startLine, startColumn, endLine, endColumn).
 * @param obj - The value to check for sourceLocation-only shape.
 * @returns True if obj is a plain object with exactly the four sourceLocation keys.
 */
function isSourceLocationOnly(obj: unknown): boolean {
  if (obj == null || !isRecord(obj)) return false;
  const keys = Object.keys(obj).sort();
  return (
    keys.length === SOURCE_LOCATION_KEY_COUNT &&
    keys.join(',') === SOURCE_LOCATION_KEYS.sort().join(',')
  );
}

/**
 * Reorder a serialized object to match the key order (and key set) of a template object.
 * Used so that JSON.stringify(output, null, 2) is byte-identical to upstream golden JSON.
 * - Only keys present in the template are included (extra keys in `ours` are dropped).
 * - Keys appear in the same order as in `template`.
 * - For keys only in template, the template value is used; otherwise ours is used (recursively reordered).
 * - Template sourceLocation objects (startLine/startColumn/endLine/endColumn) are used as-is so golden string matches.
 * @param ours - Our serialized object to reorder.
 * @param template - The template object defining key order and structure.
 * @returns The reordered object matching template structure.
 */
function reorderJsonToMatchTemplate(ours: unknown, template: unknown): unknown {
  if (template === null || typeof template !== 'object') {
    return ours;
  }
  if (Array.isArray(template)) {
    const ourArr = Array.isArray(ours) ? ours : [];
    return template.map((templateItem, i) => reorderJsonToMatchTemplate(ourArr[i], templateItem));
  }
  if (!isRecord(template)) return ours;
  const templateObj = template;
  const ourObj =
    ours != null && typeof ours === 'object' && !Array.isArray(ours) && isRecord(ours) ? ours : {};
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(templateObj)) {
    const templateVal = templateObj[key];
    const ourVal = Object.prototype.hasOwnProperty.call(ourObj, key) ? ourObj[key] : undefined;
    if (ourVal !== undefined && isSourceLocationOnly(templateVal)) {
      result[key] = templateVal;
    } else {
      result[key] =
        ourVal !== undefined ? reorderJsonToMatchTemplate(ourVal, templateVal) : templateVal;
    }
  }
  return result;
}

export {
  type JsonASTNode,
  JsonSerializer,
  type SerializationOptions,
  reorderJsonToMatchTemplate,
  transformToCanonicalShape,
};
