import { beforeEach, describe, expect, it } from 'vitest'
import source from '../sources/po18x'
import { expectValidBooks, expectValidChapters, getSkipReason, loadFixture, mockHttpGet, mockHttpPost, setupGlobalMocks } from './setup'

const { id, testSeeds: seeds } = source
const skip = (name: string) => getSkipReason(seeds, id, name)

beforeEach(() => {
  setupGlobalMocks()
})

describe('po18x - search', () => {
  const reason = skip('search')
  it.skipIf(!!reason)(`解析搜索结果${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpPost(mocks, loadFixture(id, 'search'))
    expectValidBooks(await source.search('test', 1))
  })
})

describe('po18x - info', () => {
  const reason = skip('info')
  it.skipIf(!!reason)(`解析书籍详情${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'info'))
    const result = JSON.parse(await source.info(seeds!.info!))
    expect(result.name).toBeTruthy()
    expect(result.author).toBeTruthy()
    expect(result.tocUrl).toBeTruthy()
  })
})

describe('po18x - chapter', () => {
  const reason = skip('chapter')
  it.skipIf(!!reason)(`解析章节目录${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    // po18x 的 chapter 有分页，fixture 只录制了第一页，mock 第二次返回空（触发终止）
    mockHttpGet(mocks, loadFixture(id, 'chapter'), '<div class="page"></div>')
    expectValidChapters(await source.chapter(seeds!.chapter!))
  })
})

describe('po18x - content', () => {
  const reason = skip('content')
  it.skipIf(!!reason)(`提取正文内容${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'content'))
    const result = await source.content(seeds!.content!)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('po18x - find', () => {
  const reason = skip('find')
  it.skipIf(!!reason)(`解析发现页${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'find'))
    expectValidBooks(await source.find(seeds!.find!, 1))
  })
})
