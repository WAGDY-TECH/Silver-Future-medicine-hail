import type { AppData, NavigationState, PageId, ReportType } from '../types';
import {
  calcPharmacistStats,
  calcSupplierStats,
  calcWorkerRemaining,
  daysUntil,
  formatNum,
  sumBy,
} from '../utils/format';

interface DashboardPageProps {
  data: AppData;
  onNavigate: (p: PageId, q?: string, extra?: Partial<NavigationState>) => void;
}

export function DashboardPage({ data, onNavigate }: DashboardPageProps) {
  const totalSupplierDebt = sumBy(
    data.sup,
    (s) => calcSupplierStats(s, data.mov).cur
  );
  const totalPharmacistRemaining = sumBy(
    data.ph,
    (p) => calcPharmacistStats(p, data.phm).rem
  );
  const totalWorkerRemaining = sumBy(data.wk, calcWorkerRemaining);
  const expiringResidencies = data.emp.filter((e) => {
    const d = daysUntil(e.rexp);
    return d !== null && d < 60;
  }).length;

  const topDebts = data.sup
    .map((s) => ({ s, cur: calcSupplierStats(s, data.mov).cur }))
    .sort((a, b) => b.cur - a.cur)
    .slice(0, 6);

  const recentMovements = [...data.mov].slice(-6).reverse();

  const kpis: {
    label: string;
    value: string;
    tone: 'danger' | 'neutral' | 'warn';
    onClick: () => void;
  }[] = [
    {
      label: 'إجمالي مديونية الموردين',
      value: formatNum(totalSupplierDebt),
      tone: totalSupplierDebt > 0 ? 'danger' : 'neutral',
      onClick: () => onNavigate('sup'),
    },
    {
      label: 'متبقي رواتب الصيادلة',
      value: formatNum(totalPharmacistRemaining),
      tone: 'neutral',
      onClick: () => onNavigate('ph'),
    },
    {
      label: 'متبقي رواتب العمال',
      value: formatNum(totalWorkerRemaining),
      tone: 'neutral',
      onClick: () => onNavigate('wk'),
    },
    {
      label: 'إقامات تنتهي خلال 60 يوم',
      value: String(expiringResidencies),
      tone: expiringResidencies > 0 ? 'warn' : 'neutral',
      onClick: () =>
        onNavigate('rep', '', { rt: 'exp' as ReportType }),
    },
    {
      label: 'عدد الموظفين',
      value: String(data.emp.length),
      tone: 'neutral',
      onClick: () => onNavigate('emp'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          لوحة التحكم
        </h1>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ملخص المديونيات والرواتب وشؤون الموظفين
        </span>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            type="button"
            onClick={kpi.onClick}
            className="text-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {kpi.label}
            </div>
            <div
              className={`mt-2 text-2xl font-bold font-mono-num tabular-nums ${
                kpi.tone === 'danger'
                  ? 'text-red-600 dark:text-red-400'
                  : kpi.tone === 'warn'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-800 dark:text-blue-400'
              }`}
            >
              {kpi.value}
            </div>
          </button>
        ))}
      </div>

      {/* Two primary summary tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              أعلى المديونيات
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('sup')}
              className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              عرض الكل
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-2.5 text-right font-semibold">الشركة</th>
                  <th className="px-4 py-2.5 text-right font-semibold">المندوب</th>
                  <th className="px-4 py-2.5 text-left font-semibold">المديونية الحالية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {topDebts.map(({ s, cur }) => (
                  <tr
                    key={s.n}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {s.n}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                      {s.rep || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-left font-mono-num font-bold text-red-600 dark:text-red-400">
                      {formatNum(cur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              آخر الحركات
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('mov')}
              className="text-xs font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
            >
              سجل الحركات
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-2.5 text-right font-semibold">التاريخ</th>
                  <th className="px-4 py-2.5 text-right font-semibold">الشركة</th>
                  <th className="px-4 py-2.5 text-right font-semibold">النوع</th>
                  <th className="px-4 py-2.5 text-left font-semibold">المبلغ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentMovements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                    >
                      لا توجد حركات مسجلة
                    </td>
                  </tr>
                ) : (
                  recentMovements.map((mv, i) => (
                    <tr
                      key={`${mv.c}-${mv.d}-${i}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {mv.d || '—'}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {mv.c}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold text-xs ${
                          mv.t === 'سداد'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {mv.t}
                      </td>
                      <td className="px-4 py-2.5 text-left font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatNum(mv.a)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
