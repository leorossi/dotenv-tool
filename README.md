# DotEnv Tool

A tool to manipulate `.env` files format.

## Create a `.env` file programmatically

```js
import DotEnvTool from 'dotenv-tool'

const tool = new DotEnvTool({
  path: '/path/to/your/.env'
})

tool.addComment('# The server url')
tool.addKey('SERVER_URL', 'http://0.0.0.0:3042')
tool.addBlankLine()
tool.addComment('# The database connection string')
tool.addKey('CONNECTION_STRING', 'sqlite://./db.sqlite')

await tool.save()
```

This will save `/path/to/your/.env` file like this

```
# The server url
SERVER_URL=http://0.0.0.0:3042

# The database connection string
CONNECTION_STRING=sqlite://./db.sqlite
```

## Load and manipulate an existing `.env` file

```js
import DotEnvTool from 'dotenv-tool'

const tool = new DotEnvTool({
  path: join(__dirname, 'fixtures', 'sample.env')
})
await tool.load()

tool.updateLine(3, { type: 'comment', value: '# a new comment' })

await tool.save()
```

## Get and set keys

```js
import DotEnvTool from 'dotenv-tool'

const tool = new DotEnvTool({
  path: join(__dirname, 'fixtures', 'sample.env')
})
await tool.load()

if (!tool.hasKey('SERVER_URL')) {
  tool.addKey('SERVER_URL', 'http://0.0.0.0:3042')

  if (process.env.IS_PROD) {
    tool.updateKey('SERVER_URL', 'http://production.app')
  }
}

await tool.save()
```

