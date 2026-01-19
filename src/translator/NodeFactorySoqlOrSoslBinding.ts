/**
 * @file Factory for creating SoqlOrSoslBinding AST nodes.
 */

import type { SoqlOrSoslBinding } from '../ast/SoqlOrSoslBinding.js';
import type { Expression } from '../ast/Expression.js';
import type { NodeFactoryOptions } from './NodeFactoryOptions.js';

/**
 * Factory for creating SoqlOrSoslBinding AST nodes.
 */
export const SoqlOrSoslBindingFactory = {
  /**
   * Creates a SoqlOrSoslBinding AST node.
   * @param expr - The expression to bind.
   * @param options - Optional factory options.
   * @returns The created SoqlOrSoslBinding node.
   */
  createSoqlOrSoslBinding(expr: Expression, options?: NodeFactoryOptions): SoqlOrSoslBinding {
    return {
      expr,
      kind: 'SoqlOrSoslBinding',
      // Use the expression's location if available
      location: options?.location ?? expr.location,
    };
  },
};
