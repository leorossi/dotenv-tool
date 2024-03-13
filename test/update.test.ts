import { test, after } from 'node:test'
import * as assert from 'node:assert'
import { getTempDir } from './helper'
import DotEnvTool from '../src/DotenvTool'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

test('should update a key/value', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
FOO=bar`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  tool.updateKey('FOO', 'foobar')
  assert.ok(tool.getKey('FOO'), 'foobar')
})

test('should update an env file', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
FOO=bar`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  tool.addBlankLine()
  tool.addComment('# The server host')
  tool.addKey('SERVER_URL', 'http://0.0.0.0:3042')

  await tool.save()
  const newContents = await readFile(join(dir, '.env'), 'utf-8')

  const expected = `MY_KEY=my-value
FOO=bar

# The server host
SERVER_URL=http://0.0.0.0:3042`
  assert.equal(newContents, expected)
})

test('should update a single line', async (t) => {
  const dir = await getTempDir(after)
  const tool = new DotEnvTool({
    path: join(__dirname, 'fixtures', 'sample.env')
  })
  await tool.load()

  tool.updateLine(3, { type: 'comment', value: '# a new comment' })

  await tool.save(join(dir, '.env'))
  const newContents = await readFile(join(dir, '.env'), 'utf-8')
  const expected = `# This is a fixture for dotenv-tool package
FOO=bar
# a new comment

AFTER_A_BLANK_LINE=true`
  assert.equal(newContents, expected)
})
