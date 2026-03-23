/**
 * Fixture 录制工具
 *
 * 使用方式：
 *   pnpm record              # 录制所有配置了 testSeeds 的书源
 *   pnpm record alicesw      # 仅录制指定书源
 *
 * 直接发送 HTTP 请求并保存响应到 `tests/fixtures/<id>/` 目录，
 * 不运行书源中的 search/info/chapter 等方法。
 * 测试文件可通过 `loadFixture()` 加载这些 HTML 作为 mock 数据。
 */

import type { SourceConfig } from '../utils/define'
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { DEFAULT_UA } from '../qysg.config'
import { replacePlaceholders } from '../utils/helpers'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SOURCES_DIR = join(ROOT, 'sources')
const FIXTURES_DIR = join(ROOT, 'tests', 'fixtures')

const DEFAULT_SEARCH_KEY = '我的'

// ─── HTTP Fetch ────────────────────────────────────────────

/** 从 Content-Type header 或 HTML <meta> 标签中检测字符编码 */
function detectCharset(headers: Headers, bytes: Uint8Array): string {
  // 1. 优先从 Content-Type header 获取
  const ct = headers.get('content-type') || ''
  const headerMatch = ct.match(/charset=([^\s;]+)/i)
  if (headerMatch)
    return headerMatch[1]

  // 2. 用 ASCII 预读 HTML 前 4KB 检测 <meta charset> 或 <meta http-equiv content-type>
  const head = new TextDecoder('ascii', { fatal: false }).decode(bytes.slice(0, 4096))
  const metaMatch = head.match(/<meta[^>]+charset=["']?([^"';\s>]+)/i)
  if (metaMatch)
    return metaMatch[1]

  return 'utf-8'
}

async function fetchHtml(url: string, options?: {
  method?: string
  headers?: Record<string, string>
  body?: string
}): Promise<string> {
  const method = (options?.method || 'GET').toUpperCase()
  console.log(`  ${method} ${url}`)
  const res = await fetch(url, {
    method,
    headers: { 'User-Agent': DEFAULT_UA, ...options?.headers },
    body: options?.body,
    redirect: 'follow',
  })
  const buffer = new Uint8Array(await res.arrayBuffer())
  const charset = detectCharset(res.headers, buffer)
  const html = new TextDecoder(charset, { fatal: false }).decode(buffer)
  console.log(`  ← ${res.status} (${buffer.length} bytes, charset=${charset})`)
  return html
}

// ─── Find 自动检测 ─────────────────────────────────────────

/** 从 getfinds() 返回值中查找第一个 URL 以 baseUrl 开头的项 */
async function autoDetectFind(config: SourceConfig): Promise<string | undefined> {
  if (!config.getfinds)
    return undefined
  try {
    const finds = JSON.parse(await config.getfinds())
    const match = finds.find((f: any) => f.url && f.url.startsWith(config.url))
    return match?.url
  }
  catch {
    console.log('  ⚠ 自动获取 find URL 失败')
  }
  return undefined
}

// ─── 录制逻辑 ──────────────────────────────────────────────

function saveFixture(fixtureDir: string, name: string, html: string) {
  writeFileSync(join(fixtureDir, `${name}.html`), html)
  console.log(`  ✓ ${name}`)
}

async function recordSource(id: string, config: SourceConfig) {
  const seeds = config.testSeeds!
  const fixtureDir = join(FIXTURES_DIR, id)
  mkdirSync(fixtureDir, { recursive: true })

  // search — 使用 testSeeds 中的请求配置直接发送 HTTP
  if (seeds.search) {
    const key = seeds.search.key ?? DEFAULT_SEARCH_KEY
    const page = seeds.search.page ?? 1
    const url = replacePlaceholders(seeds.search.url, { key: encodeURIComponent(key), page })
    const body = seeds.search.body ? replacePlaceholders(seeds.search.body, { key: encodeURIComponent(key), page }) : undefined

    console.log(`  ▶ search (key="${key}", page=${page})`)
    try {
      const html = await fetchHtml(url, { method: seeds.search.method, headers: seeds.search.headers, body })
      saveFixture(fixtureDir, 'search', html)
    }
    catch (e: any) {
      console.log(`  ⚠ search 失败: ${e.message}`)
    }
  }

  // info / chapter / content — 简单 GET 请求
  for (const name of ['info', 'chapter', 'content'] as const) {
    const url = seeds[name]
    if (!url)
      continue
    console.log(`  ▶ ${name}`)
    try {
      const html = await fetchHtml(url)
      saveFixture(fixtureDir, name, html)
    }
    catch (e: any) {
      console.log(`  ⚠ ${name} 失败: ${e.message}`)
    }
  }

  // find — 优先使用配置，否则自动从 getfinds() 检测
  let findUrl = seeds.find
  if (!findUrl)
    findUrl = await autoDetectFind(config)
  if (findUrl) {
    const url = replacePlaceholders(findUrl, { page: 1 })
    console.log(`  ▶ find${seeds.find ? '' : ' (自动检测)'}`)
    try {
      const html = await fetchHtml(url)
      saveFixture(fixtureDir, 'find', html)
    }
    catch (e: any) {
      console.log(`  ⚠ find 失败: ${e.message}`)
    }
  }
}

// ─── Main ──────────────────────────────────────────────────

async function main() {
  const targetId = process.argv[2]
  const files = readdirSync(SOURCES_DIR).filter(f => f.endsWith('.ts'))

  let recorded = 0
  for (const file of files) {
    const id = file.replace('.ts', '')
    if (targetId && id !== targetId)
      continue

    const mod = await import(pathToFileURL(join(SOURCES_DIR, file)).href)
    const config: SourceConfig = mod.default

    if (!config.testSeeds) {
      console.log(`⏭ ${id}: 无 testSeeds，跳过`)
      continue
    }

    console.log(`📹 ${config.name} (${id})`)
    await recordSource(id, config)
    recorded++
  }

  if (recorded === 0) {
    console.log('\n没有找到配置了 testSeeds 的书源')
  }
  else {
    console.log(`\n✅ 录制完成，共 ${recorded} 个书源`)
  }
}

main().catch(console.error)
