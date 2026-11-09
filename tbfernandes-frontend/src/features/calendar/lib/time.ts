export const MINUTES_PER_DAY = 1440;
export const LAST_MINUTE = MINUTES_PER_DAY - 1;

const pad = (value: number) => String(value).padStart(2, "0");

export function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function minutesToTime(minutes: number) {
  const clamped = Math.min(Math.max(minutes, 0), LAST_MINUTE);
  return `${pad(Math.floor(clamped / 60))}:${pad(clamped % 60)}:00`;
}

export function minutesToLabel(minutes: number) {
  return minutesToTime(minutes).slice(0, 5);
}

export function formatDuration(minutes: number) {
  const safe = Math.max(minutes, 0);
  return `${Math.floor(safe / 60)}:${pad(safe % 60)}:00`;
}

export function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1).replace(".", ",")} h`;
}

export function rangeLabel(startMinutes: number, endMinutes: number) {
  return `${minutesToLabel(startMinutes)}–${minutesToLabel(endMinutes)}`;
}

export function appointmentMinutes(appointment: {
  startTime: string;
  endTime: string;
}) {
  return (
    timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime)
  );
}
