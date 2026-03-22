import type { SourceMeta } from './utils/define'

/** 部署后 HTML 文件的 URL 前缀，可通过环境变量覆盖 */
export const BASE_URL = 'https://qysg.pages.dev'

/** 默认 UA */
export const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'

/** 构建时间使用的时区 */
export const TIMEZONE = 'Asia/Shanghai'

/** 从源码提取并填充默认值后的完整元数据（所有可选字段已确定） */
export type ResolvedMeta = Required<SourceMeta>

/** 元数据默认值 */
export const META_DEFAULTS: ResolvedMeta = {
  name: '',
  id: '',
  url: '',
  jquery: false,
  cookieJar: true,
  group: '',
  scripts: [],
  enabled: true,
  enabledFind: true,
  enabledHelp: true,
  enabledLogin: false,
  author: 'oevery',
}
