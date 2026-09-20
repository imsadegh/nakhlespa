import { randomUUID } from 'node:crypto'
import { relations } from 'drizzle-orm'
import type { BookingCustomization } from '@/types'
import type { HealthIntake } from '@/lib/health-intake'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'

export const genderEnum = pgEnum('Gender', ['FEMALE', 'MALE'])
export const bookingStatusEnum = pgEnum('BookingStatus', [
  'PENDING_PAYMENT',
  'PAID',
  'CONFIRMED',
  'CANCELLED',
])
export const smsReminderStatusEnum = pgEnum('SmsReminderStatus', ['PENDING', 'SENDING', 'SENT', 'FAILED'])
export const discountTypeEnum = pgEnum('DiscountType', ['PERCENT', 'FIXED'])

export const Gender = { FEMALE: 'FEMALE', MALE: 'MALE' } as const
export const BookingStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const
export const SmsReminderStatus = { PENDING: 'PENDING', SENDING: 'SENDING', SENT: 'SENT', FAILED: 'FAILED' } as const
export const DiscountType = { PERCENT: 'PERCENT', FIXED: 'FIXED' } as const

export const services = pgTable(
  'services',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    nameFa: text('nameFa').notNull(),
    descriptionFa: text('descriptionFa'),
    durationMinutes: integer('durationMinutes').notNull(),
    price: integer('price').notNull(),
    color: text('color'),
    symbol: text('symbol'),
    tier: integer('tier'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [unique('services_nameFa_key').on(table.nameFa)],
)

export const addons = pgTable(
  'addons',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    nameFa: text('nameFa').notNull(),
    price: integer('price').notNull(),
    isActive: boolean('isActive').notNull().default(true),
    requiresTier: boolean('requiresTier').notNull().default(false),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [unique('addons_nameFa_key').on(table.nameFa)],
)

export const customizationOptions = pgTable(
  'customization_options',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    category: text('category').notNull(),
    code: text('code').notNull(),
    labelFa: text('labelFa').notNull(),
    descriptionFa: text('descriptionFa').notNull(),
    additionalPrice: integer('additionalPrice').notNull().default(0),
    requiresTier: integer('requiresTier'),
    isActive: boolean('isActive').notNull().default(true),
    sortOrder: integer('sortOrder').notNull().default(0),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [unique('customization_options_category_code_key').on(table.category, table.code)],
)

export const workingHours = pgTable(
  'working_hours',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    dayOfWeek: integer('dayOfWeek').notNull(),
    gender: genderEnum('gender').notNull(),
    openTime: text('openTime').notNull(),
    closeTime: text('closeTime').notNull(),
    isOpen: boolean('isOpen').notNull().default(true),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [unique('working_hours_dayOfWeek_gender_key').on(table.dayOfWeek, table.gender)],
)

export const blockedSlots = pgTable('blocked_slots', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  date: date('date', { mode: 'date' }).notNull(),
  startTime: text('startTime').notNull(),
  endTime: text('endTime').notNull(),
  reason: text('reason'),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
})

export const discountCodes = pgTable('discount_codes', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  code: text('code').notNull().unique(),
  type: discountTypeEnum('type').notNull(),
  value: integer('value').notNull(),
  maxUses: integer('maxUses'),
  usedCount: integer('usedCount').notNull().default(0),
  expiresAt: timestamp('expiresAt', { precision: 3 }),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
})

export const bookings = pgTable(
  'bookings',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    token: text('token').notNull().unique().$defaultFn(() => randomUUID()),
    bookingCode: text('bookingCode').notNull().unique().$defaultFn(() => `NS-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`),
    serviceId: text('serviceId').notNull().references(() => services.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    customerName: text('customerName').notNull(),
    customerPhone: text('customerPhone').notNull(),
    customerNotes: text('customerNotes'),
    date: date('date', { mode: 'date' }).notNull(),
    startTime: text('startTime').notNull(),
    endTime: text('endTime').notNull(),
    gender: genderEnum('gender').notNull(),
    status: bookingStatusEnum('status').notNull().default('PENDING_PAYMENT'),
    zarinpalAuthority: text('zarinpalAuthority'),
    zarinpalRefId: text('zarinpalRefId'),
    addonsPricePaid: integer('addonsPricePaid').notNull().default(0),
    groupToken: text('groupToken'),
    discountCodeId: text('discountCodeId').references(() => discountCodes.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    discountAmount: integer('discountAmount').notNull().default(0),
    customization: jsonb('customization').$type<BookingCustomization>(),
    healthIntake: jsonb('healthIntake').$type<HealthIntake>(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [
    index('bookings_date_idx').on(table.date),
    index('bookings_status_idx').on(table.status),
    index('bookings_serviceId_idx').on(table.serviceId),
    index('bookings_groupToken_idx').on(table.groupToken),
  ],
)

export const bookingAddons = pgTable(
  'booking_addons',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    bookingId: text('bookingId')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    addonId: text('addonId').notNull().references(() => addons.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    pricePaid: integer('pricePaid').notNull(),
  },
  table => [
    index('booking_addons_bookingId_idx').on(table.bookingId),
    index('booking_addons_addonId_idx').on(table.addonId),
    unique('booking_addons_bookingId_addonId_key').on(table.bookingId, table.addonId),
  ],
)

export const bookingCustomizations = pgTable(
  'booking_customizations',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    bookingId: text('bookingId')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    category: text('category').notNull(),
    optionId: text('optionId').references(() => customizationOptions.id, { onDelete: 'set null', onUpdate: 'cascade' }),
    codeSnapshot: text('codeSnapshot').notNull(),
    labelSnapshot: text('labelSnapshot').notNull(),
    pricePaid: integer('pricePaid').notNull().default(0),
  },
  table => [
    index('booking_customizations_bookingId_idx').on(table.bookingId),
    unique('booking_customizations_bookingId_category_key').on(table.bookingId, table.category),
  ],
)

export const smsReminders = pgTable(
  'sms_reminders',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    bookingId: text('bookingId')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    sendAt: timestamp('sendAt', { precision: 3 }).notNull(),
    status: smsReminderStatusEnum('status').notNull().default('PENDING'),
    sentAt: timestamp('sentAt', { precision: 3 }),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [index('sms_reminders_status_sendAt_idx').on(table.status, table.sendAt)],
)

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { precision: 3 }),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { precision: 3 }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
  createdAt: timestamp('createdAt', { precision: 3 }),
  updatedAt: timestamp('updatedAt', { precision: 3 }),
})

