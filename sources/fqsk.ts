import type { Book, Find } from '../utils/define'
import type { q } from '../utils/html'
import { defineSource } from '../utils/define'
import { fetchPage, parseChapters, parsePage, replacePlaceholders, resolveUrl } from '../utils/helpers'
import { extractContent } from '../utils/html'

const baseUrl = 'https://aabook.xyz'

function resolveTocUrl(bookUrl: string): string {
  const idMatch = bookUrl.match(/book-(\d+)\.html/i)
  if (!idMatch)
    return bookUrl
  return resolveUrl(baseUrl, `/chapterList-${idMatch[1]}.html`)
}

function parseSearchBooks($container: ReturnType<typeof q>): Book[] {
  const books: Book[] = []

  $container.findAll('.sousuojieguo ul li').forEach(($item) => {
    const $titleLink = $item.find('a.biaoti')
    const name = $titleLink.text().trim()
    const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

    if (!name || !bookUrl)
      return

    const text = $item.text()
    const kindMatch = text.match(/\[([^\]]+)\]/)
    const kind = kindMatch ? kindMatch[1].trim() : ''

    books.push({
      bookUrl,
      name,
      author: $item.find('.zuozhe').text().trim(),
      kind,
      coverUrl: '',
      intro: '',
      tocUrl: resolveTocUrl(bookUrl),
      wordCount: '',
      type: '0',
      latestChapterTitle: '',
    })
  })

  return books
}

function parseFindBooks($container: ReturnType<typeof q>): Book[] {
  const books: Book[] = []

  // 分类页主列表（category.html）
  $container.findAll('.yuepiaobang tbody tr').forEach(($row) => {
    const $titleLink = $row.find('td.shuming a')
    const name = $titleLink.text().trim()
    const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

    if (!name || !bookUrl)
      return

    books.push({
      bookUrl,
      name,
      author: $row.find('td.author').text().trim(),
      kind: $row.find('td.fenlei').text().replaceAll('[', '').replaceAll(']', '').trim(),
      coverUrl: '',
      intro: '',
      tocUrl: resolveTocUrl(bookUrl),
      wordCount: '',
      type: '0',
      latestChapterTitle: '',
    })
  })

  return books
}

export default defineSource({
  name: '疯情书库',
  id: 'fqsk',
  url: baseUrl,

  testSeeds: {
    search: { url: `${baseUrl}/search.html?searchword={{key}}&page={{page}}` },
    info: `${baseUrl}/book-6580.html`,
    chapter: `${baseUrl}/chapterList-6580.html`,
    content: `${baseUrl}/read-462749.html`,
    find: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=dushi&size=-1&isFinish=-1&updT=-1&orderBy=-1`,
  },

  async search(key, page) {
    try {
      const searchUrl = resolveUrl(baseUrl, `/search.html?searchword=${encodeURIComponent(key)}&page=${page}`)
      const $tempContainer = await fetchPage(searchUrl, 0)
      return JSON.stringify(parseSearchBooks($tempContainer))
    }
    catch (e) {
      flutterBridge.log(`搜索错误: ${e.message}`)
      return '[]'
    }
  },

  async info(bookUrl) {
    try {
      const $tempContainer = await fetchPage(bookUrl, 1)

      const name = $tempContainer.find('.book_name').text().trim()
      const author = $tempContainer.find('.book_title .author').text().replace(/^作者[：:]/, '').trim()
      const intro = $tempContainer.find('.jianjieneirong').text().trim()
      const coverUrl = resolveUrl(baseUrl, $tempContainer.find('.book_info_top_l > img').attr('src'))

      let kind = ''
      let wordCount = ''
      $tempContainer.findAll('.zuopinxinxi .xinxi_content li').forEach(($li) => {
        const text = $li.text().trim()
        if (text.startsWith('作品分类'))
          kind = text.replace(/^作品分类[：:]/, '').trim()
        if (text.startsWith('总字数'))
          wordCount = text.replace(/^总字数[：:]/, '').trim()
      })

      const tocLink = $tempContainer.find('.xiaoshuomulu a').attr('href')
      const tocUrl = resolveUrl(baseUrl, tocLink) || resolveTocUrl(bookUrl)
      const latestChapterTitle = $tempContainer.find('.new_zhangjie1 .dt_l a').text().trim()

      const book: Book = {
        bookUrl,
        name,
        author,
        kind,
        coverUrl,
        intro,
        tocUrl,
        wordCount,
        type: '0',
        latestChapterTitle,
      }

      return JSON.stringify(book)
    }
    catch (e) {
      flutterBridge.log(`获取书籍信息错误: ${e.message}`)
      return '{}'
    }
  },

  async chapter(tocUrl) {
    try {
      const $tempContainer = await fetchPage(tocUrl, 2)
      const $chapterLinks = $tempContainer.findAll('.section_list a[href^="read-"]')
      return JSON.stringify(parseChapters(baseUrl, $chapterLinks))
    }
    catch (e) {
      flutterBridge.log(`获取章节目录错误: ${e.message}`)
      return '[]'
    }
  },

  async content(url) {
    try {
      const readRes = await http.get(url)
      const $tempContainer = parsePage(readRes.data, 3)

      // 正文页通过 _getcontent.php 动态返回内容，需先从 read 页提取 token
      const chapterId = readRes.data.match(/ajaxGetContent\("?(\d+)"?\)/)?.[1] || url.match(/read-(\d+)\.html/i)?.[1] || ''
      const token = readRes.data.match(/_getcontent\.php\?id="\+chapid\+"&v=([\w-]+)/)?.[1]

      if (chapterId && token) {
        const apiUrl = resolveUrl(baseUrl, `/_getcontent.php?id=${chapterId}&v=${encodeURIComponent(token)}`)
        const contentRes = await http.get(apiUrl, { headers: { Referer: url } })
        const $content = parsePage(contentRes.data)
        const parsed = extractContent($content, { sanitize: true }).replace(/^aabook_readfile\s*/i, '').trim()
        if (parsed)
          return parsed
      }

      const fallback = extractContent($tempContainer.find('#chapter_content'), { sanitize: true }).trim()
      if (fallback.includes('内容读取中'))
        return ''
      return fallback
    }
    catch (e) {
      flutterBridge.log(`获取章节内容错误: ${e.message}`)
      return ''
    }
  },

  async getfinds() {
    const finds: Find[] = [
      { title: '分类', url: '' },
      { title: '穿越', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=chuanyue&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '异能', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=yineng&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '言情', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=yanqing&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '玄幻', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=xuanhuan&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '校园', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=xiaoyuan&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '仙侠', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=xianxia&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '乡土', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=xiangtu&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '武侠', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=wuxia&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '网游', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=wangyou&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '同人', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=tongren&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '女尊', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=nvzun&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '历史', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=lishi&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '惊悚', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=jingsong&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '古典', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=gudian&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '官场', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=guanchang&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '都市', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=dushi&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '单篇', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=danpian&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '耽美', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=danmei&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
      { title: '职场', url: `${baseUrl}/category.html?pageNum={{page}}&pageSize=30&catId=zhichang&size=-1&isFinish=-1&updT=-1&orderBy=-1`, type: 0 },
    ]
    return JSON.stringify(finds)
  },

  async find(url, page) {
    try {
      const finalUrl = replacePlaceholders(url, { page })
      const $tempContainer = await fetchPage(finalUrl)
      return JSON.stringify(parseFindBooks($tempContainer))
    }
    catch (e) {
      flutterBridge.log(`获取发现页错误: ${e.message}`)
      return '[]'
    }
  },
})
