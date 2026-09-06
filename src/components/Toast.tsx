import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useCart } from '../context/CartWishlistContext.tsx';

export const Toast: React.FC = () => {
  const { toastMessage, toastType, hideToast } = useCart();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-zinc-950 text-white px-4 py-3 shadow-2xl border border-zinc-800 animate-in slide-in-from-bottom-5">
      {toastType === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />}
      {toastType === 'error' && <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />}
      {toastType === 'info' && <Info className="h-5 w-5 text-sky-400 shrink-0" />}
      <span className="text-xs font-semibold">{toastMessage}</span>
      <button
        onClick={hideToast}
        className="ml-2 rounded-lg p-1 text-zinc-400 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
