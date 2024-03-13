import { test, after } from 'node:test'
import * as assert from 'node:assert'
import { getTempDir } from './helper'
import DotEnvTool from '../src/DotenvTool'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

test('should support parsing multiline values', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
FOO="""
This is a multiline
Value
That should be kept
"""`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()
  assert.equal(tool.getKey('FOO'), `This is a multiline
Value
That should be kept`)

  await tool.save(join(dir, '.env.new'))

  // write a new file and check the template is the smae
  const newContents = await readFile(join(dir, '.env.new'), 'utf-8')
  assert.equal(newContents, template)
})

test('should add a multline data line programmatically', async (t) => {
  const dir = await getTempDir(after)
  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })
  tool.addKey('MY_KEY', 'my-value', true)
  await tool.save()

  // read file and check contents
  const written = await readFile(tool.path, 'utf-8')
  const writtenLines = written.split('\n')
  assert.equal(writtenLines.length, 3)
  assert.equal(written, 'MY_KEY="""\nmy-value\n"""')
})
