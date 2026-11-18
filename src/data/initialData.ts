import type { AppData, PageId, ReportType, UserRole } from '../types';

export const PAGE_LABELS: Record<PageId, string> = {
  dash: 'لوحة التحكم',
  sup: 'الموردون',
  mov: 'حركة الموردين',
  ph: 'الصيادلة',
  wk: 'العمال',
  emp: 'الموظفون',
  rep: 'الكشوف والتقارير',
  users: 'المستخدمون والصلاحيات',
  prof: 'الصفحة الشخصية',
};

export const SHORTCUT_KEYS: Record<PageId, string> = {
  dash: 'D',
  sup: 'S',
  mov: 'M',
  ph: 'P',
  wk: 'W',
  emp: 'E',
  rep: 'R',
  users: 'U',
  prof: 'O',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'مدير',
  acc: 'محاسب',
  viewer: 'مشاهدة',
};

export interface ReportDefinition {
  id: ReportType;
  label: string;
  entityKind: 0 | 1 | 2; // 0: none, 1: supplier, 2: pharmacist
}

export const REPORT_LIST: ReportDefinition[] = [
  { id: 'debt_all', label: 'كشف مديونية شامل (كل الموردين)', entityKind: 0 },
  { id: 'debt_sup', label: 'كشف مديونية مورد', entityKind: 1 },
  { id: 'buys', label: 'كشف مشتريات', entityKind: 1 },
  { id: 'pays', label: 'كشف سدادات / مدفوعات الموردين', entityKind: 1 },
  { id: 'ph_all', label: 'كشف مرتبات الصيادلة (شامل)', entityKind: 0 },
  { id: 'ph_one', label: 'كشف مرتبات صيدلي', entityKind: 2 },
  { id: 'ph_pay', label: 'كشف سداد صيدلي', entityKind: 2 },
  { id: 'wk_all', label: 'كشف العمال: سداد وراتب', entityKind: 0 },
  { id: 'emp_all', label: 'كشف الموظفين وبياناتهم', entityKind: 0 },
  { id: 'exp', label: 'كشف انتهاء الإقامات', entityKind: 0 },
];

