/**
 * Modifier node types
 */

import type { ASTNode } from '../base.js';

/**
 * Modifier keywords
 */
export type ModifierKeyword =
  | 'public'
  | 'private'
  | 'protected'
  | 'static'
  | 'final'
  | 'abstract'
  | 'transient'
  | 'volatile'
  | 'synchronized'
  | 'native'
  | 'strictfp'
  | 'global'
  | 'webservice'
  | 'override'
  | 'testMethod'
  | 'future'
  | 'deprecated';

/**
 * Modifier node
 */
export interface Modifier extends ASTNode {
  readonly kind: 'Modifier';
  readonly keyword: ModifierKeyword;
}
