import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus, Printer, Search, Upload, X } from 'lucide-react';
import type { AppData, Employee } from '../types';
import {
  daysUntil,
  formatNum,
  matchesQuery,
  resizeImageFile,
} from '../utils/format';
import { EmployeeProfileSheet } from '../components/PrintSheet';

interface EmployeesPageProps {
  data: AppData;
  query: string;
  canEdit: boolean;
  onQueryChange: (q: string) => void;
  onSaveEmployee: (index: number, emp: Employee) => void;
  onDeleteEmployee: (index: number) => void;
  onPrintAll: () => void;
  onPrintEmployee: (emp: Employee) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function EmployeesPage({
  data,
  query,
  canEdit,
  onQueryChange,
  onSaveEmployee,
  onDeleteEmployee,
  onPrintAll,
  onPrintEmployee,
  onNotify,
}: EmployeesPageProps) {
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Employee>({
    n: '',
    job: '',
    tel: '',
    addr: '',
    rid: '',
    rexp: '',
    join: '',
    sal: 0,
    note: '',
    photo: '',
  });
  const [err, setErr] = useState('');

  const rows = data.emp
    .map((x, idx) => ({ x, idx }))
    .filter(({ x }) => matchesQuery(x, query));

  const openEdit = (idx: number) => {
    setErr('');
    if (idx < 0) {
      setForm({
        n: '',
        job: '',
        tel: '',
        addr: '',
        rid: '',
        rexp: '',
        join: '',
        sal: 0,
        note: '',
        photo: '',
      });
    } else {
      setForm({ ...data.emp[idx] });
    }
    setEditIdx(idx);
  };

  const handlePhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file, 240);
      setForm((prev) => ({ ...prev, photo: dataUrl }));
      onNotify('تم تحديث الصورة بنجاح');
    } catch {
      onNotify('تعذر قراءة الصورة المختارة', 'error');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.n.trim()) {
      setErr('يرجى إدخال اسم الموظف');
      return;
    }
    onSaveEmployee(editIdx ?? -1, {
      ...form,
      n: form.n.trim(),
      job: form.job.trim(),
      tel: form.tel.trim(),
      addr: form.addr.trim(),
      rid: form.rid.trim(),
      sal: Number(form.sal) || 0,
      note: form.note.trim(),
    });
    setEditIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          الموظفون وملفاتهم
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="بحث في الموظفين..."
              className="pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-52"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => openEdit(-1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف</span>
            </button>
          )}

          <button
            type="button"
            onClick={onPrintAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكل</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3 text-center font-semibold">م</th>
                <th className="px-3 py-3 text-right font-semibold">الاسم</th>
                <th className="px-3 py-3 text-right font-semibold">الوظيفة</th>
                <th className="px-3 py-3 text-right font-semibold">الهاتف</th>
                <th className="px-3 py-3 text-right font-semibold">رقم الإقامة</th>
                <th className="px-3 py-3 text-center font-semibold">انتهاء الإقامة</th>
                <th className="px-3 py-3 text-center font-semibold">الالتحاق</th>
                <th className="px-3 py-3 text-left font-semibold">المرتب</th>
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
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                rows.map(({ x, idx }, k) => {
                  const days = daysUntil(x.rexp);
                  const soon = days !== null && days < 60;
                  return (
                    <tr
                      key={`${x.n}-${idx}`}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500">
                        {k + 1}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {x.n}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {x.job || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono-num text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {x.tel || '—'}
                      </td>
                      <td className="px-3 py-2.5 font-mono-num text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {x.rid || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-num text-xs whitespace-nowrap">
                        {x.rexp ? (
                          <span
                            className={
                              soon
                                ? 'font-bold text-red-600 dark:text-red-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }
                          >
                            {x.rexp}
                            {soon ? ` (${days} يوم)` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono-num text-xs text-slate-500 dark:text-slate-400">
                        {x.join || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-left font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatNum(x.sal)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewIdx(idx)}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                          >
                            ملف
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(idx)}
                                className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                تعديل
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEmployee(idx)}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors"
                              >
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Profile Card Modal */}
      {viewIdx !== null && data.emp[viewIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewIdx(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <EmployeeProfileSheet employee={data.emp[viewIdx]} />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onPrintEmployee(data.emp[viewIdx])}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 text-white"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewIdx(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {editIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditIdx(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editIdx < 0 ? 'إضافة موظف' : 'ملف موظف'}
              </h3>
              <button
                type="button"
                onClick={() => setEditIdx(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الاسم
                  </label>
                  <input
                    type="text"
                    value={form.n}
                    onChange={(e) => setForm({ ...form, n: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الوظيفة
                  </label>
                  <input
                    type="text"
                    value={form.job}
                    onChange={(e) => setForm({ ...form, job: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    رقم الهاتف
                  </label>
                  <input
                    type="text"
                    value={form.tel}
                    onChange={(e) => setForm({ ...form, tel: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    العنوان
                  </label>
                  <input
                    type="text"
                    value={form.addr}
                    onChange={(e) => setForm({ ...form, addr: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    رقم الإقامة
                  </label>
                  <input
                    type="text"
                    value={form.rid}
                    onChange={(e) => setForm({ ...form, rid: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    تاريخ انتهاء الإقامة
                  </label>
                  <input
                    type="date"
                    value={form.rexp}
                    onChange={(e) => setForm({ ...form, rexp: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    تاريخ الالتحاق
                  </label>
                  <input
                    type="date"
                    value={form.join}
                    onChange={(e) => setForm({ ...form, join: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    المرتب
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.sal}
                    onChange={(e) =>
                      setForm({ ...form, sal: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ملاحظات وتفاصيل أخرى
                </label>
                <textarea
                  rows={2}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>صورة الموظف</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                {form.photo && (
                  <img
                    src={form.photo}
                    alt="معاينة"
                    className="w-10 h-10 rounded object-cover border border-slate-200 dark:border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditIdx(null)}
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