const RAW_SEED = {
  sup: [
    [1, 'دوحة الشام', 'هشام', null, 209841, 7405, 15000, 202246, ''],
    [2, 'سما', 'ابراهيم', null, 45092, 0, 1500, 43592, ''],
    [3, 'اريام الخير', null, null, 366, 565, 931, 0, ''],
    [4, 'بيتا مستلزمات', null, null, 4007, 0, 607, 3400, ''],
    [5, 'فام كاش', null, null, null, 2475, 0, 2475, ''],
    [6, 'فيتا كير', null, null, 9950, 0, 0, 9950, 'متأخر'],
    [7, 'الفريح', 'ابو امير', null, 29520, 8556.32, 10006.32, 28070, ''],
    [8, 'هشام مستورد', 'هشام مستورد', null, 1516, 0, 350, 1166, ''],
    [9, 'الريف الفرنسي', null, null, 23583, 0, 0, 23583, ''],
    [10, 'اهل الدواء', null, null, 15182, 0, 0, 15182, ''],
    [11, 'بامبي', null, null, 9450, 0, 0, 9450, ''],
    [12, 'درة المالك', null, null, 2830, 0, 0, 2830, ''],
    [13, 'زاد الدوائية', null, null, 48738, 0, 4500, 44238, ''],
    [14, 'دلة فارما', null, null, 32913, 0, 0, 32913, ''],
    [15, 'ارقي صحة', null, null, 2461, 0, 0, 2461, ''],
    [16, 'نور القمر', null, null, 1952, 0, 0, 1952, ''],
    [17, 'اراكس', null, null, 1055, 0, 0, 1055, ''],
    [18, 'مدين', null, null, 1670, 0, 0, 1670, ''],
    [19, 'اسرار الاسرار', null, null, 2750, 0, 0, 2750, ''],
    [20, 'ميادين', null, null, 15100, 0, 0, 15100, ''],
    [21, 'الصبحية', null, null, 20122, 0, 0, 20122, ''],
    [22, 'ندي الدواء', null, null, 10000, 0, 0, 10000, ''],
    [23, 'انوفا', null, null, 5394, 0, 0, 5394, ''],
    [24, 'درة الموارد', null, null, 6216, 0, 0, 6216, ''],
    [25, 'acm', null, null, 12150, 0, 0, 12150, ''],
    [26, 'واحة العناية', null, null, 3056, 0, 0, 3056, ''],
    [27, 'محمود مسعد', null, null, 3250, 0, 0, 3250, ''],
    [28, 'صدي', null, null, 6903, 0, 0, 6903, ''],
    [29, 'امجاد النور', null, null, 16665, 0, 0, 16665, ''],
    [30, 'الشام الدوائية', null, null, null, 0, 0, 0, ''],
  ] as const,
  mov: [
    ['2026-11-12', 'سما', 'سداد', 1500, 'سند تنفيذي مرفوع مسحوب من حساب ام نواف+4000 محاماة'],
    ['2026-11-12', 'دوحة الشام', 'سداد', 15000, null],
    ['2026-11-13', 'فام كاش', 'شراء', 2475, 'اسامة'],
    ['2026-11-13', 'اريام الخير', 'شراء', 565, 'ريفان'],
    ['2026-11-13', 'بيتا مستلزمات', 'سداد', 607, 'استبدال متبقي gloves 11 فنيبل و17 لاتكس'],
    ['2026-11-14', 'فيتا كير', 'سداد', null, null],
    ['2026-11-12', 'اريام الخير', 'سداد', 565, null],
    [null, 'اريام الخير', 'سداد', 366, null],
    [null, 'دوحة الشام', 'شراء', 7405, null],
    ['2026-11-13', 'الفريح', 'شراء', 8556.32, null],
    ['2026-11-13', 'الفريح', 'سداد', 8556.32, 'كاش'],
    ['2026-11-15', 'هشام مستورد', 'سداد', 350, null],
    [null, 'الفريح', 'سداد', 1450, 'تحويل '],
    [null, 'زاد الدوائية', 'سداد', 4500, null],
  ] as const,
  ph: [
    [1, 'شعبان', 0],
    [2, 'احمد رضا', null],
    [3, 'احمد جمال', null],
    [4, 'طه', null],
    [5, 'طه/عصمت', null],
    [6, 'طه /هشام', null],
    [8, 'احمدالنادي', null],
    [9, 'احمد شعبان', null],
  ] as const,
  phm: [
    ['2026-11-10', 'شعبان', 'راتب', 2026, 39024],
    ['2026-11-10', 'شعبان', 'سداد', 2026, 10382],
    ['2026-11-10', 'احمد رضا', 'راتب', 2026, 19121],
    ['2026-11-10', 'احمد رضا', 'سداد', 2026, 3121],
    ['2026-09-01', 'احمد جمال', 'راتب', 2026, 4000],
    [null, 'طه', 'راتب', 2026, 25939],
    [null, 'طه /هشام', 'راتب', 2026, 5000],
    [null, 'طه/عصمت', 'راتب', 2026, 30000],
    [null, 'طه/عصمت', 'راتب', 2026, 12000],
    [null, 'احمدالنادي', 'راتب', 2026, 9000],
    [null, 'احمد شعبان', 'راتب', 2026, 20556],
  ] as const,
  wk: [
    [1, 'شاكل', 2850, 800, '2026-11-11', 2050, ''],
    [2, 'محمد اجمل', 1675, 500, '2026-11-11', 1175, 'دفعات  وصلت كاش'],
    [3, 'شهادات', 1950, 650, '2026-11-12', 1300, '100 - 250 - 300'],
    [4, 'خليل', 1850, null, null, 1850, ''],
    [5, 'شميم', 950, null, null, 950, ''],
  ] as const,
};

export function createInitialData(): AppData {
  const sup = RAW_SEED.sup.map((r) => ({
    n: r[1],
    rep: r[2] || '',
    tel: r[3] || '',
    open: r[4] || 0,
    st: r[8] || '',
  }));

  const mov = RAW_SEED.mov.map((r) => ({
    d: r[0],
    c: r[1],
    t: r[2] as 'شراء' | 'سداد',
    a: r[3] || 0,
    note: r[4] || '',
  }));

  const ph = RAW_SEED.ph.map((r) => ({
    n: r[1],
    open: r[2] || 0,
  }));

  const phm = RAW_SEED.phm.map((r) => ({
    d: r[0],
    p: r[1],
    t: r[2] as 'راتب' | 'سداد',
    a: r[4] || 0,
  }));

  const wk = RAW_SEED.wk.map((r) => ({
    n: r[1],
    sal: r[2] || 0,
    paid: r[3] || 0,
    last: r[4] || '',
    note: r[6] || '',
  }));

  const emp = [
    ...ph.map((p) => ({
      n: p.n,
      job: 'صيدلي',
      addr: '',
      tel: '',
      rid: '',
      rexp: '',
      join: '',
      sal: phm
        .filter((m) => m.p === p.n && m.t === 'راتب')
        .reduce((acc, m) => acc + m.a, 0),
      note: '',
    })),
    ...wk.map((w) => ({
      n: w.n,
      job: 'عامل',
      addr: '',
      tel: '',
      rid: '',
      rexp: '',
      join: '',
      sal: w.sal,
      note: '',
    })),
  ];

  return {
    sup,
    mov,
    ph,
    phm,
    wk,
    emp,
    users: [
      {
        u: 'SHAABAN',
        p: '00000',
        name: 'SHAABAN EDRIS',
        role: 'admin',
        perm: Object.keys(PAGE_LABELS) as PageId[],
        photo: '',
      },
    ],
  };
}

const STORAGE_KEY = 'saan1';

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed && Array.isArray(parsed.sup) && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seeded data
  }
  return createInitialData();
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
