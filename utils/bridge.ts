/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-var */
/* eslint-disable vars-on-top */

/**
 * 轻悦时光 WebView 运行时桥接代码
 *
 * 此文件由 esbuild 编译后注入到每个书源 HTML 的 <script> 标签中。
 * 提供 FlutterJSBridge / Http / Cache / Cookie 等运行时类，
 * 作为书源 JS 代码与 Flutter App 原生层之间的通信桥梁。
 */

interface FlutterInAppWebView {
  callHandler: (handlerName: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    flutter_inappwebview: FlutterInAppWebView
  }
}

/** 编译时注入的全局常量，表示是否启用 CookieJar 功能 */
declare const __COOKIE_JAR__: boolean

var isCookieJar = __COOKIE_JAR__

/** JS 与 Flutter 原生层通信桥接器 */
export class FlutterJSBridge {
  /** 桥接器是否已就绪 */
  isReady = false

  constructor() {
    this.init() // 前台 webview 里必须删除这行
  }

  /** 初始化桥接器，监听 WebView 平台就绪事件（前台 webview 里必须删除） */
  init() {
    if (window.flutter_inappwebview) {
      this.isReady = true
      this.CookieJar()
    }
    else {
      window.addEventListener('flutterInAppWebViewPlatformReady', () => {
        this.isReady = true
        console.log('JSBridge初始化完成')
        this.CookieJar()
      })
    }
  }

  /**
   * 通知原生页面初始化完成
   *
   * 仅在书源和 TTS 生效，webview 请勿使用
   *
   * 加载成功后才允许运行，否则会一直等待加载成功
   */
  async CookieJar() {
    try {
      await window.flutter_inappwebview.callHandler('CookieJar', isCookieJar)
    }
    catch (error) {
      console.error('汇报完成准备失败:', error)
    }
  }

  // ── 设备信息 ──

  /** 获取应用编译版本 */
  async getbuildNumber(): Promise<number> {
    try {
      return await window.flutter_inappwebview.callHandler('buildNumber')
    }
    catch (error) {
      return 0
    }
  }

