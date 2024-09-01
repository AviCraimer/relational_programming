import * as ts from "typescript";
import { join } from "path";

// Helper function to read a TypeScript file and create a SourceFile object
function readTypeScriptFile(fileName: string): ts.SourceFile {
    const fileContents = ts.sys.readFile(fileName)!;
    return ts.createSourceFile(fileName, fileContents, ts.ScriptTarget.Latest, true);
}

// Function to visit nodes in the AST recursively
function visit(node: ts.Node) {
    // Check if the node is a type alias declaration
    if (ts.isTypeAliasDeclaration(node)) {
        console.log("Type Alias Name:", node.name.text);

        // Optionally, we can inspect the type alias declaration in detail
        console.log("Type:", node.type.getText());
    }

    // Continue traversing the AST
    ts.forEachChild(node, visit);
}

// Main function to parse and analyze a TypeScript file
function analyzeTypeScriptFile(filePath: string) {
    const sourceFile = readTypeScriptFile(filePath);

    // Start AST traversal from the root node
    visit(sourceFile);
}

// Example usage with a specified path to a TypeScript file
analyzeTypeScriptFile("C:myCode\\01-ideation-app\\00_modules\\relational_programming\\srcAbstractSyntaxRelationExpression\\types.ts");
