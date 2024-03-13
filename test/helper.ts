import { mkdir, rm } from 'node:fs/promises'
import { after } from 'node:test'
import { join } from 'node:path'

let tempDirCounter = 0
export async function getTempDir (afterFn?: typeof after): Promise<string> {
  const tempDir = `dotenv-tool-test-${process.pid}-${tempDirCounter++}`
  const fullTempDirPath = join(__dirname, 'tmp', tempDir)
  try {
    await mkdir(fullTempDirPath)
  } catch (err) {
    // do nothing
  }

  if (afterFn && !process.env.SKIP_RM_TMP) {
    afterFn(async () => {
      await rm(fullTempDirPath, { recursive: true })
    })
  }
  return fullTempDirPath
}
