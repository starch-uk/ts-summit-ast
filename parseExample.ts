/**
 * Script to parse Apex code and display the AST
 */

import { parseApexCode, JsonSerializer } from './src/index.js';
import { writeFileSync } from 'fs';

// First test with a simple example
const simpleApexCode = `public class Test {
	public void method() {
		System.debug('test');
	}
}`;

// Modified version that works with the parser (using variables instead of string literal method calls)
// Note: The parser doesn't support method calls directly on string literals like 'test'.matches(...)
// So we use variables to work around this limitation while still showing the AST structure
const apexCode = `// Violation: Inline regex patterns should be static final constants
public class Example {
	private Pattern instancePattern = Pattern.compile('instance'); // instance field with inline pattern
	private static Pattern staticPattern = Pattern.compile('static'); // static field without final modifier

	public void processInput(String input) {
		Pattern p = Pattern.compile('test.*pattern'); // inline regex pattern should be static final
		
		// Note: Original had 'test'.matches('test.*pattern') - using variable instead
		String testStr = 'test';
		Boolean matches = testStr.matches('test.*pattern'); // inline regex pattern in matches() call

		String pattern = 'test.*pattern'; // pattern stored in non-final variable
		Pattern.compile(pattern); // pattern from non-final variable

		String localPattern = 'local'; // pattern stored in local variable
		Pattern.compile(localPattern); // pattern from local variable

		Pattern existing = Pattern.compile('existing'); // inline regex pattern
		Pattern p2 = Pattern.compile(existing.pattern()); // pattern from method call result

		Boolean matches3 = Pattern.matches('test.*pattern', 'test123'); // inline regex pattern in Pattern.matches() static method
		Boolean matches4 = Pattern.matches('^[A-Z]+$', input); // inline regex pattern in Pattern.matches() with different pattern

		// Note: Original had 'a,b,c'.split(',') - using variable instead
		String csvStr = 'a,b,c';
		List<String> parts2 = csvStr.split(','); // inline regex pattern in split() call
		
		// Note: Original had 'test'.matches('test.*') - using variable instead
		String testStr2 = 'test';
		Boolean matches2 = testStr2.matches('test.*'); // inline regex pattern in String.matches() instance method
		
		// Note: Original had 'abc123'.replaceAll('\\d', 'X') - using variable instead
		String numStr = 'abc123';
		String replaced = numStr.replaceAll('\\\\d', 'X'); // inline regex pattern in replaceAll() call
		
		// Note: Original had 'abc123'.replaceFirst('\\d', 'X') - using variable instead
		String numStr2 = 'abc123';
		String replaced2 = numStr2.replaceFirst('\\\\d', 'X'); // inline regex pattern in replaceFirst() call
	}
}`;

console.log('Testing with simple example first...\n');
import { parseApexSource } from './src/parser/index.js';

const simpleResult = parseApexCode(simpleApexCode, {
	includeLocation: true,
	includeComments: true,
});

if (simpleResult.ast) {
	console.log('✅ Simple example parsed successfully!');
	console.log('AST Kind:', simpleResult.ast.kind);
} else {
	console.log('❌ Simple example failed:', simpleResult.errors);
}

console.log('\n' + '='.repeat(80));
console.log('Parsing the full example (with workarounds for parser limitations)...');
console.log('='.repeat(80));
console.log('Note: The parser does not support method calls directly on string literals.');
console.log('      Using variables instead to demonstrate the AST structure.\n');

const result = parseApexCode(apexCode, {
	includeLocation: true,
	includeComments: true,
});

if (result.ast) {
	console.log('✅ Parsing successful!\n');
	console.log('AST Kind:', result.ast.kind);
	console.log('\n' + '='.repeat(80));
	console.log('Full AST (JSON):');
	console.log('='.repeat(80) + '\n');

	const serializer = new JsonSerializer({
		compact: false,
		includeLocation: true,
	});

	const json = serializer.serialize(result.ast);
	
	// Write to file for easier viewing
	writeFileSync('ast-output.json', json, 'utf-8');
	console.log('✅ Full AST saved to ast-output.json');
	console.log('\nFirst 2000 characters of AST:');
	console.log('='.repeat(80));
	console.log(json.substring(0, 2000));
	console.log('\n... (truncated, see ast-output.json for full AST)');
} else {
	console.error('❌ Parsing failed!');
	console.error('Errors:', result.errors);
}

if (result.errors.length > 0) {
	console.log('\n' + '='.repeat(80));
	console.log('Parse Errors:');
	console.log('='.repeat(80));
	result.errors.forEach((error, index) => {
		console.log(`\nError ${index + 1}:`);
		console.log(`  Message: ${error.message}`);
		if (error.location) {
			console.log(`  Location: ${JSON.stringify(error.location, null, 2)}`);
		}
		if (error.severity) {
			console.log(`  Severity: ${error.severity}`);
		}
	});
}

if (result.warnings && result.warnings.length > 0) {
	console.log('\n' + '='.repeat(80));
	console.log('Parse Warnings:');
	console.log('='.repeat(80));
	result.warnings.forEach((warning, index) => {
		console.log(`\nWarning ${index + 1}:`);
		console.log(`  Message: ${warning.message}`);
		if (warning.location) {
			console.log(`  Location: ${JSON.stringify(warning.location, null, 2)}`);
		}
	});
}
