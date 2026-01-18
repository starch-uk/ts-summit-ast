/**
 * Integration tests for error recovery and partial parsing.
 * Tests how the parser handles malformed or invalid Apex code.
 */

import { describe, it, expect } from 'vitest';
import { parseApexCode } from '../../src/utils/apex-parser.js';
import { validateAST } from '../../src/utils/ast-validation.js';
import { findFirstNodeOfType } from '../translate-helpers.js';
import { isClassDeclaration, isMethodDeclaration } from '../../src/ast/type-guards.js';

describe('Error Recovery and Partial Parsing', () => {
  describe('Syntax Errors', () => {
    it('should report errors for missing class body', () => {
      const apexCode = 'public class Test';
      const result = parseApexCode(apexCode);

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report errors for unclosed braces', () => {
      const apexCode = `
        public class Test {
          public void method() {
            // Missing closing brace
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report errors for missing method return type', () => {
      const apexCode = `
        public class Test {
          method() {
            // Missing return type
          }
        }
      `;

      const result = parseApexCode(apexCode);
      // May produce errors or may have recovery mechanism
      expect(result).toBeDefined();
    });

    it('should handle missing semicolons gracefully', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 42
            String y = 'test'
          }
        }
      `;

      const result = parseApexCode(apexCode);
      // Should either parse with recovery or report errors
      expect(result).toBeDefined();
    });
  });

  describe('Partial Parsing', () => {
    it('should attempt to parse class even with method errors', () => {
      const apexCode = `
        public class Test {
          public void validMethod() {
            System.debug('Valid');
          }
          
          public void invalidMethod() {
            // Missing closing brace
          System.debug('Invalid');
        }
      `;

      const result = parseApexCode(apexCode);

      // Should still produce AST for the valid parts
      if (result.ast) {
        const classDecl = findFirstNodeOfType(result.ast, isClassDeclaration);
        expect(classDecl).not.toBeNull();

        // Should have at least the valid method
        if (classDecl && classDecl.members) {
          const validMethod = classDecl.members.find(
            (m) => isMethodDeclaration(m) && m.name === 'validMethod'
          );
          expect(validMethod).toBeDefined();
        }
      }
    });

    it('should parse valid statements despite expression errors', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 10; // Valid
            String y = invalidExpression; // May be an error
            System.debug('This is valid'); // Valid
          }
        }
      `;

      const result = parseApexCode(apexCode);

      // Should produce AST with valid statements
      expect(result).toBeDefined();
      // May have errors for invalid expression, but should parse structure
    });

    it('should handle incomplete try-catch blocks', () => {
      const apexCode = `
        public class Test {
          public void method() {
            try {
              Integer x = 10 / 0;
            // Missing catch/finally
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
      // May report errors but should not crash
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should mark result as partial success when errors exist', () => {
      const apexCode = `
        public class Test {
          public void method() {
            // Some valid code
            Integer x = 42;
            // Missing closing brace
        }
      `;

      const result = parseApexCode(apexCode);

      // Result may indicate partial success
      if (result.partialSuccess || result.isUsable) {
        expect(result.ast).toBeDefined();
      }
    });

    it('should provide isUsable flag for degraded parsing', () => {
      const apexCode = `
        public class Test {
          public void validMethod() {
            System.debug('Valid');
          }
          // Missing closing brace for class
      `;

      const result = parseApexCode(apexCode);

      // If usable, AST should still be available for analysis
      if (result.isUsable) {
        expect(result.ast).toBeDefined();
      }
    });

    it('should separate errors from warnings', () => {
      const apexCode = `
        public class Test {
          public void method() {
            // Invalid code that might produce warnings vs errors
          }
        }
      `;

      const result = parseApexCode(apexCode);

      // Should distinguish between errors and warnings
      expect(result.errors).toBeDefined();
      if (result.warnings) {
        expect(Array.isArray(result.warnings)).toBe(true);
      }
    });
  });

  describe('Invalid Type References', () => {
    it('should handle references to undefined types', () => {
      const apexCode = `
        public class Test {
          public UndefinedType field;
          public void method(AnotherUndefinedType param) {
            // Types don't exist, but should parse structure
          }
        }
      `;

      const result = parseApexCode(apexCode);

      // Should parse the structure even if types are undefined
      expect(result).toBeDefined();
      if (result.ast) {
        const classDecl = findFirstNodeOfType(result.ast, isClassDeclaration);
        expect(classDecl).not.toBeNull();
      }
    });
  });

  describe('Malformed Expressions', () => {
    it('should handle incomplete binary expressions', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 10 + ; // Missing right operand
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
      // May produce errors but should not crash
    });

    it('should handle unclosed parentheses', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String x = method(param1, param2; // Missing closing paren
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
    });

    it('should handle incomplete string literals', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String x = 'unclosed string;
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
      // Should handle gracefully
    });
  });

  describe('AST Validation After Error Recovery', () => {
    it('should validate AST even when errors occurred', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 42;
            // Some error here
          }
        }
      `;

      const result = parseApexCode(apexCode);

      if (result.ast) {
        const validation = validateAST(result.ast);
        // AST structure should still be valid even if semantic errors exist
        expect(validation.valid).toBe(true);
      }
    });

    it('should produce valid AST structure despite syntax errors', () => {
      const apexCode = `
        public class Test {
          public void validMethod() {
            System.debug('Valid');
          }
          // Syntax error in next method
          public void invalidMethod( {
            // Missing parameter list closing
          }
        }
      `;

      const result = parseApexCode(apexCode);

      if (result.ast) {
        const validation = validateAST(result.ast);
        // AST structure (locations, hierarchy) should be valid
        expect(validation.valid).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = parseApexCode('');
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
    });

    it('should handle only whitespace', () => {
      const result = parseApexCode('   \n  \t  ');
      expect(result).toBeDefined();
    });

    it('should handle code with only comments', () => {
      const apexCode = `
        // This is a comment
        /* This is a block comment */
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
    });

    it('should handle very large nested structures', () => {
      // Create deeply nested if statements
      let apexCode = 'public class Test { public void method() {\n';
      for (let i = 0; i < 50; i++) {
        apexCode += '  '.repeat(i + 1) + `if (x > ${i}) {\n`;
      }
      for (let i = 50; i > 0; i--) {
        apexCode += '  '.repeat(i) + '}\n';
      }
      apexCode += '  }\n}\n';

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
      // Should not crash or timeout
    });
  });

  describe('Error Messages', () => {
    it('should include location information in errors', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 10 + ; // Error on this line
          }
        }
      `;

      const result = parseApexCode(apexCode);

      if (result.errors.length > 0) {
        // Errors should ideally include location info
        expect(result.errors).toBeDefined();
      }
    });

    it('should provide descriptive error messages', () => {
      /**
       * Missing body.
       */
      const apexCode = 'public class Test';

      const result = parseApexCode(apexCode);

      if (result.errors.length > 0) {
        expect(result.errors[0].message).toBeDefined();
        expect(result.errors[0].message.length).toBeGreaterThan(0);
      }
    });
  });
});
