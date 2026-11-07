/** Explicit unit conversions prevent confusing gross mm with section µm. */
export const micrometersToMillimeters = (value: number) => value / 1000
export const millimetersToMicrometers = (value: number) => value * 1000
export const minutesToHours = (value: number) => value / 60
export const hoursToMinutes = (value: number) => value * 60
export const degreesToRadians = (value: number) => value * Math.PI / 180
export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value))
export const average = (values: readonly number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
