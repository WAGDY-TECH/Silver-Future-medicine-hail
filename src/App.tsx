import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Calculator,
  Clock,
  FileSpreadsheet,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Stethoscope,
  Sun,
  Truck,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import {
  loadAppData,
  PAGE_LABELS,
  ROLE_LABELS,
  saveAppData,
  SHORTCUT_KEYS,
} from './data/initialData';
import type {
  AppData,
  AppUser,
  Employee,
  NavigationState,
  PageId,
  Pharmacist,
  PharmacistMovement,
  ReportType,
  Supplier,
  SupplierMovement,
  Worker,
} from './types';
import {
  calcPharmacistStats,
  calcSupplierStats,
  calcWorkerRemaining,
  formatNum,
} from './utils/format';
import { LoginView } from './components/LoginView';
import { CalculatorModal } from './components/CalculatorModal';
import { ConfirmModal } from './components/ConfirmModal';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';
import { ToastContainer, type ToastMessage } from './components/Toast';
import {
  EmployeeProfileSheet,
  type PrintPayload,
  ReportSheet,
} from './components/PrintSheet';
import { DashboardPage } from './pages/DashboardPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { MovementsPage } from './pages/MovementsPage';
import { PharmacistsPage } from './pages/PharmacistsPage';
import { WorkersPage } from './pages/WorkersPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { ProfilePage } from './pages/ProfilePage';

const PAGE_ICONS: Record<PageId, React.ComponentType<{ className?: string }>> = {
  dash: LayoutDashboard,
  sup: Building2,
  mov: Truck,
  ph: Stethoscope,
  wk: HardHat,
  emp: Users,
  rep: FileSpreadsheet,
  users: ShieldCheck,
  prof: UserCircle,
};

