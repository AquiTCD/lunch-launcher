#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Clean script for removing build artifacts
 */

const DIST_DIR = './dist';

async function clean() {
  console.log('🧹 Starting cleanup...');

  try {
    await Deno.remove(DIST_DIR, { recursive: true });
    console.log('✅ Cleanup completed successfully!');
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.log('ℹ️  No dist directory found, nothing to clean.');
    } else {
      console.error('❌ Cleanup failed:', error);
      Deno.exit(1);
    }
  }
}

if (import.meta.main) {
  await clean();
}
