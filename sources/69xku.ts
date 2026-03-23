import type { Book, Find } from '../utils/define'
import type { q } from '../utils/html'
import { defineSource } from '../utils/define'
import { fetchPage, parseChapters, parsePage, replacePlaceholders } from '../utils/helpers'
import { extractContent } from '../utils/html'

const baseUrl = 'https://www.69xku.com'

function parseBooks($container: ReturnType<typeof q>): Book[] {
  const books: Book[] = []
  $container.findAll('.bookbox').forEach(($item) => {
    const $titleLink = $item.find('.bookname a')
    const name = $titleLink.text()
    const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))
    if (!name || !bookUrl)
      return
    books.push({
      bookUrl,
      name,
      author: $item.find('.author').text().replace(/作者：/, ''),
      kind: '',
      coverUrl: '',
      intro: '',
      tocUrl: bookUrl,
      wordCount: '',
      type: '0',
      latestChapterTitle: $item.find('.cat a').text(),
    })
  })
  return books
}

export default defineSource({
  name: '69库',
  id: '69xku',
  url: baseUrl,

  testSeeds: {
    search: {
      url: `${baseUrl}/search/`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'searchkey={{key}}&action=login&searchtype=all&submit=',
    },
    info: `${baseUrl}/book/3571/`,
    chapter: `${baseUrl}/book/3571/`,
    content: `${baseUrl}/book/3571/599078.html`,
    find: `${baseUrl}/sort/1/{{page}}/`,
  },

  async search(key, page) {
    if (page > 1)
      return '[]'

    try {
      const searchUrl = resolveUrl(baseUrl, '/search/')
      const contentType = 'application/x-www-form-urlencoded'
      const body = `searchkey=${key}&action=login&searchtype=all&submit=`
      const res = await http.post(searchUrl, { headers: { 'Content-Type': contentType }, body })
      const $tempContainer = parsePage(res.data, 0)

      if (res.data.includes('搜索间隔')) {
        flutterBridge.showToast('搜索间隔: 30 秒，请稍后再试')
        throw new Error('触发搜索间隔限制 (搜索间隔: 30 秒)')
      }

      return JSON.stringify(parseBooks($tempContainer))
    }
    catch (e) {
      flutterBridge.log(`搜索错误: ${e.message}`)
      return '[]'
    }
  },

  async info(bookUrl) {
    try {
      const $tempContainer = await fetchPage(bookUrl, 1)

      const book: Book = {
        bookUrl,
        name: $tempContainer.find('meta[property="og:novel:book_name"]').attr('content'),
        author: $tempContainer.find('meta[property="og:novel:author"]').attr('content'),
        kind: $tempContainer.find('meta[property="og:novel:category"]').attr('content'),
        coverUrl: $tempContainer.find('.bookcover .thumbnail').attr('src'),
        intro: $tempContainer.find('.bookinfo .bookintro').text(),
        tocUrl: bookUrl,
        wordCount: '',
        type: '0',
        latestChapterTitle: $tempContainer.find('meta[property="og:novel:lastest_chapter_name"]').attr('content'),
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
      const $chapterItems = $tempContainer.findAll('#list-chapterAll dd a')
      return JSON.stringify(parseChapters(baseUrl, $chapterItems))
    }
    catch (e) {
      flutterBridge.log(`获取章节目录错误: ${e.message}`)
      return '[]'
    }
  },

  async content(url) {
    try {
      const $tempContainer = await fetchPage(url, 3)
      const content = extractContent($tempContainer.find('#rtext'), { sanitize: true })
      return content
    }
    catch (e) {
      flutterBridge.log(`获取章节内容错误: ${e.message}`)
      return ''
    }
  },

  async getfinds() {
    const kinds: Find[] = [
      { title: '分类（全部）', url: '' },
      { title: '玄幻奇幻', url: `${baseUrl}/sort/1/{{page}}/`, type: 0 },
      { title: '武侠仙侠', url: `${baseUrl}/sort/2/{{page}}/`, type: 0 },
      { title: '都市青春', url: `${baseUrl}/sort/3/{{page}}/`, type: 0 },
      { title: '科幻悬疑', url: `${baseUrl}/sort/4/{{page}}/`, type: 0 },
      { title: '穿越历史', url: `${baseUrl}/sort/5/{{page}}/`, type: 0 },
      { title: '耽美纯情', url: `${baseUrl}/sort/6/{{page}}/`, type: 0 },
      { title: '游戏竞技', url: `${baseUrl}/sort/7/{{page}}/`, type: 0 },
      { title: '精品其他', url: `${baseUrl}/sort/8/{{page}}/`, type: 0 },
      { title: '午夜', url: `${baseUrl}/sort/9/{{page}}/`, type: 0 },
    ]

    const kindsWanJie: Find[] = [
      { title: '分类（完结）', url: '' },
      { title: '玄幻奇幻', url: `${baseUrl}/quanben/sort/1/{{page}}/`, type: 0 },
      { title: '武侠仙侠', url: `${baseUrl}/quanben/sort/2/{{page}}/`, type: 0 },
      { title: '都市青春', url: `${baseUrl}/quanben/sort/3/{{page}}/`, type: 0 },
      { title: '科幻悬疑', url: `${baseUrl}/quanben/sort/4/{{page}}/`, type: 0 },
      { title: '穿越历史', url: `${baseUrl}/quanben/sort/5/{{page}}/`, type: 0 },
      { title: '耽美纯情', url: `${baseUrl}/quanben/sort/6/{{page}}/`, type: 0 },
      { title: '游戏竞技', url: `${baseUrl}/quanben/sort/7/{{page}}/`, type: 0 },
      { title: '精品其他', url: `${baseUrl}/quanben/sort/8/{{page}}/`, type: 0 },
      { title: '午夜', url: `${baseUrl}/quanben/sort/9/{{page}}/`, type: 0 },
    ]

    const finds = [...kinds, ...kindsWanJie]
    return JSON.stringify(finds)
  },

  async find(url, page) {
    try {
      const finalUrl = replacePlaceholders(url, { page })
      const $tempContainer = await fetchPage(finalUrl, 0)

      return JSON.stringify(parseBooks($tempContainer))
    }
    catch (e) {
      flutterBridge.log(`获取发现页错误: ${e.message}`)
      return '[]'
    }
  },
})
