/**
 * 交互式新书源模板生成器
 *
 * 用法: pnpm new <id>
 * 示例: pnpm new mysite
 *
 * 生成 sources/<id>.ts 模板文件，包含标准结构和 TODO 注释。
 */

import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { createInterface } from 'node:readline/promises'

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function ask(question: string, defaultValue = ''): Promise<string> {
  const hint = defaultValue ? ` (${defaultValue})` : ''
  const answer = (await rl.question(`${question}${hint}: `)).trim()
  return answer || defaultValue
}

async function confirm(question: string, defaultValue = false): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N'
  const answer = (await rl.question(`${question} [${hint}]: `)).trim().toLowerCase()
  if (!answer)
    return defaultValue
  return answer === 'y' || answer === 'yes'
}

async function main() {
  const id = process.argv[2]
  if (!id) {
    console.error('用法: pnpm new <id>')
    console.error('示例: pnpm new mysite')
    process.exit(1)
  }

  if (!/^[a-z\d]+$/i.test(id)) {
    console.error(`错误: id "${id}" 只能包含字母和数字`)
    process.exit(1)
  }

  const targetPath = join(import.meta.dirname!, '..', 'sources', `${id}.ts`)
  if (existsSync(targetPath)) {
    console.error(`错误: sources/${id}.ts 已存在`)
    process.exit(1)
  }

  console.log(`\n创建新书源: ${id}\n`)

  const name = await ask('书源名称')
  const url = await ask('网站 URL（如 https://example.com）')
  const hasLogin = await confirm('需要登录功能？')
  const hasFind = await confirm('需要发现页？', true)
  const searchMethod = (await ask('搜索请求方式', 'GET')).toUpperCase() as 'GET' | 'POST'

  rl.close()

  const baseUrl = url.replace(/\/+$/, '')

  const template = generateTemplate({
    id,
    name,
    baseUrl,
    hasLogin,
    hasFind,
    searchMethod,
  })

  writeFileSync(targetPath, template, 'utf-8')
  console.log(`\n✓ 已生成 sources/${id}.ts`)
  console.log('  请搜索 TODO 完成各方法的实现')
}

interface TemplateOptions {
  id: string
  name: string
  baseUrl: string
  hasLogin: boolean
  hasFind: boolean
  searchMethod: 'GET' | 'POST'
}