  /** 获取应用版本（如 `"1.2.3"`） */
  async getversion(): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('version')
    }
    catch {
      return '0.0.0'
    }
  }

  /** 获取设备唯一 ID */
  async getDeviceid(): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('id')
    }
    catch {
      return ''
    }
  }

  /** 获取设备平台（返回 windows/macos/ios/ohos/android） */
  async getDevice(): Promise<'windows' | 'macos' | 'ios' | 'ohos' | 'android' | string> {
    try {
      return await window.flutter_inappwebview.callHandler('device')
    }
    catch {
      return ''
    }
  }

  /** 获取默认 User-Agent（webview 里禁止使用，请用 `navigator.userAgent`） */
  async getWebViewUA() {
    try {
      return await window.flutter_inappwebview.callHandler('getWebViewUA')
    }
    catch {
      return ''
    }
  }

  // ── 文本处理 ──

  /** 将简体字转成繁体字 */
  async toTraditional(str: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('toTraditional', str)
    }
    catch {
      return ''
    }
  }

  /** 将繁体字转成简体字 */
  async toSimplified(str: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('toSimplified', str)
    }
    catch {
      return ''
    }
  }

  /** 将 UTF-8 字符串转到 GBK 并 URL 编码 */
  async utf8ToGbkUrlEncoded(str: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('utf8ToGbkUrlEncoded', str)
    }
    catch {
      return ''
    }
  }

  /** UTF-8 字符串转 Base64 */
  async base64encode(str: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('base64encode', str)
    }
    catch {
      return ''
    }
  }

  /** Base64 转 UTF-8 字符串 */
  async base64decode(str: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('base64decode', str)
    }
    catch {
      return ''
    }
  }

  // ── 日志与提示 ──

  /** 输出日志到 App（前台 webview 请勿使用） */
  async log(str: string): Promise<boolean> {
    try {
      return await window.flutter_inappwebview.callHandler('log', str)
    }
    catch {
      return false
    }
  }

  /**
   * 书源调试时可输出 HTML 代码到前台
   * @param type - 0 搜索源码，1 详情源码，2 目录源码，3 正文源码
   * @param str - HTML 代码字符串
   */
  async text(type: 0 | 1 | 2 | 3, str: string): Promise<boolean> {
    try {
      return await window.flutter_inappwebview.callHandler('text', type, str)
    }
    catch {
      return false
    }
  }

  /** Toast 弹窗 */
  async showToast(str: string): Promise<boolean> {
    try {
      return await window.flutter_inappwebview.callHandler('showToast', str)
    }
    catch {
      return false
    }
  }

  // ── 浏览器控制 ──

  /** 通过 URL 打开外部应用 */
  async openurl(url: string): Promise<boolean> {
    try {
      return await window.flutter_inappwebview.callHandler('openurl', url, '')
    }
    catch {
      return false
    }
  }

  /** 通过 URL 打开外部应用并附带 MIME 类型 */
  async openurlwithMimeType(url: string, mimeType: string): Promise<boolean> {
    try {
      return await window.flutter_inappwebview.callHandler('openurl', url, mimeType)
    }
    catch {
      return false
    }
  }

  /**
   * 启动前台 WebView 访问链接并获取结束时的 HTML，可用于手工过盾
   * @param url - 网址
   * @param title - 标题
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  async startBrowser(url: string, title: string, header: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('startBrowser', url, title, header)
    }
    catch {
      return ''
    }
  }

  /**
   * 启动前台 WebView 并对每次打开的 URL 进行拦截
   * @param url - 网址
   * @param title - 标题
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  async startBrowserWithShouldOverrideUrlLoading(url: string, title: string, header: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('startBrowserWithShouldOverrideUrlLoading', url, title, header)
    }
    catch {
      return ''
    }
  }

  /** 专门为段评设置的半屏显示，不返回任何东西 */
  async startBrowserDp(url: string, title: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('startBrowserDp', url, title)
    }
    catch {
      return ''
    }
  }

  /** 仅前台 webview 可以使用，返回按钮，返回上一个页面 */
  async back() {
    try {
      return await window.flutter_inappwebview.callHandler('back')
    }
    catch {
      return false
    }
  }

  // ── WebView 操作 ──

  /**
   * 使用 WebView 访问网络
   * @param url - 目标 URL（html 内如果有相对路径的资源不传入 url 访问不了）
   * @param js - 用来取返回值的 JS 语句，没有就返回整个源代码
   * @param html - 直接用 WebView 载入的 HTML（为空则直接访问 url）
   * @param body - 当参数不为空时为 POST 请求，此时请务必在 header 中带上 content-type
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  async webview(url: string, js: string, html: string, body: string, header: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('webview', url, js, html, body, header, '', '')
    }
    catch {
      return ''
    }
  }

  /**
   * 使用 WebView 并通过 URL 正则拦截获取重定向 URL
   * @param url - 目标 URL
   * @param js - 用来取返回值的 JS 语句，没有就返回整个源代码
   * @param html - 直接用 WebView 载入的 HTML（为空则直接访问 URL）
   * @param body - 当参数不为空时为 POST 请求，此时请务必在 header 中带上 content-type
   * @param header - 请求的 header 头，必须是 JSON 字符串
   * @param overrideUrlRegex - 正则表达式，匹配到则返回该 URL，否则返回 JS 获取的内容
   */
  async webViewGetOverrideUrl(url: string, js: string, html: string, body: string, header: string, overrideUrlRegex: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('webview', url, js, html, body, header, overrideUrlRegex, '')
    }
    catch {
      return ''
    }
  }

  /**
   * 使用 WebView 获取资源 URL
   * @param url - 目标 URL
   * @param js - 用来取返回值的 JS 语句，没有就返回整个源代码
   * @param html - 直接用 WebView 载入的 HTML（为空则直接访问 URL）
   * @param body - 当参数不为空时为 POST 请求，此时请务必在 header 中带上 content-type
   * @param header - 请求的 header 头，必须是 JSON 字符串
   * @param urlregex - 正则表达式，匹配到则返回该资源 URL，否则返回 JS 获取的内容
   */
  async webViewGetSource(url: string, js: string, html: string, body: string, header: string, urlregex: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('webview', url, js, html, body, header, '', urlregex)
    }
    catch {
      return ''
    }
  }

  // ── 其他 ──

  /**
   * 让用户输入图片验证码
   * @param str - 图片链接（为空则直接让用户输入验证码）
   * @param header - 请求的 header 头，必须是 JSON 字符串
   * @returns 用户输入的验证码
   */
  async getVerificationCode(str: string, header: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('getVerificationCode', str, header)
    }
    catch {
      return ''
    }
  }

  /** 提交 bookUrl，App 会调用书源 info 函数来获取这本书的信息 */
  async addbook(bookUrl: string): Promise<string> {
    try {
      return await window.flutter_inappwebview.callHandler('addbook', bookUrl)
    }
    catch {
      return ''
    }
  }
}

