import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const root = resolve('dist')
const files = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? files(path) : [path]
  })
const html = readFileSync(join(root, 'index.html'), 'utf8')
const entry = html.match(/<script[^>]*src="([^"]+\.js)"/)[1]
const assetPath = (path) => join(root, 'assets', path.split('/').at(-1))
const seen = new Set()
function visit(path) {
  if (seen.has(path)) return
  seen.add(path)
  const text = readFileSync(path, 'utf8')
  for (const match of text.matchAll(
    /\b(?:import|export)\s*(?:[^"'();]*?\bfrom\s*)?["']([^"']+\.js)["']/g,
  )) {
    if (match[1].startsWith('.')) visit(resolve(dirname(path), match[1]))
  }
}
visit(assetPath(entry))
const measure = (paths) =>
  paths.reduce((sum, path) => sum + gzipSync(readFileSync(path), { level: 9 }).length, 0)
const entryPaths = [...seen]
const all = files(root)
const report = {
  entryGzipBytes: measure(entryPaths),
  entryChunks: entryPaths.map((path) => ({
    file: path.slice(root.length + 1),
    gzipBytes: gzipSync(readFileSync(path), { level: 9 }).length,
  })),
  deployedBytes: all.reduce((sum, path) => sum + statSync(path).size, 0),
  largestFileBytes: Math.max(...all.map((path) => statSync(path).size)),
  allJavaScriptGzipBytes: measure(all.filter((path) => path.endsWith('.js'))),
}
console.log(JSON.stringify(report, null, 2))
if (process.argv.includes('--baseline'))
  writeFileSync('docs/bundle-baseline.json', JSON.stringify(report, null, 2) + '\n')
if (process.argv.includes('--check')) {
  const baseline = JSON.parse(readFileSync('docs/bundle-baseline.json', 'utf8'))
  if (report.entryGzipBytes > baseline.entryGzipBytes + 10240)
    throw new Error('Initial JavaScript exceeds the baseline +10 KiB budget.')
  if (report.largestFileBytes > 50 * 1024 * 1024) throw new Error('An asset exceeds 50 MiB.')
  if (report.deployedBytes > 250 * 1024 * 1024) throw new Error('Deployed assets exceed 250 MiB.')
}
