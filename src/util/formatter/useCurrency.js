export function formatKoreanCurrency(value) {
  if (!value || isNaN(value)) return "0원";

  let num = Number(value);
  const units = ["", "만", "억", "조"];
  let result = [];
  let unitIndex = 0;

  while (num > 0 && unitIndex < units.length) {
    const chunk = num % 10000;

    if (chunk > 0) {
      result.unshift(`${chunk.toLocaleString()}${units[unitIndex]}`);
    }

    num = Math.floor(num / 10000);
    unitIndex++;
  }

  return result.join(" ") + "원";
}
