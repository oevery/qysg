import { beforeEach, describe, expect, it } from 'vitest'
import source from '../sources/69xku'
import { expectValidBooks, expectValidChapters, getSkipReason, loadFixture, mockHttpGet, mockHttpPost, setupGlobalMocks } from './setup'

const { id, testSeeds: seeds } = source
const skip = (name: string) => getSkipReason(seeds, id, name)

beforeEach(() => {
  setupGlobalMocks()
})

describe('69xku - search', () => {
  const reason = skip('search')
  it.skipIf(!!reason)(`解析搜索结果${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpPost(mocks, loadFixture(id, 'search'))
    expectValidBooks(await source.search('test', 1))
  })
})

describe('69xku - info', () => {
  const reason = skip('info')
  it.skipIf(!!reason)(`解析书籍详情${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'info'))
    const result = JSON.parse(await source.info(seeds!.info!))
    expect(result.name).toBeTruthy()
    expect(result.author).toBeTruthy()
  })
})

describe('69xku - chapter', () => {
  const reason = skip('chapter')
  it.skipIf(!!reason)(`解析章节目录${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'chapter'))
    expectValidChapters(await source.chapter(seeds!.chapter!))
  })
})

describe('69xku - content', () => {
  const reason = skip('content')
  it.skipIf(!!reason)(`提取正文内容${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'content'))
    const result = await source.content(seeds!.content!)
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('69xku - find', () => {
  const reason = skip('find')
  it.skipIf(!!reason)(`解析发现页${reason ? ` (${reason})` : ''}`, async () => {
    const mocks = setupGlobalMocks()
    mockHttpGet(mocks, loadFixture(id, 'find'))
    expectValidBooks(await source.find(seeds!.find!, 1))
  })
})