/**
 * HTTP 请求响应对象
 *
 * 通用返回字段:
 * - `method` — post / get / head
 * - `body` — 请求返回后的字节的 base64
 * - `headers` — `Record<string, string[]>` 可通过 `headers["key"]` 获取
 * - `statusCode` — HTTP 状态码
 * - `statusMessage` — 状态消息
 * - `data` — 返回后的字节格式化后的内容
 */
export interface HttpResponse {
  method: string
  body: string
  headers: Record<string, string[]>
  statusCode: number
  statusMessage: string
  data: string
}

/**
 * HTTP 请求选项
 * - `headers` 必须是一个普通对象，内部会被 JSON.stringify 后传入原生层
 * - `body` 必须是字符串，且当不为空时会被视为 POST 请求（请务必在 headers 中带上 content-type）
 * - `contentType` 仅在 POST 请求时有效，用于指定 Content-Type，可从 `headers` 中自动获取
 * - `followRedirects` 是否自动跟随重定向，默认为 true
 */
export interface HttpOptions {
  /** 请求头对象，内部会被 JSON.stringify 后传入原生层 */
  headers?: Record<string, string>
  /** 请求体，当不为空时会被视为 POST 请求 */
  body?: string
  /** Content-Type，仅在 POST 请求时有效，可从 headers 中自动获取 */
  contentType?: string
  /** 是否自动跟随重定向，默认为 true */
  followRedirects?: boolean
}

/**
 * HTTP 请求客户端
 *
 * - webview 下 isCookieJar 必定为 true，会自动处理 cookie
 * - url / headers / body 都必须为字符串，headers 必须为 JSON 字符串
 * - `followRedirects` 为 false 时不处理重定向，true 时自动处理（推荐 true）
 * - 如需使用 HTTP/2 协议，请在 url 前添加 `http2://`
 * - 如 HTTPS 一直被盾拦截，可以使用 `https2://` 协议
 */
export class Http {
  constructor() { }

  /**
   * 根据 URL 自动填充 headers 中的 ua，origin，referer 等字段（如果没有的话），以提高成功率
   * @param url - 请求 URL
   * @param headers - 请求头对象
   * @returns 填充后的请求头对象
   */
  static autoFillHeaders(url: string, headers: Record<string, string>): Record<string, string> {
    const filledHeaders = { ...headers }
    if (!filledHeaders['User-Agent']) {
      filledHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    }
    if (!filledHeaders.Origin) {
      const origin = new URL(url).origin
      filledHeaders.Origin = origin
    }
    if (!filledHeaders.Referer) {
      filledHeaders.Referer = `${new URL(url).origin}/`
    }
    return filledHeaders
  }

  /**
   * 发送 GET 请求
   * @param url - 请求 URL
   * @param opts - 请求选项
   * @returns HTTP 响应对象或 null
   */
  async get(url: string, opts: Pick<HttpOptions, 'headers' | 'followRedirects'> = {}): Promise<HttpResponse | null> {
    const headers = JSON.stringify(Http.autoFillHeaders(url, opts.headers || {}))
    const followRedirects = opts.followRedirects ?? true
    try {
      return await window.flutter_inappwebview.callHandler('http', 'get', url, '', headers, followRedirects, '')
    }
    catch {
      return null
    }
  }

