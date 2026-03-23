import type { Book, Find } from '../utils/define'
import { defineSource } from '../utils/define'
import { fetchPage, parseChapters, replacePlaceholders, resolveUrl } from '../utils/helpers'
import { extractContent } from '../utils/html'

const baseUrl = 'https://www.alicesw.com'

export default defineSource({
  name: '爱丽丝书屋',
  id: 'alicesw',
  url: baseUrl,
  enabledLogin: true,

  testSeeds: {
    search: { url: `${baseUrl}/search.html?q={{key}}&f=_all&p={{page}}` },
    info: `${baseUrl}/novel/49989.html`,
    chapter: `${baseUrl}/other/chapters/id/49989.html`,
    content: `${baseUrl}/book/51226/7c7c49563a3ec.html`,
    find: `${baseUrl}/other/rank_hits/order/hits_day.html`,
  },

  async search(key, page) {
    try {
      const searchUrl = resolveUrl(baseUrl, `/search.html?q=${key}&f=_all&p=${page}`)
      const $tempContainer = await fetchPage(searchUrl, 0)

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
      const $tempContainer = await fetchPage(bookUrl, 1)
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
      const $tempContainer = await fetchPage(tocUrl, 2)
      const $chapterItems = $tempContainer.findAll('.mulu_list a[href^=\'/book/\']')
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
      { title: '本日排行', url: `${baseUrl}/other/rank_hits/order/hits_day.html`, type: 0 },
      { title: '本周排行', url: `${baseUrl}/other/rank_hits/order/hits_week.html`, type: 0 },
      { title: '本月排行', url: `${baseUrl}/other/rank_hits/order/hits_month.html`, type: 0 },
      { title: '总排行', url: `${baseUrl}/other/rank_hits/order/hits.html`, type: 0 },
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
      const finalUrl = replacePlaceholders(url, { page })
      const $tempContainer = await fetchPage(finalUrl, 0)

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
      const res = await http.get(baseUrl)
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
