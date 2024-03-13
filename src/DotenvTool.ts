import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface BaseLine {
  type: string
  lineNumber: number
}
interface CommentLine extends BaseLine {
  type: 'comment'
  value: string
}
type DataLineValue = string | number | null
interface DataLine extends BaseLine {
  type: 'data'
  multiline: boolean
  data: {
    key: string
    value: DataLineValue
  }
}

interface BlankLine extends BaseLine {
  type: 'blank'
}

type Line = CommentLine | DataLine | BlankLine

type NewLine = Omit<CommentLine, 'lineNumber'> | Omit<DataLine, 'lineNumber'> | Omit<BlankLine, 'lineNumber'>
interface DotEnvToolOptions {
  path: string
}
export default class DotEnvTool {
  path: string
  contents: Line[]
  nextLine: number
  constructor (opts: DotEnvToolOptions) {
    this.path = opts.path ?? join(process.cwd(), '.env')
    this.contents = []
    this.nextLine = 1
  }

  async load (): Promise<void> {
    await this.parse()
  }

  private async parse (): Promise<void> {
    const data = await readFile(this.path, 'utf-8')
    const lines = data.split('\n')
    let isParsingMultiline = false
    let multilineKey: string | null = null
    const multiline: string[] = []
    lines.forEach((line) => {
      let newLine: Line = { type: 'blank', lineNumber: this.nextLine }
      if (isParsingMultiline) {
        if (line === '"""') {
          // closing multiline
          newLine = {
            type: 'data',
            lineNumber: this.nextLine,
            multiline: true,
            data: {
              key: multilineKey as string,
              value: multiline.join('\n')
            }
          }
          multilineKey = null
          isParsingMultiline = false
        } else {
          multiline.push(line)
        }
      } else if (line.match(/^[a-zA-Z_]+[a-zA-Z0-9_]*/) != null) { // starts with a variable name, it's data
        const [key, value] = line.split('=')
        if (value === '"""') {
          // multiline data parsing starts
          isParsingMultiline = true
          multilineKey = key
        } else {
          newLine = {
            type: 'data',
            multiline: false,
            lineNumber: this.nextLine,
            data: { key, value }
          }
        }
      } else if (line.match(/^#/) != null) { // starts with #, it's a comment
        newLine = {
          type: 'comment',
          lineNumber: this.nextLine,
          value: line
        }
      } else if (line.trim().length === 0) {
        newLine = {
          type: 'blank',
          lineNumber: this.nextLine
        }
      } else {
        throw new Error(`Cannot parse line ${this.nextLine}: "${line}"`)
      }
      if (!isParsingMultiline) {
        this.nextLine++
        this.contents.push(newLine)
      }
    })
  }

  addBlankLine (): void {
    this.contents.push({
      type: 'blank',
      lineNumber: this.nextLine++
    })
  }

  addComment (value: string): void {
    if (!value.startsWith('#')) {
      value = `# ${value}`
    }
    this.contents.push({
      type: 'comment',
      lineNumber: this.nextLine++,
      value
    })
  }

  addKey (key: string, value: string, multiline?: boolean): void {
    this.contents.push({
      type: 'data',
      multiline: multiline ?? false,
      lineNumber: this.nextLine++,
      data: { key, value }
    })
  }

  getKeys (): string[] {
    const output: string[] = []
    this.contents
      .forEach((line) => {
        if (line.type === 'data') {
          output.push(line.data.key)
        }
      })
    return output
  }

  getKey (key: string): DataLineValue {
    const dataLine = this.findKey(key)
    if (dataLine != null) {
      return dataLine.data.value
    }
    return null
  }

  hasKey (key: string): boolean {
    const dataLine = this.findKey(key)
    return dataLine !== undefined
  }

  updateKey (key: string, newValue: string): void {
    const dataLine = this.findKey(key)
    if (dataLine != null) {
      dataLine.data.value = newValue
    }
  }

  private findKey (key: string): DataLine | undefined {
    const theKey = this.contents.find((line) => {
      return line.type === 'data' && line.data.key === key
    }) as DataLine | undefined
    return theKey
  }

  updateLine (lineNumber: number, newLine: NewLine): void {
    if (lineNumber > this.contents.length) {
      throw new Error(`Trying to update line ${lineNumber}, but the file has only ${this.contents.length} lines.`)
    }
    this.contents[lineNumber - 1] = { ...newLine, lineNumber }
  }

  async save (newPath?: string): Promise<void> {
    // get array of strings
    const arr = new Array(this.nextLine - 1)
    for (const line of this.contents) {
      switch (line.type) {
        case 'comment':
          arr[line.lineNumber - 1] = line.value
          break
        case 'blank':
          arr[line.lineNumber - 1] = ''
          break
        case 'data':
          if (line.data.value !== null) {
            const value = (line.multiline ? `"""\n${line.data.value}\n"""` : line.data.value)
            arr[line.lineNumber - 1] = `${line.data.key}=${value}`
          } else {
            arr[line.lineNumber - 1] = `${line.data.key}=`
          }

          break
      }
    }
    const path = newPath ?? this.path
    await writeFile(path, arr.join('\n'))
  }
}
