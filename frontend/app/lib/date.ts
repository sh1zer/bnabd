// Formats an ISO date/datetime string (yyyy-mm-dd...) as dd/mm/yyyy.
// Reformats the string parts directly to avoid timezone shifts from `new Date()`.
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso.slice(0, 10);
}
