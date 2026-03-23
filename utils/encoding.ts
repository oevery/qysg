/**
 * 纯 TypeScript 编码转换工具
 *
 * 利用 TextDecoder 反向构建编码映射表，实现字符串在不同编码间的转换，
 * 无需依赖 Node.js Buffer 或 Flutter 原生调用。
 */

// ─── 类型 ──────────────────────────────────────────────────

/**
 * Encoding Standard 编码标签
 *
 * @see https://encoding.spec.whatwg.org/#names-and-labels
 */
export type EncodingLabel
  = | 'utf-8' | 'utf8'
    | 'ibm866' | 'iso-8859-2' | 'iso-8859-3' | 'iso-8859-4' | 'iso-8859-5'
    | 'iso-8859-6' | 'iso-8859-7' | 'iso-8859-8' | 'iso-8859-10' | 'iso-8859-13'
    | 'iso-8859-14' | 'iso-8859-15' | 'iso-8859-16' | 'koi8-r' | 'koi8-u'
    | 'macintosh' | 'windows-874' | 'windows-1250' | 'windows-1251'
    | 'windows-1252' | 'windows-1253' | 'windows-1254' | 'windows-1255'
    | 'windows-1256' | 'windows-1257' | 'windows-1258' | 'x-mac-cyrillic'
    | 'gbk' | 'gb18030' | 'big5'
    | 'euc-jp' | 'iso-2022-jp' | 'shift_jis' | 'shift-jis'
    | 'euc-kr'
    | 'utf-16be' | 'utf-16le'

// ─── 编码映射表 ────────────────────────────────────────────

/** 缓存已构建的 Unicode → 目标编码 字节映射表 */
const encodingTables = new Map<string, Map<string, number[]>>()

/**
 * 构建 Unicode 字符 → 目标编码字节序列的映射表
 *
 * 利用 `TextDecoder(encoding)` 遍历所有合法双字节序列，反向得到编码表。
 * 首次调用约 50ms（取决于编码范围），结果缓存后零开销复用。
 */
function getEncodingTable(encoding: EncodingLabel): Map<string, number[]> {
  const key = encoding.toLowerCase()
  let table = encodingTables.get(key)
  if (table)
    return table

  table = new Map<string, number[]>()
  const decoder = new TextDecoder(encoding, { fatal: true })

  for (let high = 0x81; high <= 0xFE; high++) {
    for (let low = 0x40; low <= 0xFE; low++) {
      try {
        const char = decoder.decode(new Uint8Array([high, low]))
        if (char && !table.has(char))
          table.set(char, [high, low])
      }
      catch { /* 非法字节序列，跳过 */ }
    }
  }

  encodingTables.set(key, table)
  return table
}

// ─── 公共 API ──────────────────────────────────────────────

/**
 * 将字符串从一种编码转为另一种编码的字节序列
 *
 * @param str - 原始字符串
 * @param to - 目标编码（如 `'gbk'`、`'big5'`、`'shift_jis'`）
 * @param from - 源编码，默认 `'utf-8'`（即 JS 原生字符串编码）
 * @returns 目标编码的字节数组
 *
 * @example
 * ```ts
 * encodeText('我的', 'gbk')   // => Uint8Array [0xCE, 0xD2, 0xB5, 0xC4]
 * encodeText('hello', 'gbk')  // => Uint8Array [0x68, 0x65, 0x6C, 0x6C, 0x6F]
 * ```
 */
export function encodeText(str: string, to: EncodingLabel, from: EncodingLabel = 'utf-8'): Uint8Array {
  // 如果源编码不是 utf-8，先解码为 JS 字符串
  const fromNorm = from.toLowerCase().replace(/[-_]/g, '')
  if (fromNorm !== 'utf8') {
    str = new TextDecoder(from, { fatal: false }).decode(new TextEncoder().encode(str))
  }

  const toNorm = to.toLowerCase().replace(/[-_]/g, '')

  // 目标是 utf-8，直接用 TextEncoder
  if (toNorm === 'utf8')
    return new TextEncoder().encode(str)

  const table = getEncodingTable(to)
  const bytes: number[] = []

  for (const char of str) {
    const code = char.codePointAt(0)!
    if (code <= 0x7F) {
      bytes.push(code)
    }
    else {
      const mapped = table.get(char)
      if (mapped)
        bytes.push(...mapped)
    }
  }

  return new Uint8Array(bytes)
}

/**
 * 将字节数组转为 URL percent-encoding 字符串
 *
 * ASCII 可打印字符保留原样，其余字节转为 `%XX` 格式。
 *
 * @example
 * ```ts
 * percentEncode(encodeText('我的', 'gbk'))  // => '%CE%D2%B5%C4'
 * percentEncode(encodeText('hello', 'gbk'))  // => 'hello'
 * ```
 */
export function percentEncode(bytes: Uint8Array): string {
  let result = ''
  for (const b of bytes) {
    if (
      (b >= 0x30 && b <= 0x39) // 0-9
      || (b >= 0x41 && b <= 0x5A) // A-Z
      || (b >= 0x61 && b <= 0x7A) // a-z
      || b === 0x2D || b === 0x2E || b === 0x5F || b === 0x7E // - . _ ~
    ) {
      result += String.fromCharCode(b)
    }
    else {
      result += `%${b.toString(16).toUpperCase().padStart(2, '0')}`
    }
  }
  return result
}

/**
 * 将 UTF-8 字符串编码为 GBK 并 percent-encode
 *
 * 等价于 `percentEncode(encodeText(str, 'gbk'))`，适用于构造 GBK 编码的 URL 参数。
 *
 * @example
 * ```ts
 * percentEncodeGBK('我的')  // => '%CE%D2%B5%C4'
 * percentEncodeGBK('hello') // => 'hello'
 * ```
 */
export function percentEncodeGBK(str: string): string {
  return percentEncode(encodeText(str, 'gbk'))
}
