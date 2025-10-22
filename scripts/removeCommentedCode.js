#!/usr/bin/env node
// scripts/removeCommentedCode.js - Remove large commented code blocks

const fs = require('fs');
const path = require('path');

const FILES_TO_CLEAN = [
  'app/auth/login.tsx',
  'app/auth/register.tsx',
  'app/auth/phone.tsx',
  'app/auth/forgot-password.tsx',
  'app/auth/reset-password.tsx',
  'app/(tabs)/index.tsx',
];

const BACKUP_DIR = 'backup-before-cleanup';

console.log('🧹 Starting commented code removal...\n');

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
}

const removeCommentedBlocks = (content) => {
  const lines = content.split('\n');
  const cleanedLines = [];
  let inCommentBlock = false;
  let consecutiveComments = 0;
  let commentBuffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect multi-line comment start
    if (trimmed.startsWith('/*')) {
      inCommentBlock = true;
      continue;
    }

    // Detect multi-line comment end
    if (trimmed.endsWith('*/') || trimmed.includes('*/')) {
      inCommentBlock = false;
      continue;
    }

    // Skip lines in multi-line comment
    if (inCommentBlock) {
      continue;
    }

    // Detect single-line comments
    if (trimmed.startsWith('//')) {
      consecutiveComments++;
      commentBuffer.push(line);

      // If we have more than 5 consecutive comment lines, likely a commented block
      if (consecutiveComments > 5) {
        // Check if it's actual commented code vs documentation
        const isCode = commentBuffer.some(commentLine => {
          const content = commentLine.replace(/^\/\/\s*/, '');
          return (
            content.includes('const ') ||
            content.includes('function ') ||
            content.includes('return ') ||
            content.includes('interface ') ||
            content.includes('export ') ||
            content.includes('{') ||
            content.includes('}') ||
            content.includes('import ')
          );
        });

        if (isCode) {
          // Skip this commented block
          commentBuffer = [];
          consecutiveComments = 0;
          continue;
        }
      }
      continue;
    } else {
      // Not a comment - flush comment buffer if it's short
      if (consecutiveComments > 0 && consecutiveComments <= 5) {
        cleanedLines.push(...commentBuffer);
      }
      consecutiveComments = 0;
      commentBuffer = [];
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
};

const cleanFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${filePath} (not found)`);
      return;
    }

    // Read original content
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalLines = originalContent.split('\n').length;

    // Backup original file
    const backupPath = path.join(BACKUP_DIR, path.basename(filePath));
    fs.writeFileSync(backupPath, originalContent);

    // Clean content
    const cleanedContent = removeCommentedBlocks(originalContent);
    const cleanedLines = cleanedContent.split('\n').length;

    // Write cleaned content
    fs.writeFileSync(filePath, cleanedContent);

    const removed = originalLines - cleanedLines;
    if (removed > 0) {
      console.log(`✅ ${filePath}`);
      console.log(`   Removed ${removed} lines of commented code`);
      console.log(`   ${originalLines} → ${cleanedLines} lines\n`);
    } else {
      console.log(`✓  ${filePath} (no large commented blocks found)\n`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
};

// Clean specified files
console.log('📝 Cleaning files...\n');
FILES_TO_CLEAN.forEach(cleanFile);

console.log('✅ Cleanup complete!');
console.log(`📦 Original files backed up in: ${BACKUP_DIR}`);
console.log('\n💡 NEXT STEPS:');
console.log('1. Review the changes in each file');
console.log('2. Test your app to ensure nothing broke');
console.log('3. If everything works, delete the backup directory');
console.log('4. Commit the cleaned files to git\n');

// ✅ Additional cleanup suggestions
console.log('📋 ADDITIONAL CLEANUP SUGGESTIONS:');
console.log('- Remove console.log statements (replace with DEBUG flag)');
console.log('- Delete unused imports');
console.log('- Remove scripts/reset-project.js');
console.log('- Consider running: npx react-native-clean-project\n');