#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../llms-full.txt');

function getAllMarkdownFiles(dir) {
  const files = fs.readdirSync(dir);
  return files
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(dir, file))
    .sort();
}

function generateLlmsTxt() {
  const markdownFiles = getAllMarkdownFiles(DOCS_DIR);
  
  let content = `# Privatefolio Documentation\n\n`;
  content += `This file contains all documentation from the /docs directory.\n`;
  // content += `Generated on: ${new Date().toISOString()}\n\n`;
  content += `---\n\n`;

  markdownFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    content += `## ${fileName}\n\n`;
    content += fileContent;
    content += `\n\n---\n\n`;
  });

  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`✅ Generated llms-full.txt with ${markdownFiles.length} markdown files`);
  console.log(`📄 Files included: ${markdownFiles.map(f => path.basename(f)).join(', ')}`);
  console.log(`📍 Output: ${OUTPUT_FILE}`);
}

try {
  generateLlmsTxt();
} catch (error) {
  console.error('❌ Error generating llms-full.txt:', error.message);
  process.exit(1);
} 
