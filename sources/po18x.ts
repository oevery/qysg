import type { Book, Chapter, Find } from '../utils/define'
import { defineSource } from '../utils/define'
import { fetchPage, parseChapters, parsePage, replacePlaceholders, resolveUrl } from '../utils/helpers'
import { extractContent } from '../utils/html'

const baseUrl = 'https://wap.po18x.vip'

export default defineSource({
  name: 'PO18脸红心跳',
  id: 'po18x',
  url: baseUrl,

  testSeeds: {
    search: {
      url: `${baseUrl}/s.php`,
      method: 'post',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 's={{key}}&type=articlename',
    },
    info: `${baseUrl}/book/123027/`,
    chapter: `${baseUrl}/123/123027/`,
    content: `${baseUrl}/123/123027/24648456.html`,
    find: `${baseUrl}/sort/1_{{page}}/`,
  },

  async search(key, page) {
    if (page > 1)
      return '[]'

    try {
      const searchUrl = resolveUrl(baseUrl, '/s.php')
      const gbkKey = await flutterBridge.utf8ToGbkUrlEncoded(key)
      const body = `s=${gbkKey}&type=articlename`
      const res = await http.post(searchUrl, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      })
      const $tempContainer = parsePage(res.data, 0)

      const books: Book[] = []
      const $items = $tempContainer.findAll('.searchresult .sone')

      $items.forEach(($item) => {
        const $link = $item.find('a[href*="/book/"]')
        const name = $link.text().replace(/^\[.*?\]\s*/, '').trim()
        const bookUrl = resolveUrl(baseUrl, $link.attr('href'))
        const author = $item.find('.author a').text()

        if (!name || !bookUrl)
          return

        books.push({
          bookUrl,
          name,
          author,
          kind: '',
          coverUrl: '',
          intro: '',
          tocUrl: bookUrl,
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

      const name = $tempContainer.find('.cataloginfo h3').text()
      const author = $tempContainer.find('.infotype a[href*="/author/"]').text()

      // 从 infotype 中提取类型
      const $infoPs = $tempContainer.findAll('.infotype p')
      let kind = ''
      let latestChapterTitle = ''
      $infoPs.forEach(($p) => {
        const text = $p.text()
        if (text.startsWith('类型'))
          kind = text.replace(/^类型[：:]/, '').trim()
        if (text.startsWith('最新章节'))
          latestChapterTitle = $p.find('a').text()
      })

      const coverUrl = $tempContainer.find('.infohead .pic img').attr('src')
      const intro = $tempContainer.find('.intro p').text()

      // 获取章节目录 URL
      const tocUrl = $tempContainer.find('.info_menu1 .gochapter a').attr('href')

      const book: Book = {
        bookUrl,
        name,
        author,
        kind,
        coverUrl: resolveUrl(baseUrl, coverUrl),
        intro,
        tocUrl: resolveUrl(baseUrl, tocUrl) || bookUrl,
        wordCount: '',
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
      const chapters: Chapter[] = []
      let currentUrl = tocUrl
      let pageIndex = 0

      // 遍历所有分页
      while (currentUrl) {
        const $tempContainer = await fetchPage(currentUrl, pageIndex === 0 ? 2 : undefined)

        const $chapterItems = $tempContainer.findAll('ul.chapters li a')
        chapters.push(...parseChapters(baseUrl, $chapterItems, chapters.length))

        // 查找下一页链接
        const $nextPage = $tempContainer.findAll('.page a')
        let nextUrl = ''
        $nextPage.forEach(($a) => {
          const text = $a.text()
          if (text.includes('下一页'))
            nextUrl = $a.attr('href')
        })

        if (nextUrl && resolveUrl(baseUrl, nextUrl) !== currentUrl) {
          currentUrl = resolveUrl(baseUrl, nextUrl)
          pageIndex++
        }
        else {
          break
        }
      }

      return JSON.stringify(chapters)
    }
    catch (e) {
      flutterBridge.log(`获取章节目录错误: ${e.message}`)
      return '[]'
    }
  },

  async content(url) {
    try {
      const $tempContainer = await fetchPage(url, 3)
      const content = extractContent($tempContainer.find('#novelcontent p'))
      return content
    }
    catch (e) {
      flutterBridge.log(`获取章节内容错误: ${e.message}`)
      return ''
    }
  },

  async getfinds() {
    const ranks: Find[] = [
      { title: '排行', url: '' },
      { title: '日点击榜', url: `${baseUrl}/top/dayvisit_{{page}}/`, type: 0 },
      { title: '周点击榜', url: `${baseUrl}/top/weekvisit_{{page}}/`, type: 0 },
      { title: '月点击榜', url: `${baseUrl}/top/monthvisit_{{page}}/`, type: 0 },
      { title: '总点击榜', url: `${baseUrl}/top/allvisit_{{page}}/`, type: 0 },
      { title: '总收藏榜', url: `${baseUrl}/top/goodnum_{{page}}/`, type: 0 },
      { title: '字数排行', url: `${baseUrl}/top/size_{{page}}/`, type: 0 },
      { title: '日推荐榜', url: `${baseUrl}/top/dayvote_{{page}}/`, type: 0 },
      { title: '周推荐榜', url: `${baseUrl}/top/weekvote_{{page}}/`, type: 0 },
      { title: '月推荐榜', url: `${baseUrl}/top/monthvote_{{page}}/`, type: 0 },
      { title: '总推荐榜', url: `${baseUrl}/top/allvote_{{page}}/`, type: 0 },
      { title: '最新入库', url: `${baseUrl}/top/postdate_{{page}}/`, type: 0 },
      { title: '最近更新', url: `${baseUrl}/top/lastupdate_{{page}}/`, type: 0 },
      { title: '完本', url: `${baseUrl}/full/{{page}}/`, type: 0 },
    ]
    const kinds: Find[] = [
      { title: '分类', url: '' },
      { title: '都市', url: `${baseUrl}/sort/1_{{page}}/`, type: 0 },
      { title: '浓情', url: `${baseUrl}/sort/2_{{page}}/`, type: 0 },
      { title: '言情', url: `${baseUrl}/sort/3_{{page}}/`, type: 0 },
      { title: '校园', url: `${baseUrl}/sort/4_{{page}}/`, type: 0 },
      { title: '武侠', url: `${baseUrl}/sort/5_{{page}}/`, type: 0 },
      { title: '玄幻', url: `${baseUrl}/sort/6_{{page}}/`, type: 0 },
      { title: '穿越', url: `${baseUrl}/sort/7_{{page}}/`, type: 0 },
      { title: '惊悚', url: `${baseUrl}/sort/8_{{page}}/`, type: 0 },
      { title: '悬疑', url: `${baseUrl}/sort/9_{{page}}/`, type: 0 },
      { title: '重生', url: `${baseUrl}/sort/10_{{page}}/`, type: 0 },
      { title: '历史', url: `${baseUrl}/sort/11_{{page}}/`, type: 0 },
      { title: '网游', url: `${baseUrl}/sort/12_{{page}}/`, type: 0 },
      { title: '科幻', url: `${baseUrl}/sort/13_{{page}}/`, type: 0 },
      { title: '耽美', url: `${baseUrl}/sort/14_{{page}}/`, type: 0 },
      { title: '高干', url: `${baseUrl}/sort/15_{{page}}/`, type: 0 },
      { title: '种田', url: `${baseUrl}/sort/16_{{page}}/`, type: 0 },
      { title: '百合', url: `${baseUrl}/sort/17_{{page}}/`, type: 0 },
      { title: '其他', url: `${baseUrl}/sort/18_{{page}}/`, type: 0 },
    ]
    return JSON.stringify([...ranks, ...kinds])
  },

  async find(url, page) {
    try {
      const finalUrl = replacePlaceholders(url, { page })
      const $tempContainer = await fetchPage(finalUrl)

      const books: Book[] = []

      if (url.includes('/sort/')) {
        const $bookItems = $tempContainer.findAll('.article')

        $bookItems.forEach(($item) => {
          const $titleLink = $item.find('.content h6 a, h6 a')
          const name = $titleLink.text().trim()
          const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

          if (!name || !bookUrl)
            return

          const author = $item.find('.author a').text()
          const coverUrl = $item.find('.pic img').attr('src')
          const intro = $item.find('.simple').text()

          books.push({
            bookUrl,
            name,
            author,
            kind: '',
            coverUrl: resolveUrl(baseUrl, coverUrl),
            intro,
            tocUrl: bookUrl,
            wordCount: '',
            type: '0',
            latestChapterTitle: '',
          })
        })
      }
      else {
        const $bookItems = $tempContainer.findAll('.articlegeneral')
        $bookItems.forEach(($item) => {
          const $titleLink = $item.find('.p2 a')
          const name = $titleLink.text()
          const bookUrl = resolveUrl(baseUrl, $titleLink.attr('href'))

          if (!name || !bookUrl)
            return

          const author = $item.find('.p3 a').text()
          const kind = $item.find('.p1').text().replace(/\[\]/g, '').trim()

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
            latestChapterTitle: '',
          })
        })
      }

      return JSON.stringify(books)
    }
    catch (e) {
      flutterBridge.log(`获取发现页错误: ${e.message}`)
      return '[]'
    }
  },
})
