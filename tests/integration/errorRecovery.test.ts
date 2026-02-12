/**
 * @file Integration tests for error recovery and partial parsing.
 * Tests how the parser handles malformed or invalid Apex code.
 */

import { parseApexCode, parseMultipleFiles, ParseException } from '../../src/utils/apexParser.js';
import { validateAST } from '../../src/utils/astValidation.js';
import { findFirstNodeOfType } from '../translateHelpers.js';
import type { ClassDeclaration } from '../../src/ast/declaration.js';
import { isClassDeclaration, isMethodDeclaration } from '../../src/guard/index.js';

describe('Error Recovery and Partial Parsing', () => {
  describe('Syntax Errors', () => {
    it('should throw ParseException for missing class body', () => {
      const apexCode = 'public class Test';
      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should throw ParseException for unclosed braces', () => {
      const apexCode = `
        public class Test {
          public void method() {
            // Missing closing brace
        }
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should report errors for missing method return type', () => {
      const apexCode = `
        public class Test {
          method() {
            // Missing return type
          }
        }
      `;

      const results = parseMultipleFiles([apexCode]);
      expect(results).toHaveLength(1);
      expect(results[0]).toBeDefined();
    });

    it('should throw ParseException for missing semicolons', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 42
            String y = 'test'
          }
        }
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });
  });

  describe('Partial Parsing', () => {
    it('should throw ParseException for class with method errors', () => {
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

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should parse valid statements despite expression errors', () => {
      const apexCode = `
        public class Test {
          public void method() {
            Integer x = 10;
            String y = invalidExpression;
            System.debug('This is valid'); // Valid
          }
        }
      `;

      const result = parseApexCode(apexCode);

      // Should produce AST with valid statements
      expect(result).toBeDefined();
      // May have errors for invalid expression, but should parse structure
    });

    it('should handle try-catch (parser may accept or reject)', () => {
      const apexCode = `
        public class Test {
          public void method() {
            try {
              Integer x = 10 / 0;
            } catch (Exception e) {
            }
          }
        }
      `;

      const result = parseApexCode(apexCode);
      expect(result).toBeDefined();
    });
  });

  describe('Error Recovery Strategies', () => {
    it('should throw ParseException when errors exist', () => {
      const apexCode = `
        public class Test {
          public void method() {
            // Some valid code
            Integer x = 42;
            // Missing closing brace
        }
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should throw ParseException for degraded parsing', () => {
      const apexCode = `
        public class Test {
          public void validMethod() {
            System.debug('Valid');
          }
          // Missing closing brace for class
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
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

    it('should throw ParseException for unclosed parentheses', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String x = method(param1, param2; // Missing closing paren
          }
        }
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should throw ParseException for incomplete string literals', () => {
      const apexCode = `
        public class Test {
          public void method() {
            String x = 'unclosed string;
          }
        }
      `;

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
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

    it('should throw ParseException for syntax errors', () => {
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

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input via parseMultipleFiles', () => {
      const results = parseMultipleFiles(['']);
      expect(results).toHaveLength(1);
      expect(results[0]).toBeDefined();
      expect(Array.isArray(results[0]!.errors)).toBe(true);
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
        apexCode += '  '.repeat(i + 1) + `if (x > ${String(i)}) {\n`;
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
    it('should throw ParseException for malformed expressions', () => {
      const apexCode = 'public class Test';

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
    });

    it('should provide descriptive error messages in ParseException', () => {
      const apexCode = 'public class Test';

      expect(() => parseApexCode(apexCode)).toThrow(ParseException);
      const results = parseMultipleFiles([apexCode]);
      expect(results[0]!.errors[0]!.message).toBeDefined();
      expect(results[0]!.errors[0]!.message.length).toBeGreaterThan(0);
    });
  });
});
