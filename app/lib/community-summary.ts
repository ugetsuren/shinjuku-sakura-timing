export const classifications = [
  "休眠・加温競合型", "寒暖変動型", "早期開花型", "晩期開花型", "平年近傍型",
] as const;

export type TypeSummary = {
  classification: string; count: number; averageDay: number;
  minimumDay: number; maximumDay: number;
};

export function summarizeTypes(rows: TypeSummary[]) {
  const populated = rows.filter((row) => row.count > 0).sort((a, b) =>
    b.count - a.count || (a.classification < b.classification ? -1 : a.classification > b.classification ? 1 : 0));
  return {
    total: populated.reduce((sum, row) => sum + row.count, 0),
    topType: populated[0] ?? null,
    typeCounts: populated.map(({ classification, count }) => ({ classification, count })),
  };
}
