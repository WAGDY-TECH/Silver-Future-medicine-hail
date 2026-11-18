import { useState, type FormEvent } from 'react';
import { Download, Plus, Printer, Search, X } from 'lucide-react';
import type { AppData, NavigationState, PageId, ReportType, Supplier } from '../types';
import { calcSupplierStats, formatNum, matchesQuery, sumBy, todayIso } from '../utils/format';
import { downloadCsv } from '../utils/csv';

interface SuppliersPageProps {
  data: AppData;
  query: string;
  canEdit: boolean;
  onQueryChange: (q: string) => void;
  onSaveSupplier: (index: number, supplier: Supplier, previousName?: string) => void;
  onDeleteSupplier: (index: number) => void;
  onPrintAll: () => void;
  onNavigate: (p: PageId, q?: string, extra?: Partial<NavigationState>) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function SuppliersPage({
  data,
  query,
  canEdit,
  onQueryChange,
  onSaveSupplier,
  onDeleteSupplier,
  onPrintAll,
  onNavigate,
  onNotify,
}: SuppliersPageProps) {
  const [modalIdx, setModalIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Supplier>({
    n: '',
    rep: '',
    tel: '',
    open: 0,
    st: '',
  });
  const [err, setErr] = useState('');

  const rows = data.sup
    .map((s, idx) => ({ s, st: calcSupplierStats(s, data.mov), idx }))
    .filter(({ s }) => matchesQuery(s, query));

  const handleExportCsv = () => {
    downloadCsv(
      `suppliers-${todayIso()}.csv`,
      [
        'م',
        'الشركة',
        'المندوب',
        'الموبايل',
        'مديونية سابقة',
        'مشتريات',
        'سدادات',
        'المديونية الحالية',
      ],
      rows.map(({ s, st }, k) => [
        k + 1,
        s.n,
        s.rep || '',
        s.tel || '',
        s.open,
        st.buys,
        st.pays,
        st.cur,
      ])
    );
    onNotify('تم تصدير بيانات الموردين بصيغة CSV');
  };

  const openModal = (idx: number) => {
    setErr('');
    if (idx < 0) {
      setForm({ n: '', rep: '', tel: '', open: 0, st: '' });
    } else {
      setForm({ ...data.sup[idx] });
    }
    setModalIdx(idx);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.n.trim()) {
      setErr('يرجى إدخال اسم الشركة');
      return;
    }
    const prevName = modalIdx !== null && modalIdx >= 0 ? data.sup[modalIdx].n : undefined;
    onSaveSupplier(
      modalIdx ?? -1,
      { ...form, n: form.n.trim(), rep: form.rep.trim(), tel: form.tel.trim() },
      prevName
    );
    setModalIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          الموردون والشركات
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="بحث في الموردين..."
              className="pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => openModal(-1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شركة</span>
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

          <button
            type="button"
            onClick={onPrintAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة المديونية</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3 text-center font-semibold">م</th>
                <th className="px-3 py-3 text-right font-semibold">الشركة</th>
                <th className="px-3 py-3 text-right font-semibold">المندوب</th>
                <th className="px-3 py-3 text-right font-semibold">الموبايل</th>
                <th className="px-3 py-3 text-left font-semibold">مديونية سابقة</th>
                <th className="px-3 py-3 text-left font-semibold">مشتريات</th>
                <th className="px-3 py-3 text-left font-semibold">سدادات</th>
                <th className="px-3 py-3 text-left font-semibold">المديونية الحالية</th>
                <th className="px-3 py-3 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    لا توجد بيانات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                rows.map(({ s, st, idx }, k) => (
                  <tr
                    key={`${s.n}-${idx}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500">
                      {k + 1}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {s.n}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {s.rep || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-mono-num text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {s.tel || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(s.open)}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(st.buys)}
                    </td>
                    <td className="px-3 py-2.5 text-left font-mono-num text-slate-700 dark:text-slate-300">
                      {formatNum(st.pays)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-left font-mono-num font-bold ${
                        st.cur > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {formatNum(st.cur)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('rep', '', {
                              rt: 'debt_sup' as ReportType,
                              ent: s.n,
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
                              onClick={() => openModal(idx)}
                              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteSupplier(idx)}
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
                <td className="px-3 py-3 text-center" />
                <td className="px-3 py-3">الإجمالي</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.s.open))}
                </td>
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.st.buys))}
                </td>
                <td className="px-3 py-3 text-left font-mono-num">
                  {formatNum(sumBy(rows, (r) => r.st.pays))}
                </td>
                <td className="px-3 py-3 text-left font-mono-num text-blue-800 dark:text-blue-400">
                  {formatNum(sumBy(rows, (r) => r.st.cur))}
                </td>
                <td className="px-3 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add / Edit Supplier Modal */}
      {modalIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalIdx(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {modalIdx < 0 ? 'إضافة شركة موردة' : 'تعديل بيانات الشركة'}
              </h3>
              <button
                type="button"
                onClick={() => setModalIdx(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  اسم الشركة
                </label>
                <input
                  type="text"
                  value={form.n}
                  onChange={(e) => setForm({ ...form, n: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    اسم المندوب
                  </label>
                  <input
                    type="text"
                    value={form.rep}
                    onChange={(e) => setForm({ ...form, rep: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    رقم الموبايل
                  </label>
                  <input
                    type="text"
                    value={form.tel}
                    onChange={(e) => setForm({ ...form, tel: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  مديونية سابقة
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.open}
                  onChange={(e) =>
                    setForm({ ...form, open: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
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
                  onClick={() => setModalIdx(null)}
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
