import { useState } from 'react';
import { Copy, Check, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const appUrl =
    typeof window !== 'undefined' ? window.location.origin : '';

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleTrigger = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) setShowGuide(true);
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        title="تثبيت كتطبيق على الهاتف أو استخراج APK"
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        <span className="hidden md:inline">تثبيت / APK</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[1px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                تثبيت التطبيق على أندرويد واستخراج APK
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  التثبيت على iPhone / iPad (Safari):
                </div>
                <p>1. اضغط على زر المشاركة (Share) أسفل المتصفح.</p>
                <p>2. اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  1. التثبيت الفوري على أندرويد (بدون ملف APK):
                </div>
                <p>
                  افتح رابط التطبيق في متصفح Chrome على هاتفك ثم اضغط قائمة المتصفح (⋮) واختر{' '}
                  <strong>تثبيت التطبيق / Install app</strong> ليعمل كبرنامج مستقل وبدون إنترنت.
                </p>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                2. تحويل التطبيق إلى ملف APK رسمي جاهز للرفع:
              </div>
              <p>
                تم تجهيز التطبيق بالكامل بملف Manifest وأيقونات وأوفلاين (PWA). لتحويله إلى ملف{' '}
                <span className="font-mono-num font-semibold">.apk</span>:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>انسخ رابط التطبيق المنشور (Shared App URL).</li>
                <li>افتح موقع <strong>pwabuilder.com</strong> وألصق الرابط.</li>
                <li>اضغط <strong>Package for stores → Android → Generate</strong> لتحميل ملف الـ APK مباشرة.</li>
              </ol>

              {appUrl && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    dir="ltr"
                    value={appUrl}
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono-num rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-left"
                  />
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-blue-800 hover:bg-blue-900 text-white whitespace-nowrap cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>وضع عدم الاتصال — يتم استخدام البيانات المحفوظة محلياً</span>
    </div>
  );
}
