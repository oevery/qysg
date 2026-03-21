import type { Book, Chapter, Find } from '../utils/define'
import { defineSource } from '../utils/define'
import { extractContent, q, sanitizeHtml } from '../utils/html'

const baseUrl = 'https://www.69xku.com'
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  'Origin': baseUrl,
  'Referer': `${baseUrl}/`,
}

export default defineSource({
  name: '69库',
  id: '69xku',
  url: baseUrl,

  async search(key, page) {
    if (page > 1)
      return '[]'

    try {
      const searchUrl = resolveUrl(baseUrl, '/search/')
      const contentType = 'application/x-www-form-urlencoded'
      const searchHeaders = { ...headers, 'Content-Type': contentType }
      const body = `searchkey=${encodeURIComponent(key)}&action=login&searchtype=all&submit=`
      const res = await http.Post(searchUrl, searchHeaders, body, contentType, true)
      flutterBridge.text(0, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))

      if (res.data.includes('搜索间隔')) {
        flutterBridge.showToast('搜索间隔: 30 秒，请稍后再试')
        throw new Error('触发搜索间隔限制 (搜索间隔: 30 秒)')
      }

      const books: Book[] = []

      const $bookItems = $tempContainer.findAll('.bookbox')

      $bookItems.forEach(($item) => {
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
      return JSON.stringify(books)
    }
    catch (e) {
      flutterBridge.log(`搜索错误: ${e.message}`)
      return '[]'
    }
  },

  async info(bookUrl) {
    try {
      const res = await http.Get(bookUrl, headers, true)
      flutterBridge.text(1, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))

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
      const res = await http.Get(tocUrl, headers, true)
      flutterBridge.text(2, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))

      const chapters: Chapter[] = []
      const $chapterItems = $tempContainer.findAll('#list-chapterAll dd a')

      $chapterItems.forEach(($item, index) => {
        const title = $item.text()
        const chapterUrl = resolveUrl(baseUrl, $item.attr('href'))
        if (!title || !chapterUrl)
          return

        chapters.push({
          name: title,
          chapterId: chapterUrl,
          index,
          isPay: false,
          isVip: false,
          isVolume: false,
          tag: '',
        })
      })

      return JSON.stringify(chapters)
    }
    catch (e) {
      flutterBridge.log(`获取章节目录错误: ${e.message}`)
      return '[]'
    }
  },

  async content(url) {
    try {
      const res = await http.Get(url, headers, true)
      flutterBridge.text(3, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))
      const content = extractContent($tempContainer.find('#rtext'))
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
      // 替换{{page}}占位符为实际页码
      if (url.includes('{{page}}')) {
        url = url.replace('{{page}}', page.toString())
      }
      // 替换编码后的{{page}}占位符为实际页码
      if (url.includes('%7B%7Bpage%7D%7D')) {
        url = url.replace('%7B%7Bpage%7D%7D', page.toString())
      }

      const res = await http.Get(url, headers, true)

      flutterBridge.text(0, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))

      const books: Book[] = []

      const $bookItems = $tempContainer.findAll('.bookbox')

      $bookItems.forEach(($item) => {
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
      return JSON.stringify(books)
    }
    catch (e) {
      flutterBridge.log(`获取发现页错误: ${e.message}`)
      return '[]'
    }
  },
})
