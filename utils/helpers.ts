/**
 * 书源开发通用工具函数
 *
 * 提供页面请求解析、分页处理、章节解析等常用操作，
 * 减少各书源文件中的重复代码。
 */

import type { DebugType } from './bridge'
import type { Chapter } from './define'
import type { Q } from './html'
import { q, sanitizeHtml } from './html'

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

/**
 * GET 请求页面并解析为 Q 对象
 *
 * 等价于 `http.get(url)` → `flutterBridge.text()` → `q(sanitizeHtml())`
 *
 * @param url - 请求 URL
 * @param debugType - 调试类型，传入则发送源码到 App
 */
export async function fetchPage(url: string, debugType?: DebugType): Promise<Q> {
  const res = await http.get(url)
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
 * 从链接元素列表中解析章节目录
 *
 * 适用于常见的 `<a href="...">章节标题</a>` 列表结构。
 *
 * @param baseUrl - 书源基础 URL，用于解析相对路径
 * @param $items - 包含章节链接的 Q 对象数组
 * @param startIndex - 起始索引（用于分页拼接时的偏移）
 */
export function parseChapters(baseUrl: string, $items: Q[], startIndex = 0): Chapter[] {
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
