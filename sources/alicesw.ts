import type { Book, Chapter, Find } from '../utils/define'
import { defineSource } from '../utils/define'
import { extractContent, q, sanitizeHtml } from '../utils/html'

const baseUrl = 'https://www.alicesw.com'
const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  'Referer': baseUrl,
}

export default defineSource({
  name: '爱丽丝书屋',
  id: 'alicesw',
  url: baseUrl,
  enabledLogin: true,

  async search(key, page) {
    try {
      const searchUrl = resolveUrl(baseUrl, `/search.html?q=${key}&f=_all&p=${page}`)
      const res = await http.Get(searchUrl, headers, true)
      flutterBridge.text(0, res.data)
      const $tempContainer = q(sanitizeHtml(res.data))

      const books: Book[] = []

      const $bookItems = $tempContainer.findAll('.list-group-item')

      $bookItems.forEach(($item) => {
        const $titleLink = $item.find('h5 a')

        const name = $titleLink.text().trim().replace(/^\d+\.\s*/, '')
        const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

        if (!name || !bookUrl)
          return

        const author = $item.find('a[href*=\'f=author\']').text()
        const intro = $item.find('.content-txt').text() || ''

        let tocUrl = ''
        const bookIdMatch = bookUrl.match(/\/novel\/(\d+)\.html/)
        if (bookIdMatch) {
          tocUrl = resolveUrl(baseUrl, `/other/chapters/id/${bookIdMatch[1]}.html`)
        }

        books.push({
          bookUrl,
          name,
          author,
          kind: '',
          coverUrl: '',
          intro,
          tocUrl: tocUrl || bookUrl,
          wordCount: '',
          type: '0',
          latestChapterTitle: '',
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
        name: $tempContainer.find('.novel_title').text(),
        author: $tempContainer.find('.novel_info a[href*=\'f=author\']').text(),
        kind: $tempContainer.find('.novel_info a[href*=\'/lists/\']').text(),
        coverUrl: '',
        intro: $tempContainer.find('.jianjie p').text(),
        tocUrl: '',
        wordCount: '',
        type: '0',
        latestChapterTitle: '',
      }

      let tocUrl = $tempContainer.find('a[href*=\'/other/chapters/id/\']').attr('href')
      if (!tocUrl) {
        const match = bookUrl.match(/\/novel\/(\d+)\.html/)
        if (match) {
          tocUrl = `/other/chapters/id/${match[1]}.html`
        }
      }
      book.tocUrl = resolveUrl(baseUrl, tocUrl) || bookUrl

      const $cover = $tempContainer.find('.box_intro img.lazyload_book_cover')
      const coverUrl = $cover.attr('src') || $cover.attr('data-src')
      book.coverUrl = resolveUrl(baseUrl, coverUrl)

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

      const $chapterItems = $tempContainer.findAll('.mulu_list a[href^=\'/book/\']')

      $chapterItems.forEach(($item, index) => {
        const title = $item.text().trim()
        const url = resolveUrl(baseUrl, $item.attr('href'))

        if (!title || !url)
          return

        chapters.push({
          name: title,
          chapterId: url,
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
      const content = extractContent($tempContainer.find('div.read-content, .j_readContent, .user_ad_content'))
      return content
    }
    catch (e) {
      flutterBridge.log(`获取章节内容错误: ${e.message}`)
      return ''
    }
  },

  async getfinds() {
    const ranks: Find[] = [
      { title: '排行榜', url: '' },
      { title: '本日排行', url: `${baseUrl}/all/order/hits_day+desc.html?page={{page}}`, type: 0 },
      { title: '本周排行', url: `${baseUrl}/all/order/hits_week+desc.html?page={{page}}`, type: 0 },
      { title: '本月排行', url: `${baseUrl}/all/order/hits_month+desc.html?page={{page}}`, type: 0 },
      { title: '总排行', url: `${baseUrl}/all/order/hits+desc.html?page={{page}}`, type: 0 },
    ]
    const kinds: Find[] = [
      { title: '分类', url: '' },
      { title: '科幻', url: `${baseUrl}/lists/71.html?page={{page}}`, type: 0 },
      { title: '校园', url: `${baseUrl}/lists/61.html?page={{page}}`, type: 0 },
      { title: '玄幻', url: `${baseUrl}/lists/62.html?page={{page}}`, type: 0 },
      { title: '乡村', url: `${baseUrl}/lists/63.html?page={{page}}`, type: 0 },
      { title: '都市', url: `${baseUrl}/lists/64.html?page={{page}}`, type: 0 },
      { title: '乱伦', url: `${baseUrl}/lists/65.html?page={{page}}`, type: 0 },
      { title: '历史', url: `${baseUrl}/lists/67.html?page={{page}}`, type: 0 },
      { title: '武侠', url: `${baseUrl}/lists/68.html?page={{page}}`, type: 0 },
      { title: '系统', url: `${baseUrl}/lists/69.html?page={{page}}`, type: 0 },
      { title: '明星', url: `${baseUrl}/lists/72.html?page={{page}}`, type: 0 },
      { title: '同人', url: `${baseUrl}/lists/73.html?page={{page}}`, type: 0 },
      { title: '强奸', url: `${baseUrl}/lists/74.html?page={{page}}`, type: 0 },
      { title: '奇幻', url: `${baseUrl}/lists/75.html?page={{page}}`, type: 0 },
      { title: '经典', url: `${baseUrl}/lists/79.html?page={{page}}`, type: 0 },
      { title: '穿越', url: `${baseUrl}/lists/70.html?page={{page}}`, type: 0 },
      { title: '凌辱', url: `${baseUrl}/lists/46.html?page={{page}}`, type: 0 },
      { title: '反差', url: `${baseUrl}/lists/22.html?page={{page}}`, type: 0 },
      { title: '堕落', url: `${baseUrl}/lists/18.html?page={{page}}`, type: 0 },
      { title: '纯爱', url: `${baseUrl}/lists/19.html?page={{page}}`, type: 0 },
      { title: '伪娘', url: `${baseUrl}/lists/52.html?page={{page}}`, type: 0 },
      { title: '萝莉', url: `${baseUrl}/lists/48.html?page={{page}}`, type: 0 },
      { title: '熟女', url: `${baseUrl}/lists/56.html?page={{page}}`, type: 0 },
      { title: '禁忌', url: `${baseUrl}/lists/51.html?page={{page}}`, type: 0 },
      { title: 'NTR', url: `${baseUrl}/lists/54.html?page={{page}}`, type: 0 },
      { title: '媚黑', url: `${baseUrl}/lists/53.html?page={{page}}`, type: 0 },
      { title: '绿帽', url: `${baseUrl}/lists/55.html?page={{page}}`, type: 0 },
      { title: '调教', url: `${baseUrl}/lists/58.html?page={{page}}`, type: 0 },
      { title: '女主', url: `${baseUrl}/lists/59.html?page={{page}}`, type: 0 },
      { title: '正太', url: `${baseUrl}/lists/50.html?page={{page}}`, type: 0 },
      { title: '下克上', url: `${baseUrl}/lists/43.html?page={{page}}`, type: 0 },
      { title: '百合', url: `${baseUrl}/lists/47.html?page={{page}}`, type: 0 },
      { title: '重口', url: `${baseUrl}/lists/21.html?page={{page}}`, type: 0 },
      { title: '其他', url: `${baseUrl}/lists/57.html?page={{page}}`, type: 0 },
    ]
    const finds = [...ranks, ...kinds]
    return JSON.stringify(finds)
  },

  async find(url, page) {
    try {
      // 替换{{page}}占位符为实际页码
      if (url.includes('{{page}}')) {
        url = url.replace('{{page}}', page.toString())
      }

      const res = await http.Get(url, headers, true)
      const $tempContainer = q(sanitizeHtml(res.data))

      const books: Book[] = []

      const $bookItems = $tempContainer.findAll('.rec_rullist ul')

      $bookItems.forEach(($item) => {
        const $titleLink = $item.find('li.two a')

        const name = $titleLink.text().trim()
        const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

        if (!name || !bookUrl)
          return

        const author = $item.find('li.four').text()
        const kind = $item.find('li.sev').text()
        const latestChapter = $item.find('li.three').text()

        books.push({
          bookUrl,
          name,
          author,
          kind,
          coverUrl: '',
          intro: '',
          tocUrl: bookUrl,
          wordCount: '',
          type: '0',
          latestChapterTitle: latestChapter,
        })
      })

      return JSON.stringify(books)
    }
    catch (e) {
      flutterBridge.log(`获取发现页错误: ${e.message}`)
      return '[]'
    }
  },

  async getloginurl() {
    const loginUrl = resolveUrl(baseUrl, '/login.html')
    try {
      const cookies = await cookie.get(baseUrl)
      if (cookies && cookies.length > 50) {
        return baseUrl
      }
      return loginUrl
    }
    catch {
      return loginUrl
    }
  },

  async login() {
    try {
      const res = await http.Get(baseUrl, headers, true)
      if (res.data.includes('退出登录') || res.data.includes('个人中心') || res.data.includes('user/user/logout')) {
        await cache.set('alicesw_login_status', 'true')
        await cache.set('alicesw_login_time', Date.now().toString())
        return true
      }
      return false
    }
    catch {
      return false
    }
  },
})
