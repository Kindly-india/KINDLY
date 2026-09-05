// THE canonical "hours for an event" = wall-clock duration (end - start),
// handling events that cross midnight (end < start => add 24h), fractional,
// rounded to 2 decimals.
//
// This is the single source of truth for the per-event hours formula on the
// backend. It MUST stay in sync with the SQL in the
// update_volunteer_hours_on_checkin trigger (see
// backend/migrations/fractional_volunteer_hours.sql), which maintains the
// authoritative per-volunteer total in volunteer_profiles.total_hours.
// An end time before the start means the event runs past midnight, which
// eventHours() wraps. Cap that wrap: without a bound, "14:00 to 13:00" scores
// itself 23 hours of volunteer impact. Every realistic overnight shift
// (9pm-1am, 10pm-6am, 8pm-8am) fits inside this.
export const MAX_OVERNIGHT_HOURS = 12;

export function eventHours(
  startTime?: string | null,
  endTime?: string | null,
): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60; // event crosses midnight
  return Math.round((minutes / 60) * 100) / 100; // 2 dp
}
