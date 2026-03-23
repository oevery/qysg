/**
 * 测试辅助：模拟书源运行时的全局对象（flutterBridge、http、cache、cookie、resolveUrl）
 *
 * 在测试文件中 import 即可注入全局 mock，使书源代码可在 Node/happy-dom 中运行。
 */

import type { TestSeeds } from '../utils/define'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, vi } from 'vitest'

/** 创建一个所有方法都返回空值的 flutterBridge mock */
export function createFlutterBridgeMock() {
  return {
    isReady: true,
    text: vi.fn().mockResolvedValue(true),
    log: vi.fn().mockResolvedValue(true),
    showToast: vi.fn().mockResolvedValue(true),
    getBuildNumber: vi.fn().mockResolvedValue(0),
    getVersion: vi.fn().mockResolvedValue('0.0.0'),
    getDeviceId: vi.fn().mockResolvedValue(''),
    getDevice: vi.fn().mockResolvedValue(''),
    getWebViewUA: vi.fn().mockResolvedValue(''),
    toTraditional: vi.fn(async (s: string) => s),
    toSimplified: vi.fn(async (s: string) => s),
    utf8ToGbkUrlEncoded: vi.fn(async (s: string) => encodeURIComponent(s)),
    base64Encode: vi.fn(async (s: string) => btoa(s)),
    base64Decode: vi.fn(async (s: string) => atob(s)),
    openUrl: vi.fn().mockResolvedValue(true),
    openUrlWithMimeType: vi.fn().mockResolvedValue(true),
    startBrowser: vi.fn().mockResolvedValue(''),
    startBrowserWithShouldOverrideUrlLoading: vi.fn().mockResolvedValue(''),
    startBrowserDp: vi.fn().mockResolvedValue(''),
    back: vi.fn().mockResolvedValue(false),
    webview: vi.fn().mockResolvedValue(''),
    webViewGetOverrideUrl: vi.fn().mockResolvedValue(''),
    webViewGetSource: vi.fn().mockResolvedValue(''),
    getVerificationCode: vi.fn().mockResolvedValue(''),
    addbook: vi.fn().mockResolvedValue(''),
    CookieJar: vi.fn().mockResolvedValue(undefined),
    init: vi.fn(),
  }
}

/** 创建 http mock，默认所有请求返回空 data */
export function createHttpMock() {
  return {
    get: vi.fn().mockResolvedValue({ data: '', statusCode: 200, headers: {}, method: 'get', body: '', statusMessage: 'OK' }),
    post: vi.fn().mockResolvedValue({ data: '', statusCode: 200, headers: {}, method: 'post', body: '', statusMessage: 'OK' }),
    head: vi.fn().mockResolvedValue({ data: '', statusCode: 200, headers: {}, method: 'head', body: '', statusMessage: 'OK' }),
  }
}

/** 创建 cache mock */
export function createCacheMock() {
  const store = new Map<string, string>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    set: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
      return value
    }),
    remove: vi.fn(async (key: string) => {
      store.delete(key)
      return null
    }),
    getLoginInfo: vi.fn(async () => store.get('LoginInfo') ?? null),
    putLoginInfo: vi.fn(async (info: string) => {
      store.set('LoginInfo', info)
      return info
    }),
    getbookVariable: vi.fn(async (bookUrl: string) => store.get(bookUrl) ?? null),
    setbookVariable: vi.fn(async (bookUrl: string, value: string) => {
      store.set(bookUrl, value)
      return value
    }),
    _store: store,
  }
}

/** 创建 cookie mock */
export function createCookieMock() {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(null),
    remove: vi.fn().mockResolvedValue(null),
    setCookie: vi.fn().mockResolvedValue(null),
    getCookie: vi.fn().mockResolvedValue(null),
  }
}

/** resolveUrl 的真实实现（与 bridge.ts 一致） */
function resolveUrlImpl(base: string, relative: string): string {
  try {
    if (!base || !relative)
      return ''
    return new URL(relative, base).href
  }
  catch {
    return relative
  }
}

/** 将所有 mock 注入到 globalThis，使书源代码可直接运行 */
export function setupGlobalMocks() {
  const mocks = {
    flutterBridge: createFlutterBridgeMock(),
    http: createHttpMock(),
    cache: createCacheMock(),
    cookie: createCookieMock(),
    resolveUrl: resolveUrlImpl,
  }

  Object.assign(globalThis, mocks)

  return mocks
}

