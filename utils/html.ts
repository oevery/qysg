/**
 * 一个简单的HTML解析和操作工具，提供了类似于jQuery的API来查找元素、获取文本内容、属性和HTML结构。
 */
export class Q {
  private el: Element | null

  constructor(el: Element | null) {
    this.el = el
  }

  /**
   * 查找子元素，返回一个新的 `Q` 对象
   * @param selector CSS选择器，用于查找子元素
   * @returns 一个新的 `Q` 对象，包含找到的第一个元素，如果没有找到则为null
   */
  find(selector: string): Q {
    return new Q(this.el?.querySelector(selector) ?? null)
  }

  /**
   * 查找所有匹配的子元素，返回一个 `Q` 对象数组
   * @param selector CSS选择器，用于查找子元素
   * @returns 一个 `Q` 对象数组，包含所有找到的元素，如果没有找到则返回空数组
   */
  findAll(selector: string): Q[] {
    if (!this.el)
      return []
    return Array.from(this.el.querySelectorAll(selector)).map(el => new Q(el))
  }

  /**
   * 获取元素的文本内容，去除前后空白
   * @returns 元素的文本内容，如果元素不存在则返回空字符串
   */
  text(): string {
    return this.el?.textContent?.trim() ?? ''
  }

  /**
   * 获取元素的属性值
   * @param name 属性名称
   * @returns 属性值，如果元素不存在或属性不存在则返回空字符串
   */
  attr(name: string): string {
    return this.el?.getAttribute(name) ?? ''
  }

  /**
   * 获取元素的 HTML内容
   * @returns 元素的 HTML内容，如果元素不存在则返回空字符串
   */
  html(): string {
    return this.el?.innerHTML ?? ''
  }

  /**
   * 获取原生 DOM 元素
   * @returns 原生 DOM 元素，如果元素不存在则返回 `null`
   */
  get raw(): Element | null {
    return this.el
  }
}

/**
 * 创建一个 `Q` 对象，接受一个 HTML 字符串或一个 DOM 元素作为输入
 * @param input HTML 字符串或 DOM 元素，如果是字符串则会被解析成 DOM 元素，如果是 DOM 元素则直接使用
 * @returns 一个 `Q` 对象，包含解析后的 DOM 元素
 */
export function q(input: string | Element): Q {
  if (typeof input === 'string') {
    const div = document.createElement('div')
    div.innerHTML = input
    return new Q(div)
  }
  return new Q(input)
}

/**
 * 去除 HTML 文本中的 script 和 style 标签
 * @param html HTML 字符串
 * @returns 去除 script 和 style 标签后的 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  // 移除script标签
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  // 移除style标签
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  return result
}
