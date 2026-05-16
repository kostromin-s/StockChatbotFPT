export async function generateCandlestickData(
  symbol = 'FPT',
  days = 365,
  basePrice = 124500
) {
  try {
    const now = Math.floor(Date.now() / 1000)

    const from =
      now - days * 24 * 60 * 60

    const url =
      `https://dchart-api.vndirect.com.vn/dchart/history` +
      `?resolution=D` +
      `&symbol=${symbol}` +
      `&from=${from}` +
      `&to=${now}`

    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const raw = await res.json()

    if (
      !raw ||
      raw.s !== 'ok' ||
      !Array.isArray(raw.t)
    ) {
      throw new Error('Invalid API response')
    }

    const result = []

    for (let i = 0; i < raw.t.length; i++) {
      const open = Number(raw.o?.[i])
      const high = Number(raw.h?.[i])
      const low = Number(raw.l?.[i])
      const close = Number(raw.c?.[i])
      const volume = Number(raw.v?.[i])

      // SKIP INVALID DATA
      if (
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close)
      ) {
        console.warn(
          'Skipped invalid candle:',
          i,
          raw.o?.[i],
          raw.h?.[i],
          raw.l?.[i],
          raw.c?.[i]
        )

        continue
      }

      result.push({
        time: raw.t[i],

        open: Math.round(open * 1000),

        high: Math.round(high * 1000),

        low: Math.round(low * 1000),

        close: Math.round(close * 1000),

        volume: Number.isFinite(volume)
          ? volume
          : 0,
      })
    }

    if (result.length < 2) {
      throw new Error(
        'Not enough valid candle data'
      )
    }

    return result
  } catch (err) {
    console.error('FPT API error:', err)

    // FALLBACK FAKE DATA
    const data = []

    let price = basePrice * 0.8

    const nowDate = new Date()

    for (let i = days; i >= 0; i--) {
      const date = new Date(nowDate)

      date.setDate(date.getDate() - i)

      // skip weekend
      if (
        date.getDay() === 0 ||
        date.getDay() === 6
      ) {
        continue
      }

      const volatility = 0.022
      const drift = 0.001

      const change =
        price *
        (
          drift +
          volatility *
            (Math.random() - 0.45)
        )

      const open = price

      const close = price + change

      const highExtra =
        Math.abs(change) *
        (0.3 + Math.random() * 0.7)

      const lowExtra =
        Math.abs(change) *
        (0.3 + Math.random() * 0.7)

      const high =
        Math.max(open, close) +
        highExtra

      const low =
        Math.min(open, close) -
        lowExtra

      data.push({
        time: Math.floor(
          date.getTime() / 1000
        ),

        open: Math.round(open),

        high: Math.round(high),

        low: Math.round(low),

        close: Math.round(close),

        volume: Math.floor(
          1_000_000 +
            Math.random() * 4_000_000
        ),
      })

      price = close
    }

    return data
  }
}

export function generateVolumeData(
  candleData
) {
  if (!Array.isArray(candleData)) {
    return []
  }

  return candleData
    .filter(
      (c) =>
        c &&
        Number.isFinite(c.open) &&
        Number.isFinite(c.close)
    )
    .map((c) => ({
      time: c.time,

      value: Number.isFinite(c.volume)
        ? c.volume
        : 0,

      color:
        c.close >= c.open
          ? 'rgba(0, 230, 118, 0.5)'
          : 'rgba(255, 61, 87, 0.5)',
    }))
}

export function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return '--'
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(1)}k`
  }

  return value.toLocaleString('vi-VN')
}

export function formatVND(value) {
  if (!Number.isFinite(value)) {
    return '--'
  }

  return new Intl.NumberFormat(
    'vi-VN',
    {
      style: 'currency',
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1,
    }
  ).format(value)
}