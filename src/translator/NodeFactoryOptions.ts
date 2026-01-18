/**
 * @file Options for creating AST nodes.
 * Shared options interface for NodeFactory methods.
 */

import type { SourceRange } from '../ast/base.js';

export interface NodeFactoryOptions {
  readonly location?: SourceRange;
}
