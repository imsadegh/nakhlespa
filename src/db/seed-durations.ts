import { eq } from 'drizzle-orm'
import { db } from '../lib/db'
import { addons, services } from './schema'
import { BATH_ADDON_DURATION_MINUTES, PACKAGE_DURATION_MINUTES } from './seed-durations-data'

async function seedDurations() {
  await db.transaction(async tx => {
    for (const [nameFa, durationMinutes] of Object.entries(PACKAGE_DURATION_MINUTES)) {
      const updated = await tx.update(services).set({ durationMinutes }).where(eq(services.nameFa, nameFa)).returning({ id: services.id })
      if (updated.length !== 1) throw new Error(`Expected one package named "${nameFa}", found ${updated.length}`)
    }

    const updatedBath = await tx.update(addons).set({ durationMinutes: BATH_ADDON_DURATION_MINUTES }).where(eq(addons.nameFa, 'حمام طهورا')).returning({ id: addons.id })
    if (updatedBath.length !== 1) throw new Error(`Expected one add-on named "حمام طهورا", found ${updatedBath.length}`)
  })
}

seedDurations().then(() => {
  console.log('Updated package and bath add-on durations')
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
