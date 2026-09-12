/**
 * Explicit allowlist for booking data that may cross a customer/public
 * server-component boundary. Sensitive booking fields, including healthIntake,
 * are intentionally absent.
 */
export const CUSTOMER_BOOKING_PROJECTION = {
  columns: {
    id: true,
    token: true,
    customerName: true,
    date: true,
    startTime: true,
    endTime: true,
    status: true,
    zarinpalRefId: true,
    addonsPricePaid: true,
    groupToken: true,
    discountAmount: true,
  },
  with: {
    service: {
      columns: {
        nameFa: true,
        price: true,
      },
    },
    addons: {
      columns: {
        id: true,
        pricePaid: true,
      },
      with: {
        addon: {
          columns: {
            nameFa: true,
          },
        },
      },
    },
    discountCode: {
      columns: {
        code: true,
      },
    },
  },
} as const