export function generateTemplate(opts: TemplateOptions): string {
  const { id, name, baseUrl, hasLogin, hasFind, searchMethod } = opts

  // ─── imports ──────────────────────────────────────────────
  const typeImports = ['Book']
  if (hasFind)
    typeImports.push('Find')
  const helperImports = ['fetchPage', 'parseChapters', 'replacePlaceholders', 'resolveUrl']

  const lines: string[] = []

  lines.push(`import type { ${typeImports.join(', ')} } from '../utils/define'`)
  lines.push(`import { defineSource } from '../utils/define'`)
  lines.push(`import { ${helperImports.join(', ')} } from '../utils/helpers'`)
  lines.push(`import { extractContent } from '../utils/html'`)
  lines.push(``)
  lines.push(`const baseUrl = '${baseUrl}'`)
  lines.push(``)

  // ─── defineSource ─────────────────────────────────────────
  lines.push(`export default defineSource({`)
  lines.push(`  name: '${name}',`)
  lines.push(`  id: '${id}',`)
  lines.push(`  url: baseUrl,`)
  if (hasLogin)
    lines.push(`  enabledLogin: true,`)
  lines.push(``)

  // ─── testSeeds ────────────────────────────────────────────
  lines.push(`  testSeeds: {`)
  if (searchMethod === 'POST') {
    lines.push(`    search: {`)
    lines.push(`      url: \`\${baseUrl}/search\`, // TODO: 搜索 URL`)
    lines.push(`      method: 'post',`)
    lines.push(`      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },`)
    lines.push(`      body: 'keyword={{key}}', // TODO: 搜索请求体`)
    lines.push(`    },`)
  }
  else {
    lines.push(`    search: { url: \`\${baseUrl}/search?q={{key}}&page={{page}}\` }, // TODO: 搜索 URL`)
  }
  lines.push(`    info: \`\${baseUrl}/book/1/\`, // TODO: 测试书籍 URL`)
  lines.push(`    chapter: \`\${baseUrl}/book/1/\`, // TODO: 测试目录 URL`)
  lines.push(`    content: \`\${baseUrl}/book/1/1.html\`, // TODO: 测试章节 URL`)
  if (hasFind)
    lines.push(`    find: \`\${baseUrl}/list/{{page}}/\`, // TODO: 测试发现页 URL`)
  lines.push(`  },`)
  lines.push(``)

  // ─── search ───────────────────────────────────────────────
  lines.push(`  async search(key, page) {`)
  lines.push(`    if (page > 1)`)
  lines.push(`      return '[]'`)
  lines.push(`    try {`)
  lines.push(`      const books: Book[] = []`)
  if (searchMethod === 'POST') {
    lines.push(`      // TODO: 根据实际接口调整搜索逻辑`)
    lines.push(`      const searchUrl = resolveUrl(baseUrl, '/search')`)
    lines.push(`      const body = \`keyword=\${key}\``)
    lines.push(`      const res = await http.post(searchUrl, {`)
    lines.push(`        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },`)
    lines.push(`        body,`)
    lines.push(`      })`)
    lines.push(`      const $ = parsePage(res.data, 0)`)
  }
  else {
    lines.push(`      // TODO: 根据实际接口调整搜索 URL`)
    lines.push(`      const searchUrl = resolveUrl(baseUrl, \`/search?q=\${key}&page=\${page}\`)`)
    lines.push(`      const $ = await fetchPage(searchUrl, 0)`)
  }
  lines.push(`      // TODO: 根据搜索结果页面结构解析书籍列表`)
  lines.push(`      return JSON.stringify(books)`)
  lines.push(`    }`)
  lines.push(`    catch (e) {`)
  lines.push(`      flutterBridge.log(\`搜索错误: \${e.message}\`)`)
  lines.push(`      return '[]'`)
  lines.push(`    }`)
  lines.push(`  },`)
  lines.push(``)

  // ─── info ─────────────────────────────────────────────────
  lines.push(`  async info(bookUrl) {`)
  lines.push(`    try {`)
  lines.push(`      const $ = await fetchPage(bookUrl, 1)`)
  lines.push(`      // TODO: 根据实际页面结构填写选择器`)
  lines.push(`      const book: Book = {`)
  lines.push(`        bookUrl,`)
  lines.push(`        name: $.find('.book-name').text(),`)
  lines.push(`        author: $.find('.book-author').text(),`)
  lines.push(`        kind: $.find('.book-kind').text(),`)
  lines.push(`        coverUrl: resolveUrl(baseUrl, $.find('.book-cover img').attr('src')),`)
  lines.push(`        intro: $.find('.book-intro').text(),`)
  lines.push(`        tocUrl: bookUrl, // TODO: 如果目录页和详情页不同，需要修改`)
  lines.push(`        wordCount: '',`)
  lines.push(`        type: '0',`)
  lines.push(`        latestChapterTitle: $.find('.latest-chapter').text(),`)
  lines.push(`      }`)
  lines.push(`      return JSON.stringify(book)`)
  lines.push(`    }`)
  lines.push(`    catch (e) {`)
  lines.push(`      flutterBridge.log(\`获取书籍信息错误: \${e.message}\`)`)
  lines.push(`      return '{}'`)
  lines.push(`    }`)
  lines.push(`  },`)
  lines.push(``)

  // ─── chapter ──────────────────────────────────────────────
  lines.push(`  async chapter(tocUrl) {`)
  lines.push(`    try {`)
  lines.push(`      const $ = await fetchPage(tocUrl, 2)`)
  lines.push(`      // TODO: 章节列表选择器`)
  lines.push(`      const $links = $.findAll('.chapter-list a')`)
  lines.push(`      const chapters = parseChapters(baseUrl, $links)`)
  lines.push(`      return JSON.stringify(chapters)`)
  lines.push(`    }`)
  lines.push(`    catch (e) {`)
  lines.push(`      flutterBridge.log(\`获取章节目录错误: \${e.message}\`)`)
  lines.push(`      return '[]'`)
  lines.push(`    }`)
  lines.push(`  },`)
  lines.push(``)

  // ─── content ──────────────────────────────────────────────
  lines.push(`  async content(url) {`)
  lines.push(`    try {`)
  lines.push(`      const $ = await fetchPage(url, 3)`)
  lines.push('      const content = extractContent($.find(\'.content\'), { sanitize: true })')
  lines.push(`      return content`)
  lines.push(`    }`)
  lines.push(`    catch (e) {`)
  lines.push(`      flutterBridge.log(\`获取章节内容错误: \${e.message}\`)`)
  lines.push(`      return ''`)
  lines.push(`    }`)
  lines.push(`  },`)

  // ─── getfinds + find ──────────────────────────────────────
  if (hasFind) {
    lines.push(``)
    lines.push(`  async getfinds() {`)
    lines.push(`    // TODO: 根据网站分类配置发现页`)
    lines.push(`    const finds: Find[] = [`)
    lines.push(`      { title: '分类', url: '' },`)
    lines.push(`      { title: '分类一', url: \`\${baseUrl}/list/1/{{page}}/\`, type: 0 },`)
    lines.push(`      { title: '分类二', url: \`\${baseUrl}/list/2/{{page}}/\`, type: 0 },`)
    lines.push(`    ]`)
    lines.push(`    return JSON.stringify(finds)`)
    lines.push(`  },`)
    lines.push(``)
    lines.push(`  async find(url, page) {`)
    lines.push(`    try {`)
    lines.push(`      const books: Book[] = []`)
    lines.push(`      const finalUrl = replacePlaceholders(url, { page })`)
    lines.push(`      const $ = await fetchPage(finalUrl)`)
    lines.push(`      // TODO: 根据发现页页面结构解析书籍列表`)
    lines.push(`      return JSON.stringify(books)`)
    lines.push(`    }`)
    lines.push(`    catch (e) {`)
    lines.push(`      flutterBridge.log(\`获取发现页错误: \${e.message}\`)`)
    lines.push(`      return '[]'`)
    lines.push(`    }`)
    lines.push(`  },`)
  }

  // ─── login ────────────────────────────────────────────────
  if (hasLogin) {
    lines.push(``)
    lines.push(`  async getloginurl() {`)
    lines.push(`    // TODO: 返回登录页 URL 或 Login[] 配置`)
    lines.push(`    return resolveUrl(baseUrl, '/login')`)
    lines.push(`  },`)
    lines.push(``)
    lines.push(`  async login() {`)
    lines.push(`    // TODO: 实现登录状态检测`)
    lines.push(`    const cookieStr = await cookie.get(baseUrl)`)
    lines.push(`    return !!cookieStr`)
    lines.push(`  },`)
  }

  lines.push(`})`)
  lines.push(``)

  // ─── POST search 需要额外导入 parsePage ────────────────────
  if (searchMethod === 'POST') {
    // 将 parsePage 加入 helpers imports
    const importLine = lines[2]
    if (!importLine.includes('parsePage')) {
      lines[2] = importLine.replace(
        'fetchPage, parseChapters',
        'fetchPage, parseChapters, parsePage',
      )
    }
  }

  return lines.join('\n')
}

// 直接执行时运行 main（通过 tsx scripts/new.ts 调用）
const isDirectRun = process.argv[1]?.endsWith('new.ts')
if (isDirectRun) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
