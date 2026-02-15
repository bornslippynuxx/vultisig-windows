import { execSync, spawn } from 'child_process'
import chokidar from 'chokidar'
import process from 'process'

const capitalizeFirstLetter = str =>
  str.charAt(0).toUpperCase() + str.slice(1)

const buildProcess = {
  app: null,
  background: null,
  content: null,
  inpage: null,
}

const debounceTimers = {
  app: null,
  background: null,
  content: null,
  inpage: null,
}

const DEBOUNCE_MS = 100

const killProcess = proc => {
  if (!proc) return
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(proc.pid), '/F', '/T'])
    } else {
      process.kill(-proc.pid, 'SIGTERM')
    }
  } catch {
    // Process may have already exited
  }
}

const buildChunk = chunk => {
  if (buildProcess[chunk]) {
    console.log(
      `\x1b[1m\x1b[33mTerminating previous ${capitalizeFirstLetter(chunk)} build...\x1b[0m`
    )
    killProcess(buildProcess[chunk])
    buildProcess[chunk] = null
  }

  const env = chunk === 'app' ? {} : { CHUNK: chunk }
  // Increase heap for large bundles (app, background, inpage); content is tiny
  if (chunk !== 'content') {
    env.NODE_OPTIONS = '--max-old-space-size=8192'
  }

  buildProcess[chunk] = spawn('npx', ['vite', 'build'], {
    env: { ...process.env, ...env },
    shell: true,
    stdio: 'pipe',
    detached: true,
  })

  buildProcess[chunk].stdout.on('data', data => process.stdout.write(data))
  buildProcess[chunk].stderr.on('data', data => process.stderr.write(data))
  buildProcess[chunk].on('close', code => {
    console.log(
      `\x1b[1m\x1b[32m${capitalizeFirstLetter(chunk)} build exited with code ${code}\x1b[0m`
    )
    buildProcess[chunk] = null
  })

  console.log(
    `\x1b[1m\x1b[34m${capitalizeFirstLetter(chunk)} build triggered!\x1b[0m`
  )
}

const debouncedBuild = chunk => {
  if (debounceTimers[chunk]) clearTimeout(debounceTimers[chunk])
  debounceTimers[chunk] = setTimeout(() => buildChunk(chunk), DEBOUNCE_MS)
}

// Initial build: typecheck once, then build all chunks in parallel
console.log('\x1b[1m\x1b[36mRunning initial typecheck...\x1b[0m')
try {
  execSync('npx tsc -b', { stdio: 'inherit' })
  console.log('\x1b[1m\x1b[32mTypecheck passed!\x1b[0m')
} catch {
  console.log(
    '\x1b[1m\x1b[31mTypecheck failed, continuing with builds...\x1b[0m'
  )
}

buildChunk('app')
buildChunk('background')
buildChunk('content')
buildChunk('inpage')

// Watch for changes — Vite-only rebuilds (no tsc)
chokidar
  .watch('src', {
    ignored: ['src/background', 'src/content', 'src/inpage'],
    ignoreInitial: true,
  })
  .on('change', () => debouncedBuild('app'))

chokidar
  .watch('src/background', { ignoreInitial: true })
  .on('change', () => debouncedBuild('background'))

chokidar
  .watch('src/content', { ignoreInitial: true })
  .on('change', () => debouncedBuild('content'))

chokidar
  .watch('src/inpage', { ignoreInitial: true })
  .on('change', () => debouncedBuild('inpage'))
