/**
 * 轻悦时光 WebView 运行时全局类型声明
 *
 * ⚠ 此文件根据 `utils/bridge.ts` 的实现生成，请勿手动编辑。
 * 如需修改类型，请修改 `utils/bridge.ts` 后重新生成此文件。
 *
 * 书源 `.ts` 文件中可直接使用 `http`、`cache`、`cookie`、`flutterBridge` 等全局变量。
 */

// ─── HTTP 响应 ───────────────────────────────────────────────

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
interface HttpResponse {
  method: string
  body: string
  headers: Record<string, string[]>
  statusCode: number
  statusMessage: string
  data: string
}

// ─── FlutterJSBridge ────────────────────────────────────────

/** Flutter WebView 与原生层通信桥接器 */
declare class FlutterJSBridge {
  /** 桥接器是否已就绪 */
  isReady: boolean
  /** 初始化桥接器，监听 WebView 平台就绪事件（前台 webview 里必须删除） */
  init(): void
  /** 通知原生页面初始化完成，仅在书源和 TTS 生效，webview 请勿使用 */
  CookieJar(): Promise<void>

  // ── 设备信息 ──

  /** 获取应用编译版本 */
  getbuildNumber(): Promise<number>
  /** 获取应用版本（如 `"1.2.3"`） */
  getversion(): Promise<string>
  /** 获取设备唯一 ID */
  getDeviceid(): Promise<string>
  /** 获取设备平台（返回 windows/macos/ios/ohos/android） */
  getDevice(): Promise<string>
  /** 获取默认 User-Agent（webview 里禁止使用，请用 `navigator.userAgent`） */
  getWebViewUA(): Promise<string>

  // ── 文本处理 ──

  /** 将简体字转成繁体字 */
  toTraditional(str: string): Promise<string>
  /** 将繁体字转成简体字 */
  toSimplified(str: string): Promise<string>
  /** 将 UTF-8 字符串转到 GBK 并 URL 编码 */
  utf8ToGbkUrlEncoded(str: string): Promise<string>
  /** UTF-8 字符串转 Base64 */
  base64encode(str: string): Promise<string>
  /** Base64 转 UTF-8 字符串 */
  base64decode(str: string): Promise<string>

  // ── 日志与提示 ──

  /** 输出日志到 App（前台 webview 请勿使用） */
  log(str: string): Promise<boolean>
  /**
   * 书源调试时可输出 HTML 代码到前台
   * @param type - 0 搜索源码，1 详情源码，2 目录源码，3 正文源码
   * @param str - HTML 代码字符串
   */
  text(type: 0 | 1 | 2 | 3, str: string): Promise<boolean>
  /** Toast 弹窗 */
  showToast(str: string): Promise<boolean>

  // ── 浏览器控制 ──

  /** 通过 URL 打开外部应用 */
  openurl(url: string): Promise<boolean>
  /** 通过 URL 打开外部应用并附带 MIME 类型 */
  openurlwithMimeType(url: string, mimeType: string): Promise<boolean>
  /**
   * 启动前台 WebView 访问链接并获取结束时的 HTML，可用于手工过盾
   * @param url - 网址
   * @param title - 标题
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  startBrowser(url: string, title: string, header: string): Promise<string>
  /**
   * 启动前台 WebView 并对每次打开的 URL 进行拦截
   * @param url - 网址
   * @param title - 标题
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  startBrowserWithShouldOverrideUrlLoading(url: string, title: string, header: string): Promise<string>
  /** 专门为段评设置的半屏显示，不返回任何东西 */
  startBrowserDp(url: string, title: string): Promise<string>
  /** 仅前台 webview 可以使用，返回按钮，返回上一个页面 */
  back(): Promise<boolean>

  // ── WebView 操作 ──

  /**
   * 使用 WebView 访问网络
   * @param url - 目标 URL（html 内如果有相对路径的资源不传入 url 访问不了）
   * @param js - 用来取返回值的 JS 语句，没有就返回整个源代码
   * @param html - 直接用 WebView 载入的 HTML（为空则直接访问 url）
   * @param body - 当参数不为空时以 POST 请求，此时请务必在 header 中带上 content-type
   * @param header - 请求的 header 头，必须是 JSON 字符串
   */
  webview(url: string, js: string, html: string, body: string, header: string): Promise<string>
  /**
   * 使用 WebView 并通过 URL 正则拦截获取重定向 URL
   * @param overrideUrlRegex - 正则表达式，匹配到则返回该 URL，否则返回 JS 获取的内容
   */
  webViewGetOverrideUrl(url: string, js: string, html: string, body: string, header: string, overrideUrlRegex: string): Promise<string>
  /**
   * 使用 WebView 获取资源 URL
   * @param urlregex - 正则表达式，匹配到则返回该资源 URL，否则返回 JS 获取的内容
   */
  webViewGetSource(url: string, js: string, html: string, body: string, header: string, urlregex: string): Promise<string>

  // ── 其他 ──

