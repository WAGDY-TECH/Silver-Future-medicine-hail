import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import type { AppUser } from '../types';
import { resizeImageFile } from '../utils/format';

interface ProfilePageProps {
  user: AppUser;
  onUpdateProfile: (updates: Partial<AppUser>) => void;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export function ProfilePage({
  user,
  onUpdateProfile,
  onNotify,
}: ProfilePageProps) {
  const [name, setName] = useState(user.name);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file, 240);
      onUpdateProfile({ photo: dataUrl });
      onNotify('تم تحديث الصورة الشخصية');
    } catch {
      onNotify('تعذر تحديث الصورة', 'error');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const updates: Partial<AppUser> = {};
    if (name.trim()) updates.name = name.trim();
    if (newPass) {
      if (oldPass !== user.p) {
        onNotify('كلمة المرور الحالية غير صحيحة', 'error');
        return;
      }
      updates.p = newPass;
    }
    onUpdateProfile(updates);
    setOldPass('');
    setNewPass('');
    onNotify('تم حفظ التغييرات بنجاح');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
        الصفحة الشخصية
      </h1>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-6 items-start">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-36 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden text-xs text-slate-400">
              {user.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>لا توجد صورة</span>
              )}
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 text-white cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>تغيير الصورة</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  الاسم الظاهر
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  اسم الدخول
                </label>
                <input
                  type="text"
                  value={user.u}
                  disabled
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-left"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  كلمة مرور جديدة
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-800 hover:bg-blue-900 dark:bg-blue-600 text-white transition-colors cursor-pointer"
            >
              حفظ التغييرات
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
