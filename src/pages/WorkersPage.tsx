import { useState, type FormEvent } from 'react';
import { Plus, Printer, Receipt, Search, X } from 'lucide-react';
import type { AppData, Worker } from '../types';
import {
  calcWorkerRemaining,
  formatNum,
  matchesQuery,
  sumBy,
  todayIso,
} from '../utils/format';

interface WorkersPageProps {
  data: AppData;
  query: string;
  canEdit: boolean;
  onQueryChange: (q: string) => void;
  onSaveWorker: (index: number, worker: Worker) => void;
  onDeleteWorker: (index: number) => void;
  onAddReceipt: (name: string, amount: number, date: string) => void;
  onPrintAll: () => void;
}

export function WorkersPage({
  data,
  query,
  canEdit,
  onQueryChange,
  onSaveWorker,
  onDeleteWorker,
  onAddReceipt,
  onPrintAll,
}: WorkersPageProps) {
  const [wkModalIdx, setWkModalIdx] = useState<number | null>(null);
  const [wkForm, setWkForm] = useState<Worker>({
    n: '',
    sal: 0,
    paid: 0,
    last: '',
    note: '',
  });

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    n: data.wk[0]?.n || '',
    a: 0,
    d: todayIso(),
  });
  const [err, setErr] = useState('');

  const rows = data.wk
    .map((w, idx) => ({ w, idx }))
    .filter(({ w }) => matchesQuery(w, query));

  const openWkModal = (idx: number) => {
    setErr('');
    if (idx < 0) {
      setWkForm({ n: '', sal: 0, paid: 0, last: '', note: '' });
    } else {
      setWkForm({ ...data.wk[idx] });
    }
    setWkModalIdx(idx);
  };

  const handleWkSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wkForm.n.trim()) {
      setErr('يرجى إدخال اسم العامل');
      return;
    }
    onSaveWorker(wkModalIdx ?? -1, {
      ...wkForm,
      n: wkForm.n.trim(),
      sal: Number(wkForm.sal) || 0,
      paid: Number(wkForm.paid) || 0,
      note: wkForm.note.trim(),
    });
    setWkModalIdx(null);
  };

  const openPayModal = () => {
    setErr('');
    setPayForm({
      n: data.wk[0]?.n || '',
      a: 0,
      d: todayIso(),
    });
    setPayOpen(true);
  };

  const handlePaySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!payForm.n) {
      setErr('يرجى اختيار العامل');
      return;
    }
    if (!payForm.a || payForm.a <= 0) {
      setErr('يرجى إدخال مبلغ صحيح');
      return;
    }
    onAddReceipt(payForm.n, Number(payForm.a), payForm.d || todayIso());
    setPayOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          رواتب العمال
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="بحث في العمال..."
              className="pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          {canEdit && (
            <>
              <button
                type="button"
                onClick={() => openWkModal(-1)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عامل</span>
              </button>
              <button
                type="button"
                onClick={openPayModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>وصل سداد</span>
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3 text-center font-semibold">م</th>
                <th className="px-3 py-3 text-right font-semibold">العامل</th>
                <th className="px-3 py-3 text-left font-semibold">الراتب</th>
                <th className="px-3 py-3 text-left font-semibold">المسدد</th>
                <th className="px-3 py-3 text-center font-semibold">آخر وصل</th>
                <th className="px-3 py-3 text-left font-semibold">المتبقي</th>
                <th className="px-3 py-3 text-right font-semibold">ملاحظات</th>
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
                rows.map(({ w, idx }, k) => {
                  const rem = calcWorkerRemaining(w);
                  return (
                    <tr
                      key={`${w.n}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500">
                        {k + 1}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {w.n}
                      </td>
                      <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNum(w.sal)}
                      </td>
                      <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                        {formatNum(w.paid)}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {w.last || '—'}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-left font-mono-num font-bold ${
                          rem > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatNum(rem)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {w.note || '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {canEdit && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openWkModal(idx)}
                              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteWorker(idx)}
                              className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                            >
                              حذف
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              <tr>
                <td className="px-3 py-3" />
                <td className="px-3 py-3">الإجمالي</td>
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.w.sal))}
                </td>
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.w.paid))}
                </td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-left font-mono-num text-blue-800 dark:text-blue-400">
                  {formatNum(sumBy(rows, (r) => calcWorkerRemaining(r.w)))}
                </td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add / Edit Worker Modal */}
      {wkModalIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWkModalIdx(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {wkModalIdx < 0 ? 'إضافة عامل' : 'تعديل بيانات العامل'}
              </h3>
              <button
                type="button"
                onClick={() => setWkModalIdx(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWkSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  اسم العامل
                </label>
                <input
                  type="text"
                  value={wkForm.n}
                  onChange={(e) => setWkForm({ ...wkForm, n: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الراتب
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wkForm.sal}
                    onChange={(e) =>
                      setWkForm({ ...wkForm, sal: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    المسدد
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wkForm.paid}
                    onChange={(e) =>
                      setWkForm({ ...wkForm, paid: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  تاريخ آخر وصل
                </label>
                <input
                  type="date"
                  value={wkForm.last}
                  onChange={(e) => setWkForm({ ...wkForm, last: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  value={wkForm.note}
                  onChange={(e) => setWkForm({ ...wkForm, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWkModalIdx(null)}
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

      {/* Worker Receipt Modal */}
      {payOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPayOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                وصل عامل (سداد)
              </h3>
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  العامل
                </label>
                <select
                  value={payForm.n}
                  onChange={(e) => setPayForm({ ...payForm, n: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  {data.wk.map((w) => (
                    <option key={w.n} value={w.n}>
                      {w.n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  المبلغ
                </label>
                <input
                  type="number"
                  step="any"
                  value={payForm.a || ''}
                  onChange={(e) =>
                    setPayForm({ ...payForm, a: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={payForm.d}
                  onChange={(e) => setPayForm({ ...payForm, d: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                />
              </div>
              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 text-white"
                >
                  حفظ الوصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
