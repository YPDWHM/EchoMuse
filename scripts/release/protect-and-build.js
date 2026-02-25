#!/usr/bin/env node
'use strict';

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '..', '..');
const backupRoot = path.join(projectRoot, '.tmp-release-protect');
const targets = [
  path.join(projectRoot, 'server.js'),
  path.join(projectRoot, 'mcp-manager.js'),
  path.join(projectRoot, 'desktop'),
  path.join(projectRoot, 'public'),
];
const skipPathParts = [
  path.sep + 'public' + path.sep + 'vendor' + path.sep,
  path.sep + 'node_modules' + path.sep,
  path.sep + '.git' + path.sep,
  path.sep + 'desktop-dist' + path.sep,
  path.sep + 'dist' + path.sep,
];
const skipNames = new Set(['sw.js']);
const skipExts = new Set(['.map']);

function isJsFile(filePath) {
  return filePath.toLowerCase().endsWith('.js') && !filePath.toLowerCase().endsWith('.min.js');
}

function shouldSkip(filePath) {
  const normalized = filePath;
  if (skipPathParts.some((part) => normalized.includes(part))) return true;
  const base = path.basename(filePath);
  if (skipNames.has(base)) return true;
  if (skipExts.has(path.extname(filePath))) return true;
  return false;
}

async function walk(dir, out) {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (shouldSkip(full)) continue;
    if (entry.isDirectory()) {
      await walk(full, out);
    } else if (entry.isFile() && isJsFile(full)) {
      out.push(full);
    }
  }
}

async function collectTargetFiles() {
  const files = [];
  for (const target of targets) {
    if (!fs.existsSync(target)) continue;
    const stat = await fsp.stat(target);
    if (stat.isDirectory()) {
      await walk(target, files);
    } else if (stat.isFile() && isJsFile(target) && !shouldSkip(target)) {
      files.push(target);
    }
  }
  files.sort();
  return files;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function copyForBackup(src, backupBase) {
  const rel = path.relative(projectRoot, src);
  const dst = path.join(backupBase, rel);
  await ensureDir(path.dirname(dst));
  await fsp.copyFile(src, dst);
}

async function restoreFromBackup(backupBase) {
  if (!fs.existsSync(backupBase)) return;
  async function restoreWalk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await restoreWalk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(backupBase, full);
        const dst = path.join(projectRoot, rel);
        await ensureDir(path.dirname(dst));
        await fsp.copyFile(full, dst);
      }
    }
  }
  await restoreWalk(backupBase);
}

async function removeDirSafe(dir) {
  if (fs.existsSync(dir)) {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

async function tryLoadTerser() {
  try {
    return require('terser');
  } catch (_) {
    return null;
  }
}

async function minifyFile(terser, filePath) {
  const code = await fsp.readFile(filePath, 'utf8');
  const result = await terser.minify(code, {
    compress: {
      passes: 2,
      dead_code: true,
      drop_debugger: true,
    },
    mangle: {
      toplevel: false,
      keep_classnames: true,
      keep_fnames: true,
    },
    format: {
      comments: false,
      ascii_only: true,
    },
    sourceMap: false,
  });
  if (!result || typeof result.code !== 'string' || !result.code.trim()) {
    throw new Error(`terser returned empty output for ${path.relative(projectRoot, filePath)}`);
  }
  await fsp.writeFile(filePath, result.code, 'utf8');
}

function runBuilder(args) {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      NODE_ENV: 'production',
    };
    let child;
    if (process.platform === 'win32') {
      const builderCmd = path.join(projectRoot, 'node_modules', '.bin', 'electron-builder.cmd');
      child = spawn(builderCmd, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true,
        env,
      });
    } else {
      const cmd = path.join(projectRoot, 'node_modules', '.bin', 'electron-builder');
      child = spawn(cmd, args, {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: false,
        env,
      });
    }
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`electron-builder exited with code ${code}`));
    });
  });
}

async function main() {
  const builderArgs = process.argv.slice(2);
  if (!builderArgs.length) builderArgs.push('--win');

  const files = await collectTargetFiles();
  console.log(`[protect-build] target JS files: ${files.length}`);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const backupDir = path.join(backupRoot, stamp);
  await ensureDir(backupDir);

  const terser = await tryLoadTerser();
  if (!terser) {
    console.warn('[protect-build] terser is not installed. Build will continue with asar/compression only.');
    console.warn('[protect-build] Run `npm install` to install devDependencies including terser for stronger release protection.');
  }

  try {
    for (const file of files) {
      await copyForBackup(file, backupDir);
    }
    if (terser) {
      for (const file of files) {
        await minifyFile(terser, file);
      }
      console.log('[protect-build] JS minification complete.');
    }
    await runBuilder(builderArgs);
  } finally {
    try {
      await restoreFromBackup(backupDir);
      await removeDirSafe(backupDir);
      const remaining = fs.existsSync(backupRoot) ? fs.readdirSync(backupRoot) : [];
      if (!remaining.length) await removeDirSafe(backupRoot);
      console.log('[protect-build] Sources restored.');
    } catch (restoreErr) {
      console.error('[protect-build] Failed to restore sources from backup:', restoreErr);
      process.exitCode = 1;
    }
  }
}

main().catch((err) => {
  console.error('[protect-build] Build failed:', err.message || err);
  process.exit(1);
});
