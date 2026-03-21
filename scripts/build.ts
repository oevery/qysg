/**
 * 轻悦时光书源构建脚本
 *
 * 构建流程:
 *   1. 编译 `utils/bridge.ts` → 运行时桥接代码
 *   2. 遍历 `sources/*.ts`，对每个书源文件:
 *      a. 直接 import 源文件，从 `defineSource()` 返回值获取元数据
 *      b. 用 esbuild 打包为单文件 IIFE 并剥离外壳，得到浏览器端代码
 *      c. 用 ejs 渲染 HTML 模板，注入桥接代码 + 书源代码
 *   3. 生成 JSON 索引文件（单个 + 汇总）
 *
 * 用法: pnpm build（即 tsx scripts/build.ts）
 */

import type { ResolvedMeta } from '../qysg.config'
import type { SourceConfig } from '../utils/define'
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defu } from 'defu'
import ejs from 'ejs'
import * as esbuild from 'esbuild'
import { BASE_URL, META_DEFAULTS, TIMEZONE } from '../qysg.config'

// ─── 路径常量 ────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
const SOURCES_DIR = join(ROOT, 'sources')
const TEMPLATES_DIR = join(ROOT, 'templates')
const UTILS_DIR = join(ROOT, 'utils')
const DIST_DIR = join(ROOT, 'dist')

// ─── IIFE 剥离正则（模块级，避免重复编译） ────────────────────

const RE_USE_STRICT = /^\s*"use strict";\s*/m
const RE_IIFE_HEAD = /^\(\(\) => \{\n?/
const RE_IIFE_TAIL = /\n?\}\)\(\);\s*$/
const RE_EMPTY_EXPORT = /^export\s*\{\s*\};?\s*$/gm

// ─── esbuild 打包 ───────────────────────────────────────────

/**
 * 使用 esbuild 将 TypeScript 文件打包为单文件，并剥离 IIFE 外壳。
 *
 * 输出格式为 IIFE，但会去除 `(() => { ... })();` 包装，
 * 得到可直接嵌入 `<script>` 标签的纯 JS 代码。
 */
async function bundleFile(entryFile: string): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: 'iife',
    write: false,
    target: 'es2017',
    charset: 'utf8',
    treeShaking: false,
  })
  return result.outputFiles[0].text
    .replace(RE_USE_STRICT, '') // 移除 "use strict"
    .replace(RE_IIFE_HEAD, '') // 移除 IIFE 开头
    .replace(RE_IIFE_TAIL, '') // 移除 IIFE 结尾
    .replace(RE_EMPTY_EXPORT, '') // 移除空 export
    .trim()
}

/** 编译桥接代码（`utils/bridge.ts` → 纯 JS） */
async function buildBridge(): Promise<string> {
  return bundleFile(join(UTILS_DIR, 'bridge.ts'))
}

// ─── 元数据提取 ─────────────────────────────────────────────

/**
 * 直接 import 书源文件，从 `defineSource()` 的返回值中提取元数据。
 *
 * 因为 `defineSource()` 在 Node 环境下会跳过 window 注册并返回完整配置，
 * 所以可以安全地在构建时 import 并读取元数据字段。
 *
 * @param sourceFile - 源文件绝对路径（如 `sources/alicesw.ts`）
 * @returns 填充默认值后的完整元数据
 */
async function importMeta(sourceFile: string): Promise<ResolvedMeta> {
  const mod = await import(pathToFileURL(sourceFile).href)
  const config: SourceConfig = mod.default
  if (!config?.id)
    throw new Error(`无法从 ${sourceFile} 提取书源元数据，请确保 export default defineSource()`)

  return defu<ResolvedMeta, [ResolvedMeta]>(
    {
      name: config.name,
      id: config.id,
      url: config.url,
      jquery: config.jquery,
      cookieJar: config.cookieJar,
      group: config.group || undefined,
      scripts: config.scripts,
    } as any,
    META_DEFAULTS,
  )
}

// ─── 单个书源构建 ───────────────────────────────────────────

/**
 * 压缩 JavaScript 代码（桥接代码 + 书源代码）
 * @param code - 待压缩的 JavaScript 代码字符串
 * @returns 压缩后的代码字符串
 */
async function minifyJS(code: string): Promise<string> {
  const result = await esbuild.transform(code, {
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: false,
    target: 'es2017',
    charset: 'utf8',
  })
  return result.code
}

/**
 * 构建单个书源：import 元数据 → 打包 → 渲染 HTML → 写入 dist/
 *
 * @param sourceFile - 源文件绝对路径（如 `sources/alicesw.ts`）
 * @param bridgeCode - 已编译的桥接代码（含 `__COOKIE_JAR__` 占位符）
 * @param htmlTemplate - HTML ejs 模板字符串
 * @returns 解析后的书源元数据
 */
async function buildSource(
  sourceFile: string,
  bridgeCode: string,
  htmlTemplate: string,
): Promise<ResolvedMeta> {
  const [meta, sourceCode] = await Promise.all([
    importMeta(sourceFile),
    bundleFile(sourceFile),
  ])

  // 根据书源配置替换桥接代码中的 CookieJar 占位符
  const finalBridge = bridgeCode.replace('__COOKIE_JAR__', String(meta.cookieJar))

  // 压缩内联 JS
  const [minBridge, minSource] = await Promise.all([
    minifyJS(finalBridge),
    minifyJS(sourceCode),
  ])

  const buildTime = `${new Date().toLocaleString('zh-CN', { timeZone: TIMEZONE })} (${TIMEZONE})`
  const html = ejs.render(htmlTemplate, { meta, bridgeCode: minBridge, sourceCode: minSource, buildTime, pkg })

  const htmlDir = join(DIST_DIR, 'html')
  mkdirSync(htmlDir, { recursive: true })
  writeFileSync(join(htmlDir, `${meta.id}.html`), html)

  return meta
}

// ─── 主流程 ─────────────────────────────────────────────────

async function main(): Promise<void> {
  rmSync(DIST_DIR, { recursive: true, force: true })

  // 读取模板 & 编译桥接代码
  const htmlTemplate = readFileSync(join(TEMPLATES_DIR, 'html.ejs'), 'utf-8')
  const jsonTemplate = readFileSync(join(TEMPLATES_DIR, 'json.ejs'), 'utf-8')
  const bridgeCode = await buildBridge()

  // 发现所有书源文件
  const entries = readdirSync(SOURCES_DIR).filter(f => f.endsWith('.ts'))
  if (entries.length === 0) {
    console.warn('⚠ 未找到书源文件 (sources/*.ts)')
    return
  }

  // 并行构建所有书源
  const results = await Promise.allSettled(
    entries.map(file => buildSource(join(SOURCES_DIR, file), bridgeCode, htmlTemplate)),
  )

  const metas: ResolvedMeta[] = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result.status === 'fulfilled') {
      metas.push(result.value)
      console.log(`✓ ${result.value.name} (${result.value.id})`)
    }
    else {
      console.error(`✗ ${entries[i]}:`, result.reason)
    }
  }

  // 生成 JSON 索引
  const jsonDir = join(DIST_DIR, 'json')
  mkdirSync(jsonDir, { recursive: true })

  for (const meta of metas) {
    const json = ejs.render(jsonTemplate, { sources: [meta], baseUrl: BASE_URL })
    writeFileSync(join(jsonDir, `${meta.id}.json`), json)
  }

  const allJson = ejs.render(jsonTemplate, { sources: metas, baseUrl: BASE_URL })
  writeFileSync(join(jsonDir, 'all.json'), allJson)

  console.log(`\nDone! ${metas.length} source(s) → dist/`)
}

main()
