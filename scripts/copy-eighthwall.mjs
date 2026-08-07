import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', '@8thwall', 'engine-binary', 'dist')
const dest = join(root, 'public', 'external', 'xr')

if (!existsSync(source)) {
  console.error(
    '[copy-eighthwall] @8thwall/engine-binary not installed. Run `npm install` first.',
  )
  process.exit(1)
}

mkdirSync(dest, { recursive: true })
cpSync(source, dest, { recursive: true })
console.log('[copy-eighthwall] 8th Wall engine binary copied to public/external/xr')
