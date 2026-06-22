export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startSmsWorker } = await import('@/lib/queue')
    startSmsWorker()
  }
}
