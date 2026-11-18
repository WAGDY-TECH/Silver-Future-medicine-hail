import type { AppData, Employee, ReportType } from '../types';
import {
  calcPharmacistStats,
  calcSupplierStats,
  calcWorkerRemaining,
  daysUntil,
  formatNum,
  sumBy,
  todayIso,
} from '../utils/format';

export interface PrintPayload {
  kind: 'report' | 'employee';
  rt?: ReportType;
  ent?: string;
  a?: string;
  b?: string;
  employee?: Employee;
}

interface SheetFrameProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function SheetFrame({ title, subtitle, children }: SheetFrameProps) {
  return (
    <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 print:border-0 print:p-0 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-blue-700 pb-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-blue-900 tracking-tight">
            SAAN OPER SYSTEM
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            إدارة دكتور SHAABAN EDRIS · صيدلية المستقبل الفضي
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <div className="text-xs text-slate-600 mt-0.5">{subtitle}</div>}
          <div className="text-xs text-slate-500 mt-0.5 font-mono-num">
            تاريخ الطباعة: {todayIso()}
          </div>
        </div>
      </div>

      {children}

      <div className="flex justify-around items-center mt-10 pt-4 text-xs font-semibold text-slate-700">
        <span>المحاسب: ________________________</span>
        <span>المدير: ________________________</span>
      </div>
    </div>
  );
}

interface SheetTableProps {
  headers: string[];
  rows: (string | number | React.ReactNode)[][];
  footer?: (string | number | React.ReactNode)[];
}

