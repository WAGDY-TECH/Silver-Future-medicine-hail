import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { PAGE_LABELS, ROLE_LABELS } from '../data/initialData';
import type { AppData, AppUser, PageId, UserRole } from '../types';

interface UsersPageProps {
  data: AppData;
  onSaveUser: (index: number, user: AppUser) => void;
  onDeleteUser: (index: number) => void;
}

const ALL_PAGES = Object.keys(PAGE_LABELS) as PageId[];

export function UsersPage({ data, onSaveUser, onDeleteUser }: UsersPageProps) {
  const [modalIdx, setModalIdx] = useState<number | null>(null);
  const [form, setForm] = useState<AppUser>({
    name: '',
    u: '',
    p: '',
    role: 'acc',
    perm: ['dash', 'sup', 'mov', 'ph', 'wk'],
    photo: '',
  });
  const [err, setErr] = useState('');

  const openModal = (idx: number) => {
    setErr('');
    if (idx < 0) {
      setForm({
        name: '',
        u: '',
        p: '',
        role: 'acc',
        perm: ['dash', 'sup', 'mov', 'ph', 'wk'],
        photo: '',
      });
    } else {
      setForm({ ...data.users[idx], perm: [...data.users[idx].perm] });
    }
    setModalIdx(idx);
  };

  const togglePerm = (p: PageId) => {
    setForm((prev) => ({
      ...prev,
      perm: prev.perm.includes(p)
        ? prev.perm.filter((x) => x !== p)
        : [...prev.perm, p],
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const u = form.u.trim();
    const p = form.p;
    if (!name || !u || !p) {
      setErr('يرجى إكمال كافة البيانات المطلوبة');
      return;
    }
    const duplicate = data.users.some(
      (x, k) => k !== modalIdx && x.u.toLowerCase() === u.toLowerCase()
    );
    if (duplicate) {
      setErr('اسم الدخول مستخدم بالفعل');
      return;
    }

    const finalUser: AppUser = {
      ...form,
      name,
      u: modalIdx === 0 ? data.users[0].u : u,
      role: modalIdx === 0 ? 'admin' : form.role,
    };
    onSaveUser(modalIdx ?? -1, finalUser);
    setModalIdx(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          المستخدمون والصلاحيات
        </h1>

        <button
          type="button"
          onClick={() => openModal(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم</span>
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                <th className="px-4 py-3 text-right font-semibold">اسم الدخول</th>
                <th className="px-4 py-3 text-right font-semibold">الصلاحية</th>
                <th className="px-4 py-3 text-right font-semibold">الصفحات المسموحة</th>
                <th className="px-4 py-3 text-center font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.users.map((u, idx) => (
                <tr
                  key={u.u}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                    {u.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono-num text-xs text-slate-600 dark:text-slate-400">
                    {u.u}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {ROLE_LABELS[u.role]}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                    {u.role === 'admin'
                      ? 'الكل'
                      : u.perm.map((p) => PAGE_LABELS[p]).join('، ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openModal(idx)}
                        className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        تعديل
                      </button>
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(idx)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
                {modalIdx < 0 ? 'إضافة مستخدم' : 'تعديل مستخدم'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الاسم الظاهر
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    اسم الدخول
                  </label>
                  <input
                    type="text"
                    value={form.u}
                    disabled={modalIdx === 0}
                    onChange={(e) => setForm({ ...form, u: e.target.value })}
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 disabled:opacity-60 text-left"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="text"
                    value={form.p}
                    onChange={(e) => setForm({ ...form, p: e.target.value })}
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-left"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    الصلاحية
                  </label>
                  <select
                    value={form.role}
                    disabled={modalIdx === 0}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 disabled:opacity-60"
                  >
                    <option value="admin">مدير (كل الصلاحيات)</option>
                    <option value="acc">محاسب (تعديل)</option>
                    <option value="viewer">مشاهدة فقط</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  الصفحات المسموحة:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PAGES.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.perm.includes(p)}
                        onChange={() => togglePerm(p)}
                        className="rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span>{PAGE_LABELS[p]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalIdx(null)}
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
