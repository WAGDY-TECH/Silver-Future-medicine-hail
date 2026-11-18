import { useState, type FormEvent } from 'react';
import { Download, Plus, Search, X } from 'lucide-react';
import type { AppData, SupplierMovement } from '../types';
import { formatNum, matchesQuery, sumBy, todayIso } from '../utils/format';
import { downloadCsv } from '../utils/csv';

interface MovementsPageProps {
  data: AppData;
  query: string;
  canEdit: boolean;
  onQueryChange: (q: string) => void;
  onAddMovement: (movement: SupplierMovement) => void;
  onDeleteMovement: (index: number) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function MovementsPage({
  data,
  query,
  canEdit,
  onQueryChange,
  onAddMovement,
  onDeleteMovement,
  onNotify,
}: MovementsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SupplierMovement>({
    d: todayIso(),
    c: data.sup[0]?.n || '',
    t: 'شراء',
    a: 0,
    note: '',
  });
  const [err, setErr] = useState('');

  const rows = data.mov
    .map((x, idx) => ({ x, idx }))
    .filter(({ x }) => matchesQuery(x, query))
    .reverse();

  const handleExportCsv = () => {
    downloadCsv(
      `supplier-movements-${todayIso()}.csv`,
      ['التاريخ', 'الشركة', 'النوع', 'المبلغ', 'ملاحظات'],
      rows.map(({ x }) => [x.d || '', x.c, x.t, x.a, x.note || ''])
    );
    onNotify('تم تصدير حركة الموردين والمصروفات بصيغة CSV');
  };

  const openAdd = () => {
    setErr('');
    setForm({
      d: todayIso(),
      c: data.sup[0]?.n || '',
      t: 'شراء',
      a: 0,
      note: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.c) {
      setErr('يرجى اختيار الشركة');
      return;
    }
    if (!form.a || form.a <= 0) {
      setErr('يرجى إدخال مبلغ صحيح أكبر من صفر');
      return;
    }
    onAddMovement({
      d: form.d || todayIso(),
      c: form.c,
      t: form.t,
      a: Number(form.a),
      note: form.note.trim(),
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          حركة الموردين (مشتريات وسدادات)
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="بحث في الحركات..."
              className="pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حركة</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                <th className="px-4 py-3 text-right font-semibold">الشركة</th>
                <th className="px-4 py-3 text-right font-semibold">النوع</th>
                <th className="px-4 py-3 text-left font-semibold">المبلغ</th>
                <th className="px-4 py-3 text-right font-semibold">ملاحظات</th>
                <th className="px-4 py-3 text-center font-semibold">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    لا توجد حركات مطابقة
                  </td>
                </tr>
              ) : (
                rows.map(({ x, idx }) => (
                  <tr
                    key={`${x.c}-${x.d}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono-num text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {x.d || '—'}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {x.c}
                    </td>
                    <td
                      className={`px-4 py-2.5 font-bold text-xs whitespace-nowrap ${
                        x.t === 'سداد'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {x.t}
                    </td>
                    <td className="px-4 py-2.5 text-left font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                      {formatNum(x.a)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {x.note || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onDeleteMovement(idx)}
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
            <tfoot className="bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              <tr>
                <td className="px-4 py-3">الإجمالي</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-left font-mono-num text-blue-800 dark:text-blue-400">
                  {formatNum(sumBy(rows, (r) => r.x.a))}
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                إضافة حركة مورد
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={form.d || ''}
                    onChange={(e) => setForm({ ...form, d: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    النوع
                  </label>
                  <select
                    value={form.t}
                    onChange={(e) =>
                      setForm({ ...form, t: e.target.value as 'شراء' | 'سداد' })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  >
                    <option value="شراء">شراء</option>
                    <option value="سداد">سداد</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الشركة
                </label>
                <select
                  value={form.c}
                  onChange={(e) => setForm({ ...form, c: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                >
                  {data.sup.map((s) => (
                    <option key={s.n} value={s.n}>
                      {s.n}
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
                  value={form.a || ''}
                  onChange={(e) =>
                    setForm({ ...form, a: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              {err && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {err}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white"
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
