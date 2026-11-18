import { useState, type FormEvent } from 'react';
import { Plus, Printer, Search, X } from 'lucide-react';
import type {
  AppData,
  NavigationState,
  PageId,
  Pharmacist,
  PharmacistMovement,
  ReportType,
} from '../types';
import {
  calcPharmacistStats,
  formatNum,
  matchesQuery,
  sumBy,
  todayIso,
} from '../utils/format';

interface PharmacistsPageProps {
  data: AppData;
  query: string;
  canEdit: boolean;
  onQueryChange: (q: string) => void;
  onSavePharmacist: (index: number, ph: Pharmacist, previousName?: string) => void;
  onDeletePharmacist: (index: number) => void;
  onAddPhMovement: (mv: PharmacistMovement) => void;
  onDeletePhMovement: (index: number) => void;
  onPrintAll: () => void;
  onNavigate: (p: PageId, q?: string, extra?: Partial<NavigationState>) => void;
}

export function PharmacistsPage({
  data,
  query,
  canEdit,
  onQueryChange,
  onSavePharmacist,
  onDeletePharmacist,
  onAddPhMovement,
  onDeletePhMovement,
  onPrintAll,
  onNavigate,
}: PharmacistsPageProps) {
  const [phModalIdx, setPhModalIdx] = useState<number | null>(null);
  const [phForm, setPhForm] = useState<Pharmacist>({ n: '', open: 0 });

  const [mvModalOpen, setMvModalOpen] = useState(false);
  const [mvForm, setMvForm] = useState<PharmacistMovement>({
    d: todayIso(),
    p: data.ph[0]?.n || '',
    t: 'راتب',
    a: 0,
  });
  const [err, setErr] = useState('');

  const rows = data.ph
    .map((p, idx) => ({ p, st: calcPharmacistStats(p, data.phm), idx }))
    .filter(({ p }) => matchesQuery(p, query));

  const mvRows = data.phm
    .map((x, idx) => ({ x, idx }))
    .filter(({ x }) => matchesQuery(x, query))
    .reverse();

  const openPhModal = (idx: number) => {
    setErr('');
    if (idx < 0) {
      setPhForm({ n: '', open: 0 });
    } else {
      setPhForm({ ...data.ph[idx] });
    }
    setPhModalIdx(idx);
  };

  const handlePhSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!phForm.n.trim()) {
      setErr('يرجى إدخال اسم الصيدلي');
      return;
    }
    const prevName =
      phModalIdx !== null && phModalIdx >= 0 ? data.ph[phModalIdx].n : undefined;
    onSavePharmacist(
      phModalIdx ?? -1,
      { n: phForm.n.trim(), open: Number(phForm.open) || 0 },
      prevName
    );
    setPhModalIdx(null);
  };

  const openMvModal = () => {
    setErr('');
    setMvForm({
      d: todayIso(),
      p: data.ph[0]?.n || '',
      t: 'راتب',
      a: 0,
    });
    setMvModalOpen(true);
  };

  const handleMvSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!mvForm.p) {
      setErr('يرجى اختيار الصيدلي');
      return;
    }
    if (!mvForm.a || mvForm.a <= 0) {
      setErr('يرجى إدخال مبلغ صحيح');
      return;
    }
    onAddPhMovement({
      d: mvForm.d || todayIso(),
      p: mvForm.p,
      t: mvForm.t,
      a: Number(mvForm.a),
    });
    setMvModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          رواتب الصيادلة
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="بحث في الصيادلة..."
              className="pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => openPhModal(-1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صيدلي</span>
              </button>
              <button
                type="button"
                onClick={openMvModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>راتب / سداد</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onPrintAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
        </div>
      </div>

      {/* Balances Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3 text-center font-semibold">م</th>
                <th className="px-3 py-3 text-right font-semibold">الصيدلي</th>
                <th className="px-3 py-3 text-left font-semibold">ديون سابقة</th>
                <th className="px-3 py-3 text-left font-semibold">إجمالي الرواتب</th>
                <th className="px-3 py-3 text-left font-semibold">المسدد</th>
                <th className="px-3 py-3 text-center font-semibold">آخر سداد</th>
                <th className="px-3 py-3 text-left font-semibold">المتبقي</th>
                <th className="px-3 py-3 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                rows.map(({ p, st, idx }, k) => (
                  <tr
                    key={`${p.n}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500">
                      {k + 1}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {p.n}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(p.open)}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(st.total)}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(st.paid)}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      {st.last || '—'}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-left font-mono-num font-bold ${
                        st.rem > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatNum(st.rem)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('rep', '', {
                              rt: 'ph_one' as ReportType,
                              ent: p.n,
                            })
                          }
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap"
                        >
                          كشف
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openPhModal(idx)}
                              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePharmacist(idx)}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors whitespace-nowrap"
                            >
                              حذف
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              <tr>
                <td className="px-3 py-3" />
                <td className="px-3 py-3">الإجمالي</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.st.total))}
                </td>
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.st.paid))}
                </td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-left font-mono-num text-blue-800 dark:text-blue-400">
                  {formatNum(sumBy(rows, (r) => r.st.rem))}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Movements History */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            حركة الرواتب والسدادات
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 text-right font-semibold">التاريخ</th>
                <th className="px-4 py-2.5 text-right font-semibold">الصيدلي</th>
                <th className="px-4 py-2.5 text-right font-semibold">النوع</th>
                <th className="px-4 py-2.5 text-left font-semibold">المبلغ</th>
                <th className="px-4 py-2.5 text-center font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mvRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    لا توجد حركات مسجلة
                  </td>
                </tr>
              ) : (
                mvRows.map(({ x, idx }) => (
                  <tr
                    key={`${x.p}-${x.d}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono-num text-xs text-slate-500 dark:text-slate-400">
                      {x.d || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {x.p}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-semibold text-xs ${
                        x.t === 'سداد'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {x.t}
                    </td>
                    <td className="px-4 py-2.5 text-left font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatNum(x.a)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onDeletePhMovement(idx)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Pharmacist Modal */}
      {phModalIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPhModalIdx(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {phModalIdx < 0 ? 'إضافة صيدلي' : 'تعديل بيانات الصيدلي'}
              </h3>
              <button
                type="button"
                onClick={() => setPhModalIdx(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePhSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  اسم الصيدلي
                </label>
                <input
                  type="text"
                  value={phForm.n}
                  onChange={(e) => setPhForm({ ...phForm, n: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ديون رواتب سابقة
                </label>
                <input
                  type="number"
                  step="any"
                  value={phForm.open}
                  onChange={(e) =>
                    setPhForm({ ...phForm, open: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                />
              </div>
              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPhModalIdx(null)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 text-white"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Salary / Payment Modal */}
      {mvModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMvModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                راتب / سداد صيدلي
              </h3>
              <button
                type="button"
                onClick={() => setMvModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleMvSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={mvForm.d || ''}
                  onChange={(e) => setMvForm({ ...mvForm, d: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الصيدلي
                </label>
                <select
                  value={mvForm.p}
                  onChange={(e) => setMvForm({ ...mvForm, p: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  {data.ph.map((p) => (
                    <option key={p.n} value={p.n}>
                      {p.n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  النوع
                </label>
                <select
                  value={mvForm.t}
                  onChange={(e) =>
                    setMvForm({ ...mvForm, t: e.target.value as 'راتب' | 'سداد' })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  <option value="راتب">راتب</option>
                  <option value="سداد">سداد</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  المبلغ
                </label>
                <input
                  type="number"
                  step="any"
                  value={mvForm.a || ''}
                  onChange={(e) =>
                    setMvForm({ ...mvForm, a: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  required
                />
              </div>
              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMvModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 text-white"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
