import { useEffect, useRef, useState } from 'react';
import { Delete, X } from 'lucide-react';
import { evaluateArithmetic } from '../utils/format';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
}

const KEYS = [
  'C', '(', ')', '/',
  '7', '8', '9', '*',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '⌫', '=',
] as const;

export function CalculatorModal({ open, onClose }: CalculatorModalProps) {
  const [expr, setExpr] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!open) return null;

  const evaluate = () => {
    try {
      const out = evaluateArithmetic(expr);
      setExpr(out);
      setError(false);
    } catch {
      setError(true);
    }
  };

  const handleKey = (k: string) => {
    setError(false);
    if (k === 'C') {
      setExpr('');
    } else if (k === '⌫') {
      setExpr((prev) => prev.slice(0, -1));
    } else if (k === '=') {
      evaluate();
    } else {
      setExpr((prev) => prev + k);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="الآلة الحاسبة"
    >
      <div className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            الآلة الحاسبة
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          dir="ltr"
          value={error ? 'خطأ في العملية' : expr}
          onChange={(e) => {
            setError(false);
            setExpr(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              evaluate();
            }
          }}
          placeholder="0"
          className="w-full mb-3 px-3 py-3 text-left text-2xl font-mono-num rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />

        <div className="grid grid-cols-4 gap-2" dir="ltr">
          {KEYS.map((k) => {
            const isOp = '/*-+= '.includes(k);
            const isClear = k === 'C';
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleKey(k)}
                className={`h-11 rounded-lg font-mono-num text-base font-semibold transition-colors flex items-center justify-center ${
                  isOp
                    ? 'bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500'
                    : isClear
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {k === '*' ? '×' : k === '/' ? '÷' : k === '⌫' ? <Delete className="w-4 h-4" /> : k}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
