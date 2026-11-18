export type PageId =
  | 'dash'
  | 'sup'
  | 'mov'
  | 'ph'
  | 'wk'
  | 'emp'
  | 'rep'
  | 'users'
  | 'prof';

export type UserRole = 'admin' | 'acc' | 'viewer';

export type ReportType =
  | 'debt_all'
  | 'debt_sup'
  | 'buys'
  | 'pays'
  | 'ph_all'
  | 'ph_one'
  | 'ph_pay'
  | 'ph_pay_all'
  | 'wk_all'
  | 'emp_all'
  | 'exp';

export interface Supplier {
  n: string;
  rep: string;
  tel: string;
  open: number;
  st: string;
}

export interface SupplierMovement {
  d: string | null;
  c: string;
  t: 'شراء' | 'سداد';
  a: number;
  note: string;
}

export interface Pharmacist {
  n: string;
  open: number;
}

export interface PharmacistMovement {
  d: string | null;
  p: string;
  t: 'راتب' | 'سداد';
  a: number;
}

export interface Worker {
  n: string;
  sal: number;
  paid: number;
  last: string;
  note: string;
}

export interface Employee {
  n: string;
  job: string;
  addr: string;
  tel: string;
  rid: string;
  rexp: string;
  join: string;
  sal: number;
  note: string;
  photo?: string;
}

export interface AppUser {
  u: string;
  p: string;
  name: string;
  role: UserRole;
  perm: PageId[];
  photo: string;
}

export interface AppData {
  sup: Supplier[];
  mov: SupplierMovement[];
  ph: Pharmacist[];
  phm: PharmacistMovement[];
  wk: Worker[];
  emp: Employee[];
  users: AppUser[];
}

export interface NavigationState {
  p: PageId;
  q: string;
  rt?: ReportType;
  ent?: string;
  a?: string;
  b?: string;
}
