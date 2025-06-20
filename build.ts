#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Build script for Google Apps Script
 * Compiles TypeScript files and prepares for Clasp deployment
 */

import { walk } from 'https://deno.land/std@0.208.0/fs/walk.ts';
import { ensureDir } from 'https://deno.land/std@0.208.0/fs/ensure_dir.ts';

const SRC_DIR = './src';
const DIST_DIR = './dist';

async function build() {
  console.log('🚀 Starting build process...');

  try {
    // Clean dist directory
    try {
      await Deno.remove(DIST_DIR, { recursive: true });
    } catch {
      // Directory doesn't exist, that's fine
    }

    // Create dist directory
    await ensureDir(DIST_DIR);

    // Copy and compile TypeScript files
    for await (const entry of walk(SRC_DIR, {
      exts: ['.ts'],
      includeDirs: false,
    })) {
      const relativePath = entry.path.replace(SRC_DIR, '');
      const outputPath = `${DIST_DIR}${relativePath.replace('.ts', '.js')}`;

      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      await ensureDir(outputDir);

      // Compile TypeScript to JavaScript
      const result = await Deno.emit(entry.path, {
        compilerOptions: {
          target: 'ES2020',
          lib: ['ES2020'],
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          noImplicitThis: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          exactOptionalPropertyTypes: true,
          noImplicitOverride: true,
          noPropertyAccessFromIndexSignature: true,
          noUncheckedIndexedAccess: true,
        },
      });

      // Write compiled JavaScript
      await Deno.writeTextFile(outputPath, result.files['deno://bundle.js'] || '');
      console.log(`✅ Compiled: ${entry.path} -> ${outputPath}`);
    }

    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await build();
}