function SheetTable({ headers, rows, footer }: SheetTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="bg-blue-700 text-white font-semibold px-2.5 py-2 border border-blue-800 whitespace-nowrap text-center"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-6 text-center text-slate-500 border border-slate-300"
              >
                لا توجد بيانات مطابقة
              </td>
            </tr>
          ) : (
            rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 1 ? 'bg-blue-50/60' : 'bg-white'}
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className="px-2.5 py-1.5 border border-slate-300 text-center tabular-nums"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot>
            <tr className="bg-blue-50 font-bold text-blue-950">
              {footer.map((cell, i) => (
                <td
                  key={i}
                  className="px-2.5 py-2 border border-slate-300 text-center tabular-nums"
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function ReportSheet({
  data,
  rt,
  ent = 'الكل',
  a = '',
  b = '',
}: {
  data: AppData;
  rt: ReportType;
  ent?: string;
  a?: string;
  b?: string;
}) {
  const inRange = (d: string | null) => {
    const val = d || '';
    return (!a || val >= a) && (!b || val <= b);
  };
  const rangeText = a || b ? `الفترة: ${a || '…'} إلى ${b || '…'}` : '';
  const isAll = !ent || ent === 'الكل';

  if (rt === 'debt_all') {
    const rows = data.sup.map((s) => ({
      s,
      st: calcSupplierStats(s, data.mov),
    }));
    return (
      <SheetFrame title="كشف المديونية الشامل">
        <SheetTable
          headers={[
            'م',
            'الشركة',
            'المندوب',
            'مديونية سابقة',
            'المشتريات',
            'السدادات',
            'المديونية الحالية',
          ]}
          rows={rows.map(({ s, st }, i) => [
            i + 1,
            s.n,
            s.rep || '-',
            formatNum(s.open),
            formatNum(st.buys),
            formatNum(st.pays),
            <strong key="c">{formatNum(st.cur)}</strong>,
          ])}
          footer={[
            '',
            'الإجمالي',
            '',
            formatNum(sumBy(data.sup, (s) => s.open)),
            formatNum(sumBy(rows, (r) => r.st.buys)),
            formatNum(sumBy(rows, (r) => r.st.pays)),
            formatNum(sumBy(rows, (r) => r.st.cur)),
          ]}
        />
      </SheetFrame>
    );
  }

  if (rt === 'debt_sup') {
    if (isAll) return <ReportSheet data={data} rt="debt_all" a={a} b={b} />;
    const sup = data.sup.find((s) => s.n === ent);
    if (!sup) return <SheetFrame title="كشف مديونية مورد"><p>المورد غير موجود</p></SheetFrame>;
    let bal = Number(sup.open) || 0;
    const mv = data.mov
      .filter((x) => x.c === ent && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    const current = calcSupplierStats(sup, data.mov).cur;
    return (
      <SheetFrame title={`كشف مديونية مورد: ${ent}`} subtitle={rangeText}>
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-700">
          <span>المندوب: <strong>{sup.rep || '-'}</strong></span>
          <span>الموبايل: <strong>{sup.tel || '-'}</strong></span>
          <span>الرصيد الافتتاحي: <strong className="tabular-nums">{formatNum(sup.open)}</strong></span>
        </div>
        <SheetTable
          headers={['التاريخ', 'النوع', 'المبلغ', 'الرصيد', 'ملاحظات']}
          rows={mv.map((x) => {
            bal += x.t === 'شراء' ? x.a : -x.a;
            return [x.d || '-', x.t, formatNum(x.a), formatNum(bal), x.note || ''];
          })}
          footer={['', '', '', `المديونية الحالية: ${formatNum(current)}`, '']}
        />
      </SheetFrame>
    );
  }

  if (rt === 'buys' || rt === 'pays') {
    const ty = rt === 'buys' ? 'شراء' : 'سداد';
    const mv = data.mov
      .filter((x) => x.t === ty && (isAll || x.c === ent) && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    return (
      <SheetFrame
        title={rt === 'buys' ? 'كشف المشتريات' : 'كشف السدادات والمدفوعات'}
        subtitle={`${isAll ? 'كل الموردين' : ent} ${rangeText}`.trim()}
      >
        <SheetTable
          headers={['م', 'التاريخ', 'الشركة', 'المبلغ', 'ملاحظات']}
          rows={mv.map((x, i) => [i + 1, x.d || '-', x.c, formatNum(x.a), x.note || ''])}
          footer={['', '', 'الإجمالي', formatNum(sumBy(mv, (x) => x.a)), '']}
        />
      </SheetFrame>
    );
  }

  if (rt === 'ph_all') {
    const rows = data.ph.map((p) => ({
      p,
      st: calcPharmacistStats(p, data.phm),
    }));
    return (
      <SheetFrame title="كشف مرتبات الصيادلة">
        <SheetTable
          headers={[
            'م',
            'الصيدلي',
            'ديون سابقة',
            'إجمالي الرواتب',
            'المسدد',
            'آخر سداد',
            'المتبقي',
          ]}
          rows={rows.map(({ p, st }, i) => [
            i + 1,
            p.n,
            formatNum(p.open),
            formatNum(st.total),
            formatNum(st.paid),
            st.last || '-',
            <strong key="r">{formatNum(st.rem)}</strong>,
          ])}
          footer={[
            '',
            'الإجمالي',
            '',
            formatNum(sumBy(rows, (r) => r.st.total)),
            formatNum(sumBy(rows, (r) => r.st.paid)),
            '',
            formatNum(sumBy(rows, (r) => r.st.rem)),
          ]}
        />
      </SheetFrame>
    );
  }

  if (rt === 'ph_pay_all') {
    const mv = data.phm
      .filter((x) => x.t === 'سداد' && inRange(x.d))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    return (
      <SheetFrame title="كشف سداد الصيادلة" subtitle={rangeText}>
        <SheetTable
          headers={['التاريخ', 'الصيدلي', 'المبلغ']}
          rows={mv.map((y) => [y.d || '-', y.p, formatNum(y.a)])}
          footer={['', 'الإجمالي', formatNum(sumBy(mv, (y) => y.a))]}
        />
      </SheetFrame>
    );
  }

  if (rt === 'ph_one' || rt === 'ph_pay') {
    if (isAll) {
      return (
        <ReportSheet
          data={data}
          rt={rt === 'ph_one' ? 'ph_all' : 'ph_pay_all'}
          a={a}
          b={b}
        />
      );
    }
    const p = data.ph.find((x) => x.n === ent);
    if (!p) return <SheetFrame title="كشف صيدلي"><p>الصيدلي غير موجود</p></SheetFrame>;
    const st = calcPharmacistStats(p, data.phm);
    const mv = data.phm
      .filter((x) => x.p === ent && inRange(x.d) && (rt === 'ph_one' || x.t === 'سداد'))
      .sort((x, y) => ((x.d || '') > (y.d || '') ? 1 : -1));
    return (
      <SheetFrame
        title={`${rt === 'ph_one' ? 'كشف مرتبات الصيدلي: ' : 'كشف سداد الصيدلي: '}${ent}`}
        subtitle={rangeText}
      >
        <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-700">
          <span>ديون سابقة: <strong className="tabular-nums">{formatNum(p.open)}</strong></span>
          <span>إجمالي الرواتب: <strong className="tabular-nums">{formatNum(st.total)}</strong></span>
          <span>المسدد: <strong className="tabular-nums">{formatNum(st.paid)}</strong></span>
          <span>المتبقي: <strong className="tabular-nums">{formatNum(st.rem)}</strong></span>
        </div>
        <SheetTable
          headers={['التاريخ', 'النوع', 'المبلغ']}
          rows={mv.map((y) => [y.d || '-', y.t, formatNum(y.a)])}
          footer={['', 'الإجمالي', formatNum(sumBy(mv, (y) => y.a))]}
        />
      </SheetFrame>
    );
  }

  if (rt === 'wk_all') {
    return (
      <SheetFrame title="كشف العمال: الراتب والسداد">
        <SheetTable
          headers={[
            'م',
            'العامل',
            'الراتب',
            'المسدد (الوصل)',
            'تاريخ آخر وصل',
            'المتبقي',
            'ملاحظات',
          ]}
          rows={data.wk.map((w, i) => [
            i + 1,
            w.n,
            formatNum(w.sal),
            formatNum(w.paid),
            w.last || '-',
            <strong key="r">{formatNum(calcWorkerRemaining(w))}</strong>,
            w.note || '',
          ])}
          footer={[
            '',
            'الإجمالي',
            formatNum(sumBy(data.wk, (w) => w.sal)),
            formatNum(sumBy(data.wk, (w) => w.paid)),
            '',
            formatNum(sumBy(data.wk, calcWorkerRemaining)),
            '',
          ]}
        />
      </SheetFrame>
    );
  }

  if (rt === 'emp_all') {
    return (
      <SheetFrame title="كشف الموظفين وبياناتهم">
        <SheetTable
          headers={[
            'م',
            'الاسم',
            'الوظيفة',
            'الهاتف',
            'العنوان',
            'رقم الإقامة',
            'انتهاء الإقامة',
            'تاريخ الالتحاق',
            'المرتب',
          ]}
          rows={data.emp.map((x, i) => [
            i + 1,
            x.n,
            x.job,
            x.tel || '-',
            x.addr || '-',
            x.rid || '-',
            x.rexp || '-',
            x.join || '-',
            formatNum(x.sal),
          ])}
        />
      </SheetFrame>
    );
  }

  // exp: Residency expiry report
  const expiring = data.emp
    .filter((x) => x.rexp)
    .sort((x, y) => (x.rexp > y.rexp ? 1 : -1));
  return (
    <SheetFrame title="كشف انتهاء الإقامات">
      <SheetTable
        headers={['الاسم', 'رقم الإقامة', 'تاريخ الانتهاء', 'الأيام المتبقية']}
        rows={expiring.map((x) => [
          x.n,
          x.rid || '-',
          x.rexp,
          daysUntil(x.rexp) ?? '-',
        ])}
      />
    </SheetFrame>
  );
}

export function EmployeeProfileSheet({ employee }: { employee: Employee }) {
  return (
    <SheetFrame title="ملف موظف" subtitle={employee.n}>
      <div className="grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-4 items-start">
        <div className="w-[120px] h-[140px] rounded border border-slate-300 bg-blue-50 flex items-center justify-center overflow-hidden text-xs text-slate-400 mx-auto sm:mx-0">
          {employee.photo ? (
            <img
              src={employee.photo}
              alt={employee.n}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>لا توجد صورة</span>
          )}
        </div>
        <SheetTable
          headers={['البند', 'البيانات']}
          rows={[
            ['الاسم', employee.n],
            ['الوظيفة', employee.job || '-'],
            ['العنوان', employee.addr || '-'],
            ['رقم الهاتف', employee.tel || '-'],
            ['رقم الإقامة', employee.rid || '-'],
            ['تاريخ انتهاء الإقامة', employee.rexp || '-'],
            ['تاريخ الالتحاق', employee.join || '-'],
            ['المرتب', formatNum(employee.sal)],
            ['ملاحظات', employee.note || '-'],
          ]}
        />
      </div>
    </SheetFrame>
  );
}
