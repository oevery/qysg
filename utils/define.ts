/**
 * 书源定义工厂模块
 *
 * 提供 `defineSource()` 工厂函数，用于在单个文件中声明书源的元数据和全部逻辑。
 * 构建时 esbuild 会将此模块内联到书源代码中，`defineSource()` 在浏览器环境执行时
 * 将各书源函数注册到 `window` 全局作用域，供轻悦时光 App 的 WebView 调用。
 */

// ─── 元数据类型 ─────────────────────────────────────────────

/** 书源元数据，描述书源的基本信息和构建选项 */
export interface SourceMeta {
  /** 书源显示名称（如 `"爱丽丝书屋"`） */
  name: string
  /** 书源唯一标识，用作输出文件名（如 `"alicesw"`） */
  id: string
  /** 书源网站主页 URL */
  url: string
  /** 是否加载 jQuery（默认 `true`） */
  jquery?: boolean
  /** 是否启用 CookieJar（默认 `true`） */
  cookieJar?: boolean
  /** 书源分组名称（默认 `""`） */
  group?: string
  /** 需要额外引入的外部脚本 URL 列表 */
  scripts?: string[]
  /** 是否启用书源（默认 `true`） */
  enabled?: boolean
  /** 是否启用发现功能（默认 `true`） */
  enabledFind?: boolean
  /** 是否启用帮助功能（默认 `true`） */
  enabledHelp?: boolean
  /** 是否启用登录功能（默认 `false`） */
  enabledLogin?: boolean
  author?: string
}

// ─── 书源数据类型 ────────────────────────────────────────────

/** 书本信息，由 `search`/`info`/`find` 返回 */
export interface Book {
  /** 书本 URL（唯一标识，不可重复） */
  bookUrl: string
  /** 书本名称 */
  name: string
  /** 作者 */
  author: string
  /** 分类 */
  kind: string
  /**
   * 封面 URL
   *
   * 支持在 URL 后附带 JSON 设置 header：`http://example.com/cover.jpg,{'headers':{'Referer':'...'}}`
   */
  coverUrl: string
  /**
   * 简介
   *
   * 支持 HTML 格式，需在最前面添加 `@html:` 前缀，例如 `@html: <p>这是简介</p>`。
   * 不加前缀则直接显示为纯文本。
   */
  intro: string
  /** 目录页 URL */
  tocUrl: string
  /** 字数 */
  wordCount: string
  /** 书本类别：`0` 小说 / `1` 听书 / `2` 漫画 */
  type: string
  /** 最新章节标题 */
  latestChapterTitle: string
}

/**
 * 章节目录项，由 `chapter` 返回
 *
 * 当 `isVip` 为 `true` 且 `isPay` 为 `false` 时，App 会显示购买按钮。
 */
export interface Chapter {
  /** 章节标题 */
  name: string
  /** 正文 URL（作为 `content` 函数的参数传入） */
  chapterId: string
  /** 章节索引 */
  index: number
  /** 是否需要付费 */
  isPay: boolean
  /** 是否是 VIP */
  isVip: boolean
  /** 是否是卷名（卷名为分隔标题，不可点击） */
  isVolume: boolean
  /** 小标题 */
  tag: string
}

/**
 * 发现页分类项，由 `getfinds` 返回
 *
 * `url` 和 `js` 只能填一个
 */
export interface Find {
  /** 标题 */
  title: string
  /** 分类 URL */
  url?: string
  /** 要运行的 JS（与 `url` 互斥） */
  js?: string
  /**
   * 类型
   * - `0` — 正常解析发现页
   * - `1` — 用 WebView 打开 URL
   */
  type?: 0 | 1
  /**
   * 布局宽度
   * - `0` — 默认（一行 3 个）
   * - `1` — 一行 2 个
   * - `3` — 一行 1 个
   *
   * 当 `url` 和 `js` 都为空时，按 `width = 3` 处理。
   */
  width?: 0 | 1 | 3
}

/**
 * 登录表单项，由 `getloginurl` 返回（当返回 JSON 数组时）
 *
 * 用户填写完成后 App 会调用 `login()` 函数。
 */
export interface Login {
  /** 标题 */
  name: string
  /** 执行的 JS（仅 `type: "button"` 时生效） */
  action: string
  /** 类型：`"button"` / `"text"` / `"password"` */
  type: 'button' | 'text' | 'password'
}

// ─── 书源函数类型 ────────────────────────────────────────────

/**
 * 书源函数接口，定义了轻悦时光 App 可能调用的所有书源方法。
 * 所有方法均为可选，按需实现即可。
 */
export interface SourceFunctions {
  /**
   * 搜索书籍
   *
   * 如果没有分页，请在 `page >= 2` 时返回 `"[]"`。
   *
   * @param key - 搜索关键词
   * @param page - 页码（从 1 开始）
   * @returns `Book[]` 的 JSON 字符串
   */
  search?: (key: string, page: number) => Promise<string>

  /**
   * 获取书籍详情
   *
   * @param bookurl - 书籍详情页 URL
   * @returns `Book` 的 JSON 字符串
   */
  info?: (bookurl: string) => Promise<string>

