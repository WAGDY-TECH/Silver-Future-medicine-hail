import { Download, Printer } from 'lucide-react';
import { REPORT_LIST } from '../data/initialData';
import type { AppData, NavigationState, PageId, ReportType } from '../types';
import { ReportSheet } from '../components/PrintSheet';
import { exportReportCsv } from '../utils/csv';

interface ReportsPageProps {
  data: AppData;
  nav: NavigationState;
  onUpdateNav: (p: PageId, q?: string, extra?: Partial<NavigationState>) => void;
  onPrint: (rt: ReportType, ent: string, a: string, b: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function ReportsPage({
  data,
  nav,
  onUpdateNav,
  onPrint,
  onNotify,
}: ReportsPageProps) {
  const rt: ReportType = nav.rt || 'debt_all';
  const def = REPORT_LIST.find((r) => r.id === rt) || REPORT_LIST[0];
  const ent = nav.ent || 'الكل';
  const a = nav.a || '';
  const b = nav.b || '';

  const entityNames =
    def.entityKind === 1
      ? data.sup.map((s) => s.n)
      : def.entityKind === 2
      ? data.ph.map((p) => p.n)
      : [];

  const handleExportCsv = () => {
    exportReportCsv(data, rt, ent, a, b);
    onNotify('تم تصدير التقرير بصيغة CSV');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          الكشوف والتقارير القابلة للطباعة
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={() => onPrint(rt, ent, a, b)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            نوع التقرير
          </label>
          <select
            value={rt}
            onChange={(e) =>
              onUpdateNav('rep', '', {
                rt: e.target.value as ReportType,
                ent: 'الكل',
                a,
                b,
              })
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
          >
            {REPORT_LIST.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {entityNames.length > 0 && (
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {def.entityKind === 1 ? 'المورد' : 'الصيدلي'}
            </label>
            <select
              value={ent}
              onChange={(e) =>
                onUpdateNav('rep', '', { rt, ent: e.target.value, a, b })
              }
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="الكل">الكل</option>
              {entityNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            من تاريخ
          </label>
          <input
            type="date"
            value={a}
            onChange={(e) =>
              onUpdateNav('rep', '', { rt, ent, a: e.target.value, b })
            }
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            إلى تاريخ
          </label>
          <input
            type="date"
            value={b}
            onChange={(e) =>
              onUpdateNav('rep', '', { rt, ent, a, b: e.target.value })
            }
            className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
          />
        </div>
      </div>

      {/* Live Printable Preview */}
      <ReportSheet data={data} rt={rt} ent={ent} a={a} b={b} />
    </div>
  );
}