interface SearchResult {
  category: string;
  page: PageId;
  summary: string;
}

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentUsername, setCurrentUsername] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('saan_u');
    } catch {
      return null;
    }
  });
  const [nav, setNav] = useState<NavigationState>({ p: 'dash', q: '' });
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('saan_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });
  const [now, setNow] = useState(() => new Date());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [printPayload, setPrintPayload] = useState<PrintPayload | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('saan_theme', dark ? 'dark' : 'light');
    } catch {
      // Ignore storage error
    }
  }, [dark]);

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  // Persist app data on change
  const updateData = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveAppData(next);
      return next;
    });
  }, []);

  const notify = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const currentUser = useMemo(
    () =>
      currentUsername
        ? data.users.find((u) => u.u === currentUsername) || null
        : null,
    [currentUsername, data.users]
  );

  const canAccess = useCallback(
    (p: PageId) => {
      if (!currentUser) return false;
      return currentUser.role === 'admin' || currentUser.perm.includes(p);
    },
    [currentUser]
  );

  const canEdit = currentUser ? currentUser.role !== 'viewer' : false;

  const navigate = useCallback(
    (p: PageId, q = '', extra: Partial<NavigationState> = {}) => {
      if (!canAccess(p)) return;
      setNav({ p, q, ...extra });
      setSearchOpen(false);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    },
    [canAccess]
  );

  const handleLogin = (username: string, password: string): string | null => {
    const found = data.users.find(
      (x) =>
        x.u.toLowerCase() === username.toLowerCase() && x.p === password
    );
    if (!found) {
      return 'بيانات الدخول غير صحيحة';
    }
    setCurrentUsername(found.u);
    try {
      sessionStorage.setItem('saan_u', found.u);
    } catch {
      // Ignore storage error
    }
    const firstAllowed =
      (Object.keys(PAGE_LABELS) as PageId[]).find(
        (p) => found.role === 'admin' || found.perm.includes(p)
      ) || 'dash';
    setNav({ p: firstAllowed, q: '' });
    return null;
  };

  const handleLogout = useCallback(() => {
    setCurrentUsername(null);
    try {
      sessionStorage.removeItem('saan_u');
    } catch {
      // Ignore
    }
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentUser) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setCalcOpen(false);
        setConfirmState((s) => ({ ...s, open: false }));
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (!e.altKey) return;
      const code = e.code.replace('Key', '');
      if (code === 'F') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (code === 'C') {
        e.preventDefault();
        setCalcOpen(true);
      } else if (code === 'Q') {
        e.preventDefault();
        handleLogout();
      } else {
        const target = (Object.keys(SHORTCUT_KEYS) as PageId[]).find(
          (k) => SHORTCUT_KEYS[k] === code
        );
        if (target && canAccess(target)) {
          e.preventDefault();
          navigate(target);
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [currentUser, canAccess, handleLogout, navigate]);

  // Global search results
  const searchResults = useMemo<SearchResult[]>(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q || !currentUser) return [];
    const results: SearchResult[] = [];
    const pushIfMatch = (
      category: string,
      page: PageId,
      obj: unknown,
      summary: string
    ) => {
      if (!canAccess(page)) return;
      if (JSON.stringify(obj).toLowerCase().includes(q)) {
        results.push({ category, page, summary });
      }
    };

    data.sup.forEach((s) =>
      pushIfMatch(
        'شركة',
        'sup',
        s,
        `${s.n} ${s.rep} | المديونية ${formatNum(calcSupplierStats(s, data.mov).cur)}`
      )
    );
    data.mov.forEach((x) =>
      pushIfMatch(
        'حركة',
        'mov',
        x,
        `${x.d || ''} ${x.c} ${x.t} ${formatNum(x.a)} ${x.note}`
      )
    );
    data.ph.forEach((p) =>
      pushIfMatch(
        'صيدلي',
        'ph',
        p,
        `${p.n} | المتبقي ${formatNum(calcPharmacistStats(p, data.phm).rem)}`
      )
    );
    data.phm.forEach((x) =>
      pushIfMatch(
        'حركة صيدلي',
        'ph',
        x,
        `${x.d || ''} ${x.p} ${x.t} ${formatNum(x.a)}`
      )
    );
    data.wk.forEach((w) =>
      pushIfMatch(
        'عامل',
        'wk',
        w,
        `${w.n} | المتبقي ${formatNum(calcWorkerRemaining(w))} ${w.note}`
      )
    );
    data.emp.forEach((e) =>
      pushIfMatch('موظف', 'emp', e, `${e.n} - ${e.job} ${e.tel}`)
    );
    data.users.forEach((u) =>
      pushIfMatch(
        'مستخدم',
        'users',
        { u: u.u, name: u.name },
        `${u.name} (${u.u})`
      )
    );

    return results.slice(0, 40);
  }, [globalQuery, currentUser, data, canAccess]);

  // Print helper
  const triggerPrint = useCallback((payload: PrintPayload) => {
    setPrintPayload(payload);
    setTimeout(() => {
      window.print();
    }, 60);
  }, []);

  const askConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, onConfirm });
  };

  // CRUD handlers
  const handleSaveSupplier = (
    index: number,
    sup: Supplier,
    previousName?: string
  ) => {
    updateData((prev) => {
      const nextSup = [...prev.sup];
      let nextMov = prev.mov;
      if (index < 0) {
        nextSup.push(sup);
      } else {
        nextSup[index] = sup;
        if (previousName && previousName !== sup.n) {
          nextMov = prev.mov.map((m) =>
            m.c === previousName ? { ...m, c: sup.n } : m
          );
        }
      }
      return { ...prev, sup: nextSup, mov: nextMov };
    });
    notify(index < 0 ? 'تمت إضافة الشركة' : 'تم تحديث بيانات الشركة');
  };

  const handleDeleteSupplier = (index: number) => {
    const name = data.sup[index]?.n || '';
    askConfirm('حذف شركة', `هل تريد حذف الشركة "${name}"؟`, () => {
      updateData((prev) => ({
        ...prev,
        sup: prev.sup.filter((_, i) => i !== index),
      }));
      notify('تم حذف الشركة');
    });
  };

  const handleAddMovement = (movement: SupplierMovement) => {
    updateData((prev) => ({ ...prev, mov: [...prev.mov, movement] }));
    notify('تم تسجيل الحركة بنجاح');
  };

  const handleDeleteMovement = (index: number) => {
    askConfirm('حذف حركة', 'هل تريد حذف هذه الحركة من السجل؟', () => {
      updateData((prev) => ({
        ...prev,
        mov: prev.mov.filter((_, i) => i !== index),
      }));
      notify('تم حذف الحركة');
    });
  };

  const handleSavePharmacist = (
    index: number,
    ph: Pharmacist,
    previousName?: string
  ) => {
    updateData((prev) => {
      const nextPh = [...prev.ph];
      let nextPhm = prev.phm;
      let nextEmp = prev.emp;
      if (index < 0) {
        nextPh.push(ph);
        nextEmp = [
          ...prev.emp,
          {
            n: ph.n,
            job: 'صيدلي',
            addr: '',
            tel: '',
            rid: '',
            rexp: '',
            join: '',
            sal: 0,
            note: '',
          },
        ];
      } else {
        nextPh[index] = ph;
        if (previousName && previousName !== ph.n) {
          nextPhm = prev.phm.map((m) =>
            m.p === previousName ? { ...m, p: ph.n } : m
          );
        }
      }
      return { ...prev, ph: nextPh, phm: nextPhm, emp: nextEmp };
    });
    notify(index < 0 ? 'تمت إضافة الصيدلي' : 'تم تحديث بيانات الصيدلي');
  };

  const handleDeletePharmacist = (index: number) => {
    const name = data.ph[index]?.n || '';
    askConfirm('حذف صيدلي', `هل تريد حذف الصيدلي "${name}"؟`, () => {
      updateData((prev) => ({
        ...prev,
        ph: prev.ph.filter((_, i) => i !== index),
      }));
      notify('تم حذف الصيدلي');
    });
  };

  const handleAddPhMovement = (mv: PharmacistMovement) => {
    updateData((prev) => ({ ...prev, phm: [...prev.phm, mv] }));
    notify('تم تسجيل الحركة للصيدلي');
  };

  const handleDeletePhMovement = (index: number) => {
    askConfirm('حذف حركة راتب', 'هل تريد حذف هذه الحركة؟', () => {
      updateData((prev) => ({
        ...prev,
        phm: prev.phm.filter((_, i) => i !== index),
      }));
      notify('تم حذف الحركة');
    });
  };

  const handleSaveWorker = (index: number, worker: Worker) => {
    updateData((prev) => {
      const nextWk = [...prev.wk];
      let nextEmp = prev.emp;
      if (index < 0) {
        nextWk.push(worker);
        nextEmp = [
          ...prev.emp,
          {
            n: worker.n,
            job: 'عامل',
            addr: '',
            tel: '',
            rid: '',
            rexp: '',
            join: '',
            sal: worker.sal,
            note: '',
          },
        ];
      } else {
        nextWk[index] = worker;
      }
      return { ...prev, wk: nextWk, emp: nextEmp };
    });
    notify(index < 0 ? 'تمت إضافة العامل' : 'تم تحديث بيانات العامل');
  };

  const handleDeleteWorker = (index: number) => {
    const name = data.wk[index]?.n || '';
    askConfirm('حذف عامل', `هل تريد حذف العامل "${name}"؟`, () => {
      updateData((prev) => ({
        ...prev,
        wk: prev.wk.filter((_, i) => i !== index),
      }));
      notify('تم حذف العامل');
    });
  };

  const handleAddWorkerReceipt = (name: string, amount: number, date: string) => {
    updateData((prev) => ({
      ...prev,
      wk: prev.wk.map((w) =>
        w.n === name
          ? { ...w, paid: (Number(w.paid) || 0) + amount, last: date }
          : w
      ),
    }));
    notify('تم تسجيل وصل السداد');
  };

  const handleSaveEmployee = (index: number, emp: Employee) => {
    updateData((prev) => {
      const nextEmp = [...prev.emp];
      if (index < 0) {
        nextEmp.push(emp);
      } else {
        nextEmp[index] = emp;
      }
      return { ...prev, emp: nextEmp };
    });
    notify(index < 0 ? 'تمت إضافة الموظف' : 'تم تحديث ملف الموظف');
  };

  const handleDeleteEmployee = (index: number) => {
    const name = data.emp[index]?.n || '';
    askConfirm('حذف موظف', `هل تريد حذف ملف الموظف "${name}"؟`, () => {
      updateData((prev) => ({
        ...prev,
        emp: prev.emp.filter((_, i) => i !== index),
      }));
      notify('تم حذف الموظف');
    });
  };

  const handleSaveUser = (index: number, user: AppUser) => {
    updateData((prev) => {
      const nextUsers = [...prev.users];
      if (index < 0) {
        nextUsers.push(user);
      } else {
        nextUsers[index] = { ...nextUsers[index], ...user };
      }
      return { ...prev, users: nextUsers };
    });
    notify(index < 0 ? 'تمت إضافة المستخدم' : 'تم تحديث صلاحيات المستخدم');
  };

  const handleDeleteUser = (index: number) => {
    const name = data.users[index]?.name || '';
    askConfirm('حذف مستخدم', `هل تريد حذف المستخدم "${name}"؟`, () => {
      updateData((prev) => ({
        ...prev,
        users: prev.users.filter((_, i) => i !== index),
      }));
      notify('تم حذف المستخدم');
    });
  };

  const handleUpdateProfile = (updates: Partial<AppUser>) => {
    if (!currentUser) return;
    updateData((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.u === currentUser.u ? { ...u, ...updates } : u
      ),
    }));
  };

  if (!currentUser) {
    return (
      <>
        <LoginView
          onLogin={handleLogin}
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
        />
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) =>
            setToasts((prev) => prev.filter((t) => t.id !== id))
          }
        />
      </>
    );
  }

  const allowedPages = (Object.keys(PAGE_LABELS) as PageId[]).filter(canAccess);
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div
        id="app-root"
        className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
      >
        {/* Top Bar (Clean 3-Zone Header) */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => navigate('dash')}
              className="flex items-center gap-2.5 text-right cursor-pointer"
            >
              <span className="px-2.5 py-1 rounded-md bg-blue-800 text-white font-bold text-xs tracking-wider">
                SAAN
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                SAAN OPER SYSTEM
              </span>
            </button>
          </div>

          {/* Global Search */}
          <div
            ref={searchBoxRef}
            className="relative flex-1 max-w-md hidden sm:block"
          >
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={globalQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="بحث شامل: صيدلي، شركة، عامل، مبلغ، تاريخ… (Alt+F)"
              className="w-full pr-9 pl-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
            />
            {globalQuery && (
              <button
                type="button"
                onClick={() => setGlobalQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {searchOpen && globalQuery.trim() && (
              <div className="absolute top-full inset-x-0 mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl max-h-80 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    لا توجد نتائج مطابقة
                  </div>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={`${r.page}-${i}`}
                      type="button"
                      onClick={() => navigate(r.page, globalQuery.trim())}
                      className="w-full text-right px-3.5 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                        {r.category}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {r.summary}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setCalcOpen(true)}
              title="الآلة الحاسبة (Alt+C)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span className="hidden md:inline">الحاسبة</span>
            </button>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="تبديل المظهر"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => navigate('prof')}
              className="flex items-center gap-2 pr-2 pl-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {currentUser.name}
              </span>
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center overflow-hidden text-xs font-bold shrink-0">
                {currentUser.photo ? (
                  <img
                    src={currentUser.photo}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  currentUser.name.slice(0, 2).toUpperCase()
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Workspace Layout: Sidebar + Main Viewport */}
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="space-y-6">
              {/* Pharmacy Info Block */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  صيدلية المستقبل الفضي
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  إدارة دكتور SHAABAN EDRIS
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span>{currentUser.u}</span>
                  <span>·</span>
                  <span>{ROLE_LABELS[currentUser.role]}</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1" aria-label="القائمة الرئيسية">
                {allowedPages.map((p) => {
                  const Icon = PAGE_ICONS[p];
                  const active = nav.p === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => navigate(p)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-blue-800 text-white dark:bg-blue-600'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">{PAGE_LABELS[p]}</span>
                      </span>
                      <span
                        className={`text-[11px] font-mono-num ${
                          active
                            ? 'text-blue-100'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        Alt+{SHORTCUT_KEYS[p]}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Clock & Logout */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="px-2">
                <div
                  dir="ltr"
                  className="flex items-center justify-end gap-2 text-lg font-bold font-mono-num text-blue-800 dark:text-blue-400"
                >
                  <Clock className="w-4 h-4" />
                  <span>{formattedTime}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formattedDate}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </span>
                <span className="text-[11px] font-mono-num text-red-400">
                  Alt+Q
                </span>
              </button>
            </div>
          </aside>

          {/* Mobile Drawer Sidebar */}
          {drawerOpen && (
            <div
              className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-[1px]"
              onClick={(e) => {
                if (e.target === e.currentTarget) setDrawerOpen(false);
              }}
            >
              <aside className="w-72 h-full bg-white dark:bg-slate-900 p-4 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <div className="text-sm font-bold">صيدلية المستقبل الفضي</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUser.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile Global Search */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                      placeholder="بحث شامل..."
                      className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                  {globalQuery.trim() && searchResults.length > 0 && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                      {searchResults.slice(0, 8).map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => navigate(r.page, globalQuery.trim())}
                          className="w-full text-right px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-blue-700 dark:text-blue-400">
                            {r.category}
                          </span>
                          <span>·</span>
                          <span className="truncate">{r.summary}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <nav className="space-y-1">
                    {allowedPages.map((p) => {
                      const Icon = PAGE_ICONS[p];
                      const active = nav.p === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => navigate(p)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                            active
                              ? 'bg-blue-800 text-white dark:bg-blue-600'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{PAGE_LABELS[p]}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </aside>
            </div>
          )}

          {/* Main Content Viewport */}
          <main className="flex-1 min-w-0 p-4 lg:p-6">
            {nav.p === 'dash' && (
              <DashboardPage data={data} onNavigate={navigate} />
            )}

            {nav.p === 'sup' && (
              <SuppliersPage
                data={data}
                query={nav.q}
                canEdit={canEdit}
                onQueryChange={(q) => setNav((prev) => ({ ...prev, q }))}
                onSaveSupplier={handleSaveSupplier}
                onDeleteSupplier={handleDeleteSupplier}
                onPrintAll={() =>
                  triggerPrint({ kind: 'report', rt: 'debt_all' })
                }
                onNavigate={navigate}
                onNotify={notify}
              />
            )}

            {nav.p === 'mov' && (
              <MovementsPage
                data={data}
                query={nav.q}
                canEdit={canEdit}
                onQueryChange={(q) => setNav((prev) => ({ ...prev, q }))}
                onAddMovement={handleAddMovement}
                onDeleteMovement={handleDeleteMovement}
                onNotify={notify}
              />
            )}

            {nav.p === 'ph' && (
              <PharmacistsPage
                data={data}
                query={nav.q}
                canEdit={canEdit}
                onQueryChange={(q) => setNav((prev) => ({ ...prev, q }))}
                onSavePharmacist={handleSavePharmacist}
                onDeletePharmacist={handleDeletePharmacist}
                onAddPhMovement={handleAddPhMovement}
                onDeletePhMovement={handleDeletePhMovement}
                onPrintAll={() =>
                  triggerPrint({ kind: 'report', rt: 'ph_all' })
                }
                onNavigate={navigate}
              />
            )}

            {nav.p === 'wk' && (
              <WorkersPage
                data={data}
                query={nav.q}
                canEdit={canEdit}
                onQueryChange={(q) => setNav((prev) => ({ ...prev, q }))}
                onSaveWorker={handleSaveWorker}
                onDeleteWorker={handleDeleteWorker}
                onAddReceipt={handleAddWorkerReceipt}
                onPrintAll={() =>
                  triggerPrint({ kind: 'report', rt: 'wk_all' })
                }
              />
            )}

            {nav.p === 'emp' && (
              <EmployeesPage
                data={data}
                query={nav.q}
                canEdit={canEdit}
                onQueryChange={(q) => setNav((prev) => ({ ...prev, q }))}
                onSaveEmployee={handleSaveEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onPrintAll={() =>
                  triggerPrint({ kind: 'report', rt: 'emp_all' })
                }
                onPrintEmployee={(emp) =>
                  triggerPrint({ kind: 'employee', employee: emp })
                }
                onNotify={notify}
              />
            )}

            {nav.p === 'rep' && (
              <ReportsPage
                data={data}
                nav={nav}
                onUpdateNav={navigate}
                onPrint={(rt: ReportType, ent: string, a: string, b: string) =>
                  triggerPrint({ kind: 'report', rt, ent, a, b })
                }
                onNotify={notify}
              />
            )}

            {nav.p === 'users' && (
              <UsersPage
                data={data}
                onSaveUser={handleSaveUser}
                onDeleteUser={handleDeleteUser}
              />
            )}

            {nav.p === 'prof' && (
              <ProfilePage
                user={currentUser}
                onUpdateProfile={handleUpdateProfile}
                onNotify={notify}
              />
            )}
          </main>
        </div>
      </div>

      {/* Dedicated Print Area */}
      <div id="print-area">
        {printPayload?.kind === 'report' && printPayload.rt && (
          <ReportSheet
            data={data}
            rt={printPayload.rt}
            ent={printPayload.ent}
            a={printPayload.a}
            b={printPayload.b}
          />
        )}
        {printPayload?.kind === 'employee' && printPayload.employee && (
          <EmployeeProfileSheet employee={printPayload.employee} />
        )}
      </div>

      {/* Modals & Toasts */}
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((s) => ({ ...s, open: false }));
        }}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />

      <OfflineIndicator />
    </>
  );
}