// ─── HTTP Mock 简写 ──────────────────────────────────────────

/** 创建标准 HTTP 响应对象 */
function mockResponse(data: string, method = 'get') {
  return { data, statusCode: 200, headers: {}, method, body: '', statusMessage: 'OK' }
}

/**
 * 设置 http.get mock 返回值
 *
 * 传入多个 HTML 时会依次使用 `mockResolvedValueOnce`（适合分页场景）
 */
export function mockHttpGet(mocks: ReturnType<typeof setupGlobalMocks>, ...responses: string[]) {
  if (responses.length === 1) {
    mocks.http.get.mockResolvedValue(mockResponse(responses[0]))
  }
  else {
    for (const data of responses) {
      mocks.http.get.mockResolvedValueOnce(mockResponse(data))
    }
  }
}

/** 设置 http.post mock 返回值 */
export function mockHttpPost(mocks: ReturnType<typeof setupGlobalMocks>, data: string) {
  mocks.http.post.mockResolvedValue(mockResponse(data, 'post'))
}

// ─── 断言辅助 ──────────────────────────────────────────────

/**
 * 验证 Book[] JSON 结构并返回解析后的数组
 *
 * 自动检查：数组类型、最少数量、每项必须有 bookUrl 和 name
 */
export function expectValidBooks(jsonStr: string, minCount = 1) {
  const books = JSON.parse(jsonStr)
  expect(Array.isArray(books)).toBe(true)
  expect(books.length).toBeGreaterThanOrEqual(minCount)
  for (const book of books) {
    expect(book.bookUrl).toBeTruthy()
    expect(book.name).toBeTruthy()
    expect(typeof book.author).toBe('string')
  }
  return books as Array<Record<string, any>>
}

/**
 * 验证 Chapter[] JSON 结构并返回解析后的数组
 *
 * 自动检查：数组类型、最少数量、每项必须有 name/chapterId、index 连续递增
 */
export function expectValidChapters(jsonStr: string, minCount = 1) {
  const chapters = JSON.parse(jsonStr)
  expect(Array.isArray(chapters)).toBe(true)
  expect(chapters.length).toBeGreaterThanOrEqual(minCount)
  for (let i = 0; i < chapters.length; i++) {
    expect(chapters[i].name).toBeTruthy()
    expect(chapters[i].chapterId).toBeTruthy()
    expect(chapters[i].index).toBe(i)
  }
  return chapters as Array<Record<string, any>>
}

/**
 * 验证 Find[] JSON 结构并返回解析后的数组
 *
 * 自动检查：数组非空、每项必须有 title、带 url 的项必须有 type
 */
export function expectValidFinds(jsonStr: string) {
  const finds = JSON.parse(jsonStr)
  expect(Array.isArray(finds)).toBe(true)
  expect(finds.length).toBeGreaterThan(0)
  for (const find of finds) {
    expect(find.title).toBeTruthy()
    if (find.url) {
      expect(find.type).toBe(0)
    }
  }
  return finds as Array<Record<string, any>>
}

// ─── Fixture 加载 ──────────────────────────────────────────

const __fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures')

/**
 * 检查指定 fixture 文件是否存在
 *
 * @param sourceId - 书源 ID（如 `"alicesw"`）
 * @param name - fixture 名称（不含扩展名）
 */
export function hasFixture(sourceId: string, name: string): boolean {
  return existsSync(join(__fixtures, sourceId, `${name}.html`))
}

/**
 * 从 `tests/fixtures/` 加载录制的 HTML fixture
 *
 * @param sourceId - 书源 ID（如 `"alicesw"`）
 * @param name - fixture 名称（不含扩展名，如 `"search"` → `search.html`）
 */
export function loadFixture(sourceId: string, name: string): string {
  return readFileSync(join(__fixtures, sourceId, `${name}.html`), 'utf-8')
}

/**
 * 检查某个测试方法是否应跳过，返回跳过原因（空字符串表示不跳过）
 *
 * 依次检查：testSeeds 是否存在 → testSeeds[name] 是否配置 → fixture 文件是否录制
 */
export function getSkipReason(seeds: TestSeeds | undefined, id: string, name: string): string {
  if (!seeds)
    return 'testSeeds 未配置'
  if (!seeds[name as keyof TestSeeds])
    return `testSeeds.${name} 未配置`
  if (!hasFixture(id, name))
    return `fixture ${name}.html 未录制`
  return ''
}