  /**
   * 获取章节目录
   *
   * @param tocUrl - 目录页 URL
   * @returns `Chapter[]` 的 JSON 字符串
   */
  chapter?: (tocUrl: string) => Promise<string>

  /**
   * 获取章节正文内容
   *
   * 正文不支持除 `<img>` 以外的 HTML 标签。
   * 图片使用 `<img src="url">` ，可在 src 后附带 JSON 设置 header/解密等。
   * 与文字同行的图片会以段评（小图）显示，独立一行的图片正常显示。
   *
   * @param url - 章节 URL（即 `Chapter.chapterId`）
   * @returns 正文字符串
   */
  content?: (url: string) => Promise<string>

  /**
   * 获取发现页分类列表
   *
   * @returns `Find[]` 的 JSON 字符串
   */
  getfinds?: () => Promise<string>

  /**
   * 获取发现页书籍列表
   *
   * 如果没有分页，请在 `page >= 2` 时返回 `"[]"`。
   *
   * @param url - 分类 URL
   * @param page - 页码（从 1 开始）
   * @returns `Book[]` 的 JSON 字符串
   */
  find?: (url: string, page: number) => Promise<string>

  /**
   * 获取登录页面 URL 或登录表单配置
   *
   * 返回 `http` 开头的 URL 时，App 会打开 WebView 登录页。
   * 返回 `Login[]` 的 JSON 时，App 会显示弹窗表单，用户提交后调用 `login()`。
   *
   * @returns 登录页 URL 或 `Login[]` 的 JSON 字符串
   */
  getloginurl?: () => Promise<string>

  /** 执行登录逻辑（当 `getloginurl` 返回表单 JSON 时，用户提交后触发） */
  login?: () => Promise<boolean>

  /**
   * 处理付费章节（执行完成后 App 会刷新目录和正文）
   *
   * @param bookurl - 书籍 URL（即 `Book.bookUrl`）
   * @param url - 付费章节 URL（即 `Chapter.chapterId`）
   */
  pay?: (bookurl: string, url: string) => Promise<void>

  /**
   * 解密图片内容（漫画书源）
   *
   * 返回值必须是 `List<int>` 格式（能被 `Uint8List.fromList()` 接受）。
   *
   * @param url - 图片 URL（可在 URL 后附带 JSON 参数）
   * @param image - 加密图片的 Base64 字符串
   * @returns 解密后的字节数组
   */
  imagedecrypt?: (url: string, image: string) => Promise<any>

  /**
   * WebView URL 拦截处理
   *
   * 当调用 `flutterBridge.startBrowserWithShouldOverrideUrlLoading()` 时必须实现此函数。
   * 返回 `false` 则取消打开该网页。
   *
   * @param url - 被拦截的 URL
   * @returns 是否允许打开该 URL
   */
  shouldOverrideUrlLoading?: (url: string) => Promise<boolean>

  /**
   * 获取 TTS 语音合成 URL（有声书源）
   *
   * @param speakText - 要朗读的文本
   * @param speechRate - 语速（`1.0` 为正常速度）
   * @returns 语音文件 URL
   */
  getttsurl?: (speakText: string, speechRate: number) => Promise<string>
}

// ─── 工厂函数 ────────────────────────────────────────────────

/** 书源完整配置 = 元数据 + 书源函数 */
export type SourceConfig = SourceMeta & SourceFunctions

/**
 * App 端可调用的全部书源函数名。
 * 构建脚本和 `defineSource()` 共同使用此列表来注册/识别函数。
 */
export const SOURCE_FUNCTIONS = [
  'search',
  'info',
  'chapter',
  'content',
  'getfinds',
  'find',
  'getloginurl',
  'login',
  'pay',
  'imagedecrypt',
  'shouldOverrideUrlLoading',
  'getttsurl',
] as const

/** 书源函数名联合类型 */
export type SourceFunctionName = typeof SOURCE_FUNCTIONS[number]

/**
 * 定义书源：声明元数据并将书源函数注册到全局作用域。
 *
 * 在每个书源文件（如 `sources/xxx.ts`）中调用此函数，传入包含元数据和
 * 书源方法的配置对象。构建后运行在 WebView 中时，App 通过 `window.search()`
 * 等全局函数与书源交互。
 *
 * 在 Node 环境（构建时）调用时仅返回配置对象，不注册全局函数。
 *
 * @example
 * ```ts
 * export default defineSource({
 *   name: '示例书源',
 *   id: 'example',
 *   url: 'https://example.com',
 *   async search(key, page) {
 *     const res = await http.Get(url, {}, true)
 *     return JSON.stringify(results)
 *   },
 * })
 * ```
 */
export function defineSource(config: SourceConfig): SourceConfig {
  if (typeof window !== 'undefined') {
    for (const fn of SOURCE_FUNCTIONS) {
      if (typeof config[fn] === 'function') {
        ;(window as any)[fn] = config[fn]
      }
    }
  }
  return config
}
