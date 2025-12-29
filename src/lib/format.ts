export function formatDateFr(dateString: string): string {
  const safe = dateString.includes("T")
    ? dateString
    : `${dateString}T00:00:00`;
  const date = new Date(safe);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString("fr-FR");
}

export function formatDateIso(dateString: string): string {
  const safe = dateString.includes("T")
    ? dateString
    : `${dateString}T00:00:00`;
  const date = new Date(safe);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toISOString().slice(0, 10);
}

export function formatMoney(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function formatMoneySmart(value: number): string {
  if (Number.isInteger(value)) {
    return value.toFixed(0);
  }
  return value.toFixed(2);
}
