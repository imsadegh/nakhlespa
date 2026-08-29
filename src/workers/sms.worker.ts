import { startSmsWorker } from '@/lib/queue'

const worker = startSmsWorker()
let closing = false

async function shutdown(signal: string) {
  if (closing) return
  closing = true
  console.log(`Stopping SMS worker after ${signal}`)
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))
