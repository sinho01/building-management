export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "-";
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number.toLocaleString("ko-KR") : String(value);
}
