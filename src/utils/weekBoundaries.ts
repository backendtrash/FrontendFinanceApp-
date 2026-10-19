/**
 * Calculates week boundaries for a given month
 * respecting the user's preferred week start day.
 *
 * Returns array of { weekNumber, start, end, label }
 * matching exactly what the dashboard weekly chart uses.
 *
 * week_start_day: 0=Sunday, 1=Monday ... 6=Saturday
 * Python weekday: Mon=0 ... Sun=6
 * JS getDay():    Sun=0, Mon=1 ... Sat=6
 */
export interface WeekBoundary {
  weekNumber: number
  start:      Date
  end:        Date
  label:      string
}

export function getWeekBoundaries(
  year:          number,
  month:         number,
  weekStartDay:  number = 1,
): WeekBoundary[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay  = new Date(year, month, 0)

  // Convert our week_start_day (0=Sun,1=Mon...6=Sat)
  // to JS getDay() format (0=Sun,1=Mon...6=Sat) — same mapping
  const jsWeekStart = weekStartDay === 0 ? 0 : weekStartDay

  // Find all week start dates within the month
  const boundaries: Date[] = [new Date(firstDay)]
  const cursor = new Date(firstDay)
  cursor.setDate(cursor.getDate() + 1)

  while (cursor <= lastDay) {
    if (cursor.getDay() === jsWeekStart) {
      boundaries.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  // Build week ranges
  const weeks: WeekBoundary[] = boundaries.map((start, i) => {
    const end = i + 1 < boundaries.length
      ? new Date(new Date(boundaries[i + 1]).setDate(boundaries[i + 1].getDate() - 1))
      : new Date(lastDay)

    const label = `Week ${i + 1} — ${start.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    })} to ${end.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    })}`

    return { weekNumber: i + 1, start, end, label }
  })

  return weeks
}

/**
 * Returns which week number (1-based) a day_of_month falls in
 * for a given month and week_start_day.
 * Returns null if the day doesn't exist in the month.
 */
export function getWeekForDayOfMonth(
  dayOfMonth:    number,
  year:          number,
  month:         number,
  weekStartDay:  number = 1,
): number | null {
  const weeks = getWeekBoundaries(year, month, weekStartDay)
  const d     = new Date(year, month - 1, dayOfMonth)

  for (const week of weeks) {
    if (d >= week.start && d <= week.end) {
      return week.weekNumber
    }
  }
  return null
}

/**
 * Returns which week numbers (1-based) a day_of_week falls in
 * for a given month and week_start_day.
 * A weekly charge with day_of_week=X appears once per week
 * on the matching weekday — returns all week numbers it appears in.
 *
 * day_of_week: 0=Sunday, 1=Monday ... 6=Saturday (our format)
 */
export function getWeeksForDayOfWeek(
  dayOfWeek:     number,
  year:          number,
  month:         number,
  weekStartDay:  number = 1,
): number[] {
  const weeks   = getWeekBoundaries(year, month, weekStartDay)
  const jsDay   = dayOfWeek === 0 ? 0 : dayOfWeek // 0=Sun same in both

  const result: number[] = []

  for (const week of weeks) {
    const cursor = new Date(week.start)
    while (cursor <= week.end) {
      if (cursor.getDay() === jsDay) {
        result.push(week.weekNumber)
        break // only once per week
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  return result
}