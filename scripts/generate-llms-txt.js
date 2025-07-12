#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const LLMS_FILE = path.join(__dirname, '../llms.txt');
const AGENTS_FILE = path.join(__dirname, '../AGENTS.md');

function getAllMarkdownFiles(dir) {
  const files = fs.readdirSync(dir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(dir, file))
    .sort();
}

function generateLlmsTxt() {
  const markdownFiles = getAllMarkdownFiles(DOCS_DIR);
  
  let content = `# Privatefolio
  
Privatefolio is a monorepo investment portfolio manager built with Lerna, featuring a React frontend, Node.js/Bun backend, and Electron desktop app.

As an agent, follow these rules:
- Never run the \`start\` or \`dev\` scripts because these are long-lived processes that should be run in the background.
- To test that something works, run the \`test\` script or the \`build\` script.

Now, the project documentation, all concatenated below.

`;

  markdownFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    content += `## ${fileName}\n\n`;
    content += fileContent;
    content += `\n\n---\n\n`;
  });

  fs.writeFileSync(LLMS_FILE, content);
  fs.writeFileSync(AGENTS_FILE, content);
  console.log(`✅ Generated llms.txt and AGENTS.md with ${markdownFiles.length} markdown files`);
  console.log(`📄 Files included: ${markdownFiles.map(f => path.basename(f)).join(', ')}`);
  console.log(`📍 Output: ${LLMS_FILE}`);
}

try {
  generateLlmsTxt();
} catch (error) {
  console.error('❌ Error generating files:', error.message);
  process.exit(1);
} 
