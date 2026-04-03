/**
 * 书源开发通用工具函数
 *
 * 提供页面请求解析、分页处理、章节解析等常用操作，
 * 减少各书源文件中的重复代码。
 */

import type { DebugType, HttpOptions } from './bridge'
import type { Chapter } from './define'
import { Q, q, sanitizeHtml } from './html'

/**
 * 将 HTML 字符串净化并解析为 Q 对象，可选发送调试数据到 App
 *
 * 适用于已通过 `http.post()` 等自定义方式获取到 HTML 的场景。
 *
 * @param data - HTML 字符串
 * @param debugType - 调试类型，传入则发送源码到 App
 */
export function parsePage(data: string, debugType?: DebugType): Q {
  if (debugType !== undefined)
    flutterBridge.text(debugType, data)
  return q(sanitizeHtml(data))
}

/** fetchPage 选项 */
export interface FetchPageOptions extends HttpOptions {
  /** 请求方法，默认 `'GET'` */
  method?: 'GET' | 'POST'
  /**
   * 调试类型，传入则发送源码到 App
   *
   * 0 搜索源码 / 1 详情源码 / 2 目录源码 / 3 正文源码
   */
  debugType?: DebugType
}

/**
 * 请求页面并解析为 Q 对象，支持 GET / POST
 *
 * @param url - 请求 URL
 * @param optsOrDebugType - 选项对象，或直接传入 debugType 数字（向后兼容）
 * 0 搜索源码 / 1 详情源码 / 2 目录源码 / 3 正文源码
 *
 * @example
 * ```ts
 * // GET（简写）
 * await fetchPage(url, 0)
 * // GET（对象）
 * await fetchPage(url, { debugType: 0 })
 * // POST
 * await fetchPage(url, { method: 'POST', body: 'key=val', debugType: 0 })
 * ```
 */
export async function fetchPage(url: string, optsOrDebugType?: FetchPageOptions | DebugType): Promise<Q> {
  const opts: FetchPageOptions = typeof optsOrDebugType === 'object' ? optsOrDebugType : { debugType: optsOrDebugType }
  const { method = 'GET', debugType, ...httpOpts } = opts
  const res = method === 'POST' ? await http.post(url, httpOpts) : await http.get(url, httpOpts)
  return parsePage(res.data, debugType)
}

/**
 * 替换模板中的 `{{name}}` 占位符（同时处理 URL 编码后的 `%7B%7Bname%7D%7D` 变体）
 *
 * @param template - 含占位符的字符串
 * @param vars - 键值对，值会被转为字符串后替换对应的 `{{key}}`
 *
 * @example
 * ```ts
 * replacePlaceholders('/search?q={{key}}&p={{page}}', { key: '测试', page: 1 })
 * // => '/search?q=测试&p=1'
 * ```
 */
