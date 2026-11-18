import type {
  Pharmacist,
  PharmacistMovement,
  Supplier,
  SupplierMovement,
  Worker,
} from '../types';

export function formatNum(n: number | null | undefined): string {
  return (Number(n) || 0).toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function sumBy<T>(items: T[], selector: (item: T) => number | null | undefined): number {
  return items.reduce((acc, item) => acc + (Number(selector(item)) || 0), 0);
}

export function calcSupplierStats(
  supplier: Supplier,
  movements: SupplierMovement[]
): { buys: number; pays: number; cur: number } {
  const rel = movements.filter((m) => m.c === supplier.n);
  const buys = sumBy(rel.filter((m) => m.t === 'شراء'), (m) => m.a);
  const pays = sumBy(rel.filter((m) => m.t === 'سداد'), (m) => m.a);
  return {
    buys,
    pays,
    cur: (Number(supplier.open) || 0) + buys - pays,
  };
}

export function calcPharmacistStats(
  pharmacist: Pharmacist,
  movements: PharmacistMovement[]
): { total: number; paid: number; rem: number; last: string } {
  const rel = movements.filter((m) => m.p === pharmacist.n);
  const total =
    (Number(pharmacist.open) || 0) +
    sumBy(rel.filter((m) => m.t === 'راتب'), (m) => m.a);
  const paid = sumBy(rel.filter((m) => m.t === 'سداد'), (m) => m.a);
  const last =
    rel
      .filter((m) => m.t === 'سداد' && m.d)
      .map((m) => m.d as string)
      .sort()
      .pop() || '';
  return {
    total,
    paid,
    rem: total - paid,
    last,
  };
}

export function calcWorkerRemaining(worker: Worker): number {
  return (Number(worker.sal) || 0) - (Number(worker.paid) || 0);
}

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

export function matchesQuery(obj: unknown, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return JSON.stringify(obj).toLowerCase().includes(q);
}

/** Safe arithmetic expression evaluator for the built-in calculator */
export function evaluateArithmetic(expr: string): string {
  const clean = expr.replace(/×/g, '*').replace(/÷/g, '/').trim();
  if (!clean) return '';
  if (!/^[0-9+\-*/.() ]+$/.test(clean)) {
    throw new Error('Invalid expression');
  }

  // Tokenize & parse using recursive descent for +, -, *, /, parentheses
  let pos = 0;
  const skipWs = () => {
    while (pos < clean.length && clean[pos] === ' ') pos++;
  };

  const parseExpr = (): number => {
    let val = parseTerm();
    while (true) {
      skipWs();
      const ch = clean[pos];
      if (ch === '+') {
        pos++;
        val += parseTerm();
      } else if (ch === '-') {
        pos++;
        val -= parseTerm();
      } else {
        break;
      }
    }
    return val;
  };

  const parseTerm = (): number => {
    let val = parseFactor();
    while (true) {
      skipWs();
      const ch = clean[pos];
      if (ch === '*') {
        pos++;
        val *= parseFactor();
      } else if (ch === '/') {
        pos++;
        const denom = parseFactor();
        if (denom === 0) throw new Error('Division by zero');
        val /= denom;
      } else {
        break;
      }
    }
    return val;
  };

  const parseFactor = (): number => {
    skipWs();
    if (clean[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (clean[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (clean[pos] === '(') {
      pos++;
      const inner = parseExpr();
      skipWs();
      if (clean[pos] !== ')') throw new Error('Unmatched parenthesis');
      pos++;
      return inner;
    }
    const start = pos;
    let dots = 0;
    while (pos < clean.length && (/[0-9]/.test(clean[pos]) || clean[pos] === '.')) {
      if (clean[pos] === '.') dots++;
      if (dots > 1) throw new Error('Invalid number');
      pos++;
    }
    if (pos === start) throw new Error('Unexpected token');
    return Number(clean.slice(start, pos));
  };

  const result = parseExpr();
  skipWs();
  if (pos !== clean.length || !Number.isFinite(result)) {
    throw new Error('Malformed expression');
  }
  return String(Number(result.toFixed(6)));
}

export function resizeImageFile(file: File, maxDim = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
