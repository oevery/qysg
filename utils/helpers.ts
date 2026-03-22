/**
 * 书源开发通用工具函数
 *
 * 提供页面请求解析、分页处理、章节解析等常用操作，
 * 减少各书源文件中的重复代码。
 */

import type { Chapter } from './define'
import type { Q } from './html'
import { q, sanitizeHtml } from './html'

/**
 * 将 HTML 字符串净化并解析为 Q 对象，可选发送调试数据到 App
 *
 * 适用于已通过 `http.post()` 等自定义方式获取到 HTML 的场景。
 *
 * @param data - HTML 字符串
 * @param debugType - 调试类型（0 搜索 / 1 详情 / 2 目录 / 3 正文），传入则发送源码到 App
 */
export function parsePage(data: string, debugType?: 0 | 1 | 2 | 3): Q {
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
 * @param debugType - 调试类型（0 搜索 / 1 详情 / 2 目录 / 3 正文），传入则发送源码到 App
 */
export async function fetchPage(url: string, debugType?: 0 | 1 | 2 | 3): Promise<Q> {
  const res = await http.get(url)
  return parsePage(res.data, debugType)
}

/**
 * 替换 URL 中的 `{{page}}` 分页占位符（同时处理 URL 编码后的变体）
 *
 * @param url - 含 `{{page}}` 占位符的 URL
 * @param page - 页码
 */
export function resolvePagination(url: string, page: number): string {
  return url.replace(/\{\{page\}\}|%7B%7Bpage%7D%7D/g, page.toString())
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