export function replacePlaceholders(template: string, vars: Record<string, string | number>): string {
  let result = template
  for (const [name, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${name}\\}\\}|%7B%7B${name}%7D%7D`, 'g')
    result = result.replace(pattern, String(value))
  }
  return result
}

/**
 * 替换 URL 中的 `{{page}}` 分页占位符（同时处理 URL 编码后的变体）
 *
 * @param url - 含 `{{page}}` 占位符的 URL
 * @param page - 页码
 */
export function resolvePagination(url: string, page: number): string {
  return replacePlaceholders(url, { page })
}

/**
 * url 处理函数，将相对路径转为绝对路径并且编码
 * @param base - 基础 URL（如书源主页 URL）
 * @param relative - 需要处理的 URL（可能是相对路径）
 * @returns 处理后的绝对 URL
 */
export function resolveUrl(base: string, relative: string): string {
  try {
    if (!base || !relative)
      return ''
    return new URL(relative, base).href
  }
  catch {
    return relative
  }
}

/**
 * 从链接元素列表中提取章节目录
 *
 * 适用于常见的 `<a href="...">章节标题</a>` 列表结构。
 *
 * @param baseUrl - 书源基础 URL，用于解析相对路径
 * @param $items - 包含章节链接的 Q 对象数组
 * @param startIndex - 起始索引（用于分页拼接时的偏移）
 */
export function extractChapters(baseUrl: string, $items: Q[], startIndex = 0): Chapter[] {
  const chapters: Chapter[] = []
  $items.forEach(($item) => {
    const name = $item.text().trim()
    const chapterId = resolveUrl(baseUrl, $item.attr('href'))
    if (!name || !chapterId)
      return
    chapters.push({
      name,
      chapterId,
      index: startIndex + chapters.length,
      isPay: false,
      isVip: false,
      isVolume: false,
      tag: '',
    })
  })
  return chapters
}

const CRLF = '\r\n'
const DOUBLE_CRLF = '\r\n\r\n'

const CONTENT_SKIP_TAGS = new Set(['script', 'style', 'nav', 'footer', 'header', 'iframe', 'noscript'])
const RE_CONTENT_SKIP_CLASS = /\b(?:ad|ads|advert|nav|sidebar|footer|header|menu|toolbar)\b/i
const RE_CONTENT_AD_TEXT = /(?:收藏|永久|地址|网址|书签|请记住|最新|访问|发布)[^\n]{0,20}[a-z\d][-a-z\d]*\.[a-z]{2,}/i

/**
 * 判断一个元素是否应该在提取内容时被跳过，主要用于过滤掉不相关的导航、广告等元素
 * @param el 要检查的元素
 * @returns 如果元素应该被跳过则返回 `true`，否则返回 `false`
 */
function contentNodeShouldSkip(el: Element): boolean {
  const tag = el.tagName.toLowerCase()
  if (CONTENT_SKIP_TAGS.has(tag))
    return true
  if (tag === 'a' && el.getAttribute('href')?.startsWith('javascript:'))
    return true
  const cls = el.className?.toLowerCase() ?? ''
  if (RE_CONTENT_SKIP_CLASS.test(cls))
    return true
  return false
}

/**
 * 判断文本内容是否可能是广告，主要通过检测常见的广告关键词和 URL 模式来识别
 * @param text 要检查的文本内容
 * @returns 如果文本内容可能是广告则返回 `true`，否则返回 `false`
 */
function contentNodeTextIsAd(text: string): boolean {
  return text.length < 40 && RE_CONTENT_AD_TEXT.test(text)
}

interface ExtractContentOptions {
  /** 是否对内容进行净化，去除广告 */
  sanitize?: boolean
}

/**
 * 从HTML容器中提取文本内容，保留段落和换行结构，并将图片标签转换为特定格式的文本
 * @param container HTML容器，可以是 `Q` 对象或原生 `Element`
 * @param opts 提取内容的选项
 * @returns 提取后的纯文本内容，段落之间以双换行分隔，图片以特定格式表示
 */
export function extractContent(container: Q | Element, opts: ExtractContentOptions = { sanitize: false }): string {
  const el = container instanceof Q ? container.raw : container
  if (!el)
    return ''

  const parts: string[] = []

  function walk(parent: Element) {
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text && (!opts.sanitize || !contentNodeTextIsAd(text)))
          parts.push(text)
        continue
      }

      if (node.nodeType !== Node.ELEMENT_NODE)
        continue

      const child = node as Element
      if (contentNodeShouldSkip(child))
        continue

      const tag = child.tagName.toLowerCase()

      if (tag === 'p') {
        const before = parts.length
        walk(child)
        if (parts.length > before)
          parts.push(DOUBLE_CRLF)
      }
      else if (tag === 'br') {
        parts.push(CRLF)
      }
      else if (tag === 'img') {
        const src = child.getAttribute('src') || child.getAttribute('data-src') || ''
        if (src) {
          parts.push(`<img src="${src}" />`)
          parts.push(CRLF)
        }
      }
      else {
        walk(child)
      }
    }
  }

  walk(el)

  return parts.join('').replace(/(\r\n){3,}/g, DOUBLE_CRLF).trim()
}
