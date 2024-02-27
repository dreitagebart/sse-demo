import cors from 'cors'
import express, { Request, Response } from 'express'
import { Buffer } from 'buffer'
import { spawn } from 'child_process'

const app = express()

app.use(cors())

app.get('/', (req: Request, res: Response) => {
  res.json({ hello: 'world' })
})

app.get('/run', async (req: Request, res: Response) => {
  console.log(`start command: ${req.query.cmd}`)

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  }

  res.writeHead(200, headers)

  const command = String(req.query.cmd).split(' ')[0]!
  const options = String(req.query.cmd).split(' ').slice(1)

  const runningCommand = spawn(command, options)

  console.log(`PID ${runningCommand.pid}`)

  runningCommand.stdout.setEncoding('utf8')

  runningCommand.stdout.on('data', (stream: string | Buffer) => {
    console.log('a', JSON.stringify(stream))

    let out: string | Buffer = stream
    const time = new Date().getTime()

    if (Buffer.isBuffer(stream)) {
      out = Buffer.from(stream).toString()
    }

    res.write(`id: ${time}\n`)
    res.write(`event: stdout\n`)
    res.write(
      `data: ${JSON.stringify({
        type: 'stdout',
        out,
        time
      })}\n\n`
    )
  })

  runningCommand.stderr.on('data', (stream: string | Buffer) => {
    let out: string | Buffer = stream
    const time = new Date().getTime()

    if (Buffer.isBuffer(stream)) {
      out = Buffer.from(stream).toString()
    }

    res.write(`id: ${time}\n`)
    res.write(`event: stderr\n`)
    res.write(
      `data: ${JSON.stringify({
        type: 'stderr',
        out,
        time
      })}\n\n`
    )
  })

  runningCommand.once('error', (error: string) => {
    console.error(`Error executing command: ${error}`)

    res.write(`event: err\n`)
    res.write(`data: ${JSON.stringify({ type: 'error', out: error })}\n\n`)
    res.emit('close')
    res.end()
  })

  runningCommand.once('exit', (exitCode: string) => {
    console.error(`Command exited: ${exitCode}`)

    res.write(`event: exit\n`)
    res.write(`data: exited`)
    res.end()
  })

  req.on('close', () => {
    console.log(`${req.socket.remotePort} connection closed...`)

    runningCommand.kill()
  })
})

app.listen(4000, () => {
  console.log('🚀 server started on http://localhost:4000')
})
