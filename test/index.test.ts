import { test, after } from 'node:test'
import * as assert from 'node:assert'
import { getTempDir } from './helper'
import DotEnvTool from '../src/DotenvTool'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

test('should write a .env file', async (t) => {
  const dir = await getTempDir(after)
  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })
  tool.addComment('This is a comment')
  tool.addBlankLine()
  tool.addComment('This is another comment')
  tool.addKey('MY_KEY', 'my-value')
  await tool.save()

  // read file and check contents
  const written = (await readFile(tool.path, 'utf-8')).split('\n')
  assert.equal(written.length, tool.nextLine - 1)
  assert.equal(written[0], '# This is a comment')
  assert.equal(written[1], '')
  assert.equal(written[2], '# This is another comment')
  assert.equal(written[3], 'MY_KEY=my-value')
})

test('should load a .env file', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
# this is a comment

FOO=bar
`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  assert.equal(tool.nextLine, 6)
  assert.deepEqual(tool.contents[0], { type: 'data', lineNumber: 1, multiline: false, data: { key: 'MY_KEY', value: 'my-value' } })
  assert.deepEqual(tool.contents[1], { type: 'comment', lineNumber: 2, value: '# this is a comment' })
  assert.deepEqual(tool.contents[2], { type: 'blank', lineNumber: 3 })
  assert.deepEqual(tool.contents[3], { type: 'data', lineNumber: 4, multiline: false, data: { key: 'FOO', value: 'bar' } })
  assert.deepEqual(tool.contents[4], { type: 'blank', lineNumber: 5 })
})
test('should write on another path', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
# this is a comment

FOO=bar
`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  const newFilePath = join(dir, '.env-new')
  await tool.save(newFilePath)

  const newDotEnvFileContents = await readFile(newFilePath, 'utf-8')

  assert.equal(newDotEnvFileContents, template)
})

test('should handle empty values', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
TO_BE_COMPLETED=`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  assert.equal(tool.getKey('TO_BE_COMPLETED'), '')
  assert.equal(tool.nextLine, 3)
})

test('hasKey', async (t) => {
  const tool = new DotEnvTool({
    path: join(__dirname, 'fixtures', 'sample.env')
  })
  await tool.load()

  assert.ok(tool.hasKey('SAMPLE_NUMBER'))
  assert.ok(!tool.hasKey('UNKNOWN_DATA'))
  assert.equal(tool.getKey('SAMPLE_NUMBER'), '123')
})

test('getKeys', async (t) => {
  {
    const tool = new DotEnvTool({
      path: join(__dirname, 'fixtures', 'sample.env')
    })
    await tool.load()

    assert.deepEqual(tool.getKeys(), ['FOO', 'SAMPLE_NUMBER', 'AFTER_A_BLANK_LINE'])
  }
  {
    // empty file
    const tool = new DotEnvTool({
      path: join(__dirname, 'fixtures', 'empty.env')
    })
    await tool.load()

    assert.deepEqual(tool.getKeys(), [])
  }
})
