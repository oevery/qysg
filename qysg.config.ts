import type { SourceMeta } from './utils/define'
import process from 'node:process'

/** 部署后 HTML 文件的 URL 前缀，可通过环境变量覆盖 */
export const BASE_URL = process.env.BASE_URL || 'https://qysg.pages.dev'

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