  /**
   * 让用户输入图片验证码
   * @param str - 图片链接（为空则直接让用户输入验证码）
   * @param header - 请求的 header 头，必须是 JSON 字符串
   * @returns 用户输入的验证码
   */
  getVerificationCode(str: string, header: string): Promise<string>
  /** 提交 bookUrl，App 会调用书源 info 函数来获取这本书的信息 */
  addbook(bookUrl: string): Promise<string>
}

// ─── HTTP 客户端 ─────────────────────────────────────────────

/**
 * HTTP 请求客户端
 *
 * - webview 下 isCookieJar 必定为 true，会自动处理 cookie
 * - url / headers / body 都必须为字符串，headers 必须为 JSON 字符串
 * - `followRedirects` 为 false 时不处理重定向，true 时自动处理（推荐 true）
 * - 如需使用 HTTP/2 协议，请在 url 前添加 `http2://`
 * - 如 HTTPS 一直被盾拦截，可以使用 `https2://` 协议
 */
declare class Http {
  /**
   * 发送 GET 请求
   * @param url - 请求 URL
   * @param headers - 请求头对象（内部会 JSON.stringify）
   * @param followRedirects - 是否跟随重定向
   */
  Get(url: string, headers: Record<string, string>, followRedirects: boolean): Promise<HttpResponse | null>

  /**
   * 发送 HEAD 请求
   * @param url - 请求 URL
   * @param headers - 请求头对象
   * @param followRedirects - 是否跟随重定向
   */
  Head(url: string, headers: Record<string, string>, followRedirects: boolean): Promise<HttpResponse | null>

  /**
   * 发送 POST 请求
   * @param url - 请求 URL
   * @param headers - 请求头对象
   * @param body - 请求体
   * @param contenttype - Content-Type
   * @param followRedirects - 是否跟随重定向
   */
  Post(url: string, headers: Record<string, string>, body: string, contenttype: string, followRedirects: boolean): Promise<HttpResponse | null>
}

// ─── 缓存 ────────────────────────────────────────────────────

/** 持久化键值缓存（App 内部 Storage） */
declare class AppCache {
  /** 读取缓存 */
  get(key: string): Promise<string | null>
  /** 写入缓存 */
  set(key: string, value: string): Promise<void>
  /** 删除缓存 */
  remove(key: string): Promise<void>
  /** 获取弹窗登录输入内容（返回 JSON 格式或空，需自行转换） */
  getLoginInfo(): Promise<string | null>
  /** 保存弹窗登录输入内容（必须 JSON.stringify 后传入） */
  putLoginInfo(info: string): Promise<void>
  /** 获取书本变量 */
  getbookVariable(bookurl: string): Promise<string | null>
  /** 写入书本变量 */
  setbookVariable(bookurl: string, value: string): Promise<void>
}

// ─── Cookie ──────────────────────────────────────────────────

/** Cookie 管理器 */
declare class AppCookie {
  /** 通过 URL 获取当前 URL 的所有 Cookie */
  get(url: string): Promise<string | null>
  /** 通过 URL 删除当前 URL 的所有 Cookie */
  remove(url: string): Promise<void>
  /** 通过 URL 保存当前 URL 的所有 Cookie */
  set(url: string, value: string): Promise<void>
  /** 设置单独一个 Cookie */
  setCookie(url: string, key: string, value: string): Promise<void>
  /** 通过 URL 获取单个 Cookie 的值 */
  getCookie(url: string, value: string): Promise<string | null>
}

// ─── 全局实例 ────────────────────────────────────────────────

/** Flutter 桥接器实例 */
declare const flutterBridge: FlutterJSBridge
/** HTTP 客户端实例 */
declare const http: Http
/** 缓存管理实例 */
declare const cache: AppCache
/** Cookie 管理实例 */
declare const cookie: AppCookie

// ─── 工具函数 ────────────────────────────────────────────────

/**
 * 安全的创建一个 div 解析 HTML
 * @param htmlStr - HTML 字符串
 * @returns jQuery 包装的 DOM 对象
 */
declare function parseHTMLSafely(htmlStr: string): JQuery

/**
 * 移除 `parseHTMLSafely` 创建的临时容器（用完后必须删除）
 * @param tempContainer - 由 `parseHTMLSafely` 创建的临时 DOM 容器
 */
declare function removeHTMLSafely(tempContainer: JQuery): void

/**
 * 移除 HTML 中的 `<script>` 和 `<style>` 标签及内容
 * （创建 parseHTMLSafely 前如果用不上 CSS/JS 建议先移除）
 * @param htmlString - 包含 HTML 标签的字符串
 * @returns 清理后的字符串
 */
declare function removeHTMLTags(htmlString: string): string

/**
 * url 处理函数，将相对路径转为绝对路径并且编码
 * @param base - 基础 URL（如书源主页 URL）
 * @param relative - 需要处理的 URL（可能是相对路径）
 * @returns 处理后的绝对 URL
 */
declare function resolveUrl(base: string, relative: string): string

// ─── Window 扩展 ─────────────────────────────────────────────

interface Window {
  /** Flutter InAppWebView 注入的原生通信接口 */
  flutter_inappwebview: {
    callHandler: (handlerName: string, ...args: any[]) => Promise<any>
  }
}
