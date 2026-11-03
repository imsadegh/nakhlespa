const tehranClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function tehranDateTime(now: Date) {
  const parts = Object.fromEntries(tehranClock.formatToParts(now).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

export function getTehranDate(now = new Date()): string {
  return tehranDateTime(now).split('T')[0]
}

export function isSlotPast(date: string, startTime: string, now = new Date()): boolean {
  return `${date}T${startTime}` <= tehranDateTime(now)
}
