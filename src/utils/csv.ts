import type { AppData, ReportType } from '../types';
import {
  calcPharmacistStats,
  calcSupplierStats,
  calcWorkerRemaining,
  daysUntil,
  sumBy,
  todayIso,
} from './format';

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  // UTF-8 BOM ensures Arabic characters open cleanly in Microsoft Excel
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportReportCsv(
  data: AppData,
  rt: ReportType,
  ent = 'الكل',
  a = '',
  b = ''
): void {
  const inRange = (d: string | null) => {
    const val = d || '';
    return (!a || val >= a) && (!b || val <= b);
  };
  const isAll = !ent || ent === 'الكل';
  const dateSuffix = todayIso();

  if (rt === 'debt_all') {
    const rows = data.sup.map((s, i) => {
      const st = calcSupplierStats(s, data.mov);
      return [i + 1, s.n, s.rep || '', s.tel || '', s.open, st.buys, st.pays, st.cur];
    });
    downloadCsv(
      `suppliers-debt-${dateSuffix}.csv`,
      ['م', 'الشركة', 'المندوب', 'الموبايل', 'مديونية سابقة', 'المشتريات', 'السدادات', 'المديونية الحالية'],
      rows
    );
    return;
  }

  if (rt === 'debt_sup') {
    if (isAll) {
      exportReportCsv(data, 'debt_all', ent, a, b);
      return;
    }
    const sup = data.sup.find((s) => s.n === ent);
    let bal = Number(sup?.open) || 0;
    const mv = data.mov
      .filter((x) => x.c === ent && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    const rows = mv.map((x) => {
      bal += x.t === 'شراء' ? x.a : -x.a;
      return [x.d || '', x.t, x.a, bal, x.note || ''];
    });
    downloadCsv(
      `supplier-statement-${ent}-${dateSuffix}.csv`,
      ['التاريخ', 'النوع', 'المبلغ', 'الرصيد', 'ملاحظات'],
      rows
    );
    return;
  }

  if (rt === 'buys' || rt === 'pays') {
    const ty = rt === 'buys' ? 'شراء' : 'سداد';
    const mv = data.mov
      .filter((x) => x.t === ty && (isAll || x.c === ent) && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    downloadCsv(
      `${rt === 'buys' ? 'purchases' : 'payments'}-${dateSuffix}.csv`,
      ['م', 'التاريخ', 'الشركة', 'المبلغ', 'ملاحظات'],
      mv.map((x, i) => [i + 1, x.d || '', x.c, x.a, x.note || ''])
    );
    return;
  }

  if (rt === 'ph_all') {
    const rows = data.ph.map((p, i) => {
      const st = calcPharmacistStats(p, data.phm);
      return [i + 1, p.n, p.open, st.total, st.paid, st.last || '', st.rem];
    });
    downloadCsv(
      `pharmacists-salaries-${dateSuffix}.csv`,
      ['م', 'الصيدلي', 'ديون سابقة', 'إجمالي الرواتب', 'المسدد', 'آخر سداد', 'المتبقي'],
      rows
    );
    return;
  }

  if (rt === 'ph_pay_all') {
    const mv = data.phm
      .filter((x) => x.t === 'سداد' && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    downloadCsv(
      `pharmacists-payments-${dateSuffix}.csv`,
      ['التاريخ', 'الصيدلي', 'المبلغ'],
      mv.map((y) => [y.d || '', y.p, y.a])
    );
    return;
  }

  if (rt === 'ph_one' || rt === 'ph_pay') {
    if (isAll) {
      exportReportCsv(data, rt === 'ph_one' ? 'ph_all' : 'ph_pay_all', ent, a, b);
      return;
    }
    const mv = data.phm
      .filter((x) => x.p === ent && inRange(x.d) && (rt === 'ph_one' || x.t === 'سداد'))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    downloadCsv(
      `pharmacist-${ent}-${dateSuffix}.csv`,
      ['التاريخ', 'النوع', 'المبلغ'],
      mv.map((y) => [y.d || '', y.t, y.a])
    );
    return;
  }

  if (rt === 'wk_all') {
    const rows = data.wk.map((w, i) => [
      i + 1,
      w.n,
      w.sal,
      w.paid,
      w.last || '',
      calcWorkerRemaining(w),
      w.note || '',
    ]);
    rows.push([
      '',
      'الإجمالي',
      sumBy(data.wk, (w) => w.sal),
      sumBy(data.wk, (w) => w.paid),
      '',
      sumBy(data.wk, calcWorkerRemaining),
      '',
    ]);
    downloadCsv(
      `workers-salaries-${dateSuffix}.csv`,
      ['م', 'العامل', 'الراتب', 'المسدد (الوصل)', 'تاريخ آخر وصل', 'المتبقي', 'ملاحظات'],
      rows
    );
    return;
  }

  if (rt === 'emp_all') {
    downloadCsv(
      `employees-${dateSuffix}.csv`,
      ['م', 'الاسم', 'الوظيفة', 'الهاتف', 'العنوان', 'رقم الإقامة', 'انتهاء الإقامة', 'تاريخ الالتحاق', 'المرتب'],
      data.emp.map((x, i) => [
        i + 1,
        x.n,
        x.job,
        x.tel || '',
        x.addr || '',
        x.rid || '',
        x.rexp || '',
        x.join || '',
        x.sal,
      ])
    );
    return;
  }

  // exp
  const expiring = data.emp
    .filter((x) => x.rexp)
    .sort((x, y) => (x.rexp > y.rexp ? 1 : -1));
  downloadCsv(
    `residency-expiry-${dateSuffix}.csv`,
    ['الاسم', 'رقم الإقامة', 'تاريخ الانتهاء', 'الأيام المتبقية'],
    expiring.map((x) => [x.n, x.rid || '', x.rexp, daysUntil(x.rexp) ?? ''])
  );
}
