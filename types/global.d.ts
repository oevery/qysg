import type { AppCache, AppCookie, FlutterJSBridge, Http } from '../utils/bridge'

declare global {
  /** Flutter WebView 与原生层通信桥接器实例 */
  const flutterBridge: FlutterJSBridge
  /** 持久化键值缓存（App 内部 Storage） */
  const cache: AppCache
  /** Cookie 管理器 */
  const cookie: AppCookie
  /** HTTP 请求客户端 */
  const http: Http
}