export const customerSessions = pgTable(
  'customer_sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    phone: text('phone').notNull(),
    sessionToken: text('sessionToken').notNull().unique().$defaultFn(() => randomUUID()),
    expiresAt: timestamp('expiresAt', { precision: 3 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  },
  table => [index('customer_sessions_phone_idx').on(table.phone)],
)

export const servicesRelations = relations(services, ({ many }) => ({ bookings: many(bookings) }))
export const addonsRelations = relations(addons, ({ many }) => ({ bookingAddons: many(bookingAddons) }))
export const customizationOptionsRelations = relations(customizationOptions, ({ many }) => ({ bookingCustomizations: many(bookingCustomizations) }))
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  discountCode: one(discountCodes, { fields: [bookings.discountCodeId], references: [discountCodes.id] }),
  addons: many(bookingAddons),
  customizations: many(bookingCustomizations),
  smsReminders: many(smsReminders),
}))
export const bookingAddonsRelations = relations(bookingAddons, ({ one }) => ({
  booking: one(bookings, { fields: [bookingAddons.bookingId], references: [bookings.id] }),
  addon: one(addons, { fields: [bookingAddons.addonId], references: [addons.id] }),
}))
export const bookingCustomizationsRelations = relations(bookingCustomizations, ({ one }) => ({
  booking: one(bookings, { fields: [bookingCustomizations.bookingId], references: [bookings.id] }),
  option: one(customizationOptions, { fields: [bookingCustomizations.optionId], references: [customizationOptions.id] }),
}))
export const smsRemindersRelations = relations(smsReminders, ({ one }) => ({
  booking: one(bookings, { fields: [smsReminders.bookingId], references: [bookings.id] }),
}))
export const userRelations = relations(user, ({ many }) => ({ sessions: many(session), accounts: many(account) }))
export const sessionRelations = relations(session, ({ one }) => ({ user: one(user, { fields: [session.userId], references: [user.id] }) }))
export const accountRelations = relations(account, ({ one }) => ({ user: one(user, { fields: [account.userId], references: [user.id] }) }))
export const discountCodesRelations = relations(discountCodes, ({ many }) => ({ bookings: many(bookings) }))

export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type Addon = typeof addons.$inferSelect
export type NewAddon = typeof addons.$inferInsert
export type CustomizationOptionRow = typeof customizationOptions.$inferSelect
export type NewCustomizationOption = typeof customizationOptions.$inferInsert
export type WorkingHours = typeof workingHours.$inferSelect
export type NewWorkingHours = typeof workingHours.$inferInsert
export type BlockedSlot = typeof blockedSlots.$inferSelect
export type NewBlockedSlot = typeof blockedSlots.$inferInsert
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type BookingAddon = typeof bookingAddons.$inferSelect
export type NewBookingAddon = typeof bookingAddons.$inferInsert
export type BookingCustomizationRow = typeof bookingCustomizations.$inferSelect
export type NewBookingCustomization = typeof bookingCustomizations.$inferInsert
export type SmsReminder = typeof smsReminders.$inferSelect
export type NewSmsReminder = typeof smsReminders.$inferInsert
export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Account = typeof account.$inferSelect
export type Verification = typeof verification.$inferSelect
export type CustomerSession = typeof customerSessions.$inferSelect
export type NewCustomerSession = typeof customerSessions.$inferInsert
export type DiscountCode = typeof discountCodes.$inferSelect
export type NewDiscountCode = typeof discountCodes.$inferInsert

export type GenderValue = (typeof Gender)[keyof typeof Gender]
export type BookingStatusValue = (typeof BookingStatus)[keyof typeof BookingStatus]
export type SmsReminderStatusValue = (typeof SmsReminderStatus)[keyof typeof SmsReminderStatus]
export type DiscountTypeValue = (typeof DiscountType)[keyof typeof DiscountType]
export type Gender = GenderValue
export type BookingStatus = BookingStatusValue
