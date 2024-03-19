import { test, after } from 'node:test'
import * as assert from 'node:assert'
import { getTempDir } from './helper'
import DotEnvTool from '../src/DotenvTool'
import { join } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { EOL } from 'node:os'

test('should delete a key/value', async (t) => {
  const dir = await getTempDir(after)
  const template = `MY_KEY=my-value
FOO=bar
THIRD_KEY=third-value`
  await writeFile(join(dir, '.env'), template)

  const tool = new DotEnvTool({
    path: join(dir, '.env')
  })

  await tool.load()

  tool.deleteKey('FOO')
  assert.equal(tool.getKey('FOO'), null)
  assert.equal(tool.nextLine, 3)
  await tool.save()

  const newFileContents = await readFile(join(dir, '.env'), 'utf-8')
  assert.equal(newFileContents, `MY_KEY=my-value${EOL}THIRD_KEY=third-value`)
})
