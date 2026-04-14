import { useTheme } from 'styled-components';
import styled from 'styled-components';
import type { PurchaseRow } from '../../types/purchase';
import { formatBRL } from '../../lib/money';

const CHART_COLORS = [
  "#023455",
  '#d4bb94',
  '#08120e',
  '#ffb74d',
  '#e8f5e9',
  '#1e3d2d',
  '#aed581',
  '#ffab91',
  '#c5e1a5',
  '#ffe082',
] as const;

const PieChartWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
  margin-top: 0.35rem;
`;

const SvgBlock = styled.div`
  width: min(100%, 220px);
  margin: 0 auto;
  aspect-ratio: 1;
`;

const SvgEl = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

const Legend = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const LegendRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.88rem;
  color: ${(p) => p.theme.text};
`;

const Swatch = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
  background: ${(p) => p.$color};
`;

const LegendText = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${(p) => p.theme.primary};
  font-weight: bold;
`;

const LegendValue = styled.span`
  color: ${(p) => p.theme.primary};
  font-variant-numeric: tabular-nums;
`;

export type CategorySlice = {
  label: string;
  cents: number;
  color: string;
};

export function aggregatePurchasesByCategory(purchases: PurchaseRow[]): CategorySlice[] {
  const map = new Map<string, { label: string; cents: number }>();
  for (const p of purchases) {
    const key = p.categoryId ?? `name:${p.categoryName}`;
    const cur = map.get(key);
    if (cur) cur.cents += p.amountCents;
    else map.set(key, { label: p.categoryName, cents: p.amountCents });
  }
  const rows = [...map.values()].sort((a, b) => b.cents - a.cents);
  return rows.map((row, i) => ({
    ...row,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));
}

function slicePath(cx: number, cy: number, r: number, startRad: number, endRad: number): string {
  const sweep = endRad - startRad;
  if (sweep >= 2 * Math.PI - 1e-5) {
    return '';
  }
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

type Props = {
  slices: CategorySlice[];
  totalCents: number;
};

export function CategoryPieChart({ slices, totalCents }: Props) {
  const theme = useTheme();
  const cx = 50;
  const cy = 50;
  const r = 40;

  if (totalCents <= 0 || slices.length === 0) {
    return null;
  }

  let angle = -Math.PI / 2;
  const paths: { d: string; fill: string; key: string }[] = [];

  if (slices.length === 1) {
    paths.push({ d: '', fill: slices[0].color, key: '0-full' });
  } else {
    for (let i = 0; i < slices.length; i++) {
      const frac = slices[i].cents / totalCents;
      const next = angle + frac * 2 * Math.PI;
      const d = slicePath(cx, cy, r, angle, next);
      paths.push({ d, fill: slices[i].color, key: `${i}` });
      angle = next;
    }
  }

  const label = `Gastos por categoria: ${slices.length} categorias, total ${formatBRL(totalCents)}`;

  return (
    <PieChartWrap>
      <SvgBlock>
        <SvgEl viewBox="0 0 100 100" role="img" aria-label={label}>
          <title>{label}</title>
          {slices.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
          ) : (
            paths.map((p) => <path key={p.key} d={p.d} fill={p.fill} stroke={theme.bg} strokeWidth={0.2} />)
          )}
        </SvgEl>
      </SvgBlock>
      <Legend>
        {slices.map((s) => {
          const pct = totalCents > 0 ? Math.round((s.cents / totalCents) * 100) : 0;
          return (
            <LegendRow key={`${s.label}-${s.color}`}>
              <Swatch $color={s.color} aria-hidden />
              <LegendText>{s.label}</LegendText>
              <LegendValue>
                {formatBRL(s.cents)} ({pct}%)
              </LegendValue>
            </LegendRow>
          );
        })}
      </Legend>
    </PieChartWrap>
  );
}
