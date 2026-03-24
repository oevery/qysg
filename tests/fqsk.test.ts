import { beforeEach, describe, expect, it } from 'vitest'
import source from '../sources/fqsk'
import { expectValidBooks, expectValidChapters, getSkipReason, loadFixture, mockHttpGet, setupGlobalMocks } from './setup'

const { id, testSeeds: seeds } = source
const skip = (name: string) => getSkipReason(seeds, id, name)

beforeEach(() => {
  setupGlobalMocks()
})

describe('fqsk - search', () => {
  const reason = skip('search')
  it.skipIf(!!reason)(`解析搜索结果${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'search'))
    expectValidBooks(await source.search('test', 1))
  })
})

describe('fqsk - info', () => {
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

describe('fqsk - chapter', () => {
  const reason = skip('chapter')
  it.skipIf(!!reason)(`解析章节目录${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'chapter'))
    expectValidChapters(await source.chapter(seeds!.chapter!))
  })
})

describe('fqsk - content', () => {
  const reason = skip('content')
  it.skipIf(!!reason)(`提取正文内容${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    // fqsk 的 content 会先请求 read 页，再请求 _getcontent.php 获取正文
    mockHttpGet(mocks, loadFixture(id, 'content'), '<p>测试正文</p>')
    const result = await source.content(seeds!.content!)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('fqsk - find', () => {
  const reason = skip('find')
  it.skipIf(!!reason)(`解析发现页${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'find'))
    expectValidBooks(await source.find(seeds!.find!, 1))
  })
})