  /**
   * 发送 POST 请求
   * @param url - 请求 URL
   * @param opts - 请求选项
   * @returns HTTP 响应对象或 null
   */
  async head(url: string, opts: HttpOptions = {}): Promise<HttpResponse | null> {
    const headers = JSON.stringify(Http.autoFillHeaders(url, opts.headers || {}))
    const followRedirects = opts.followRedirects ?? true
    try {
      return await window.flutter_inappwebview.callHandler('http', 'head', url, '', headers, followRedirects, '')
    }
    catch {
      return null
    }
  }

  /**
   * 发送 POST 请求
   * @param url - 请求 URL
   * @param opts - 请求选项
   * @returns HTTP 响应对象或 null
   */
  async post(url: string, opts: HttpOptions = {}): Promise<HttpResponse | null> {
    const headers = JSON.stringify(Http.autoFillHeaders(url, opts.headers || {}))
    const body = opts.body || ''
    const contentType = opts.contentType || (opts.headers?.['Content-Type'] || '')
    const followRedirects = opts.followRedirects ?? true
    try {
      return await window.flutter_inappwebview.callHandler('http', 'post', url, body, headers, followRedirects, contentType)
    }
    catch {
      return null
    }
  }
}

/** 持久化键值缓存（App 内部 Storage） */
export class AppCache {
  constructor() { }

  /** 读取缓存 */
  async get(key: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cache.get', key)
    }
    catch {
      return null
    }
  }

  /** 写入缓存 */
  async set(key: string, value: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cache.set', key, value)
    }
    catch {
      return null
    }
  }

  /** 删除缓存 */
  async remove(key: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cache.remove', key)
    }
    catch {
      return null
    }
  }

  /** 获取弹窗登录输入内容（返回 JSON 格式或空，需自行转换） */
  async getLoginInfo(): Promise<string> {
    return await this.get('LoginInfo')
  }

  /** 保存弹窗登录输入内容（必须 JSON.stringify 后传入） */
  async putLoginInfo(info: string): Promise<string> {
    return await this.set('LoginInfo', info)
  }

  /** 获取书本变量 */
  async getbookVariable(bookUrl: string): Promise<string | null> {
    return await this.get(bookUrl)
  }

  /** 写入书本变量 */
  async setbookVariable(bookUrl: string, value: string): Promise<string | null> {
    return await this.set(bookUrl, value)
  }
}

/** Cookie 管理器 */
export class AppCookie {
  constructor() { }

  /** 通过 URL 获取当前 URL 的所有 Cookie */
  async get(url: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cookie.get', url)
    }
    catch {
      return null
    }
  }

  /** 通过 URL 删除当前 URL 的所有 Cookie */
  async remove(url: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cookie.remove', url)
    }
    catch {
      return null
    }
  }

  /** 通过 URL 保存当前 URL 的所有 Cookie */
  async set(url: string, value: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cookie.set', url, value)
    }
    catch {
      return null
    }
  }

  /** 设置单独一个 Cookie */
  async setCookie(url: string, key: string, value: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cookie.setcookie', url, key, value)
    }
    catch {
      return null
    }
  }

  /** 通过 URL 获取单个 Cookie 的值 */
  async getCookie(url: string, value: string): Promise<string | null> {
    try {
      return await window.flutter_inappwebview.callHandler('cookie.getCookie', url, value)
    }
    catch {
      return null
    }
  }
}

// 全局桥接实例和工具类
var flutterBridge = new FlutterJSBridge()
var http = new Http()
var cache = new AppCache()
var cookie = new AppCookie()

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
  catch (e) {
    flutterBridge.log(`URL解析错误:${e.message}`)
    return relative // 解析失败则返回原始字符串
  }
}
