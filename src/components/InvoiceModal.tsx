import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import type { Order } from '../types.ts';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col print:shadow-none print:max-h-full print:rounded-none">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-zinc-50 print:hidden shrink-0">
          <span className="font-black text-xs text-zinc-900 uppercase tracking-wider">
            Official Tax Invoice & Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div id="invoice-sheet" className="p-8 space-y-8 overflow-y-auto bg-white text-zinc-800">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-zinc-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-lg">
                  U
                </div>
                <span className="text-2xl font-black text-zinc-900 tracking-tight">
                  updates<span className="text-emerald-600">.</span>
                </span>
              </div>
              <div className="mt-2 text-xs text-zinc-500 leading-relaxed">
                Updates E-Commerce Inc.<br />
                One World Trade Center, Suite 8500<br />
                New York, NY 10007, USA<br />
                support@updates-ecommerce.com
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-lg font-black uppercase text-zinc-900">Tax Invoice</div>
              <div className="text-xs text-zinc-500">
                Invoice No: <strong className="font-mono text-zinc-900">{order.order_number}</strong>
              </div>
              <div className="text-xs text-zinc-500">
                Tracking: <strong className="font-mono text-emerald-700">{order.tracking_number}</strong>
              </div>
              <div className="text-xs text-zinc-500">
                Date: <strong>{order.created_at ? order.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)}</strong>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="rounded-2xl border border-zinc-200 p-4 space-y-1">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Billed & Shipped To:
              </span>
              <div className="font-bold text-zinc-900 text-sm">
                {order.shipping_address?.full_name || order.customer_name || 'Valued Customer'}
              </div>
              <div className="text-zinc-600 leading-relaxed">
                {order.shipping_address?.house_flat}, {order.shipping_address?.street}<br />
                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pin_code}<br />
                {order.shipping_address?.country}<br />
                Mobile: {order.shipping_address?.mobile}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
              <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Payment Details:
              </span>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Method:</span>
                <strong className="text-zinc-900">{order.payment_method || 'Credit Card / Electronic'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Status:</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> Paid in Full
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Delivery Service:</span>
                <strong className="text-zinc-900">{order.delivery_method || 'Standard Express'}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200 text-xs text-left">
              <thead className="bg-zinc-50 text-zinc-600">
                <tr>
                  <th className="px-4 py-3 font-bold">Item Description</th>
                  <th className="px-4 py-3 font-bold text-center">Qty</th>
                  <th className="px-4 py-3 font-bold text-right">Price</th>
                  <th className="px-4 py-3 font-bold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items?.map((it) => (
                  <tr key={it.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {it.product_name}
                      {(it.selected_size || it.selected_color) && (
                        <div className="text-[10px] text-zinc-400">
                          {it.selected_size && <span>Size: {it.selected_size} </span>}
                          {it.selected_color && <span>Color: {it.selected_color}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600">{it.quantity}</td>
                    <td className="px-4 py-3 text-right text-zinc-600">${it.unit_price?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-bold text-zinc-900">
                      ${(it.unit_price * it.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Calculation */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-xs">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-zinc-900">${order.total_amount?.toFixed(2)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount Applied:</span>
                  <span className="font-semibold">-${order.discount_amount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600">
                <span>Shipping & Handling:</span>
                <span className="font-semibold text-zinc-900">
                  {order.delivery_charge === 0 ? 'FREE' : `$${order.delivery_charge?.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>State & Local Tax (8%):</span>
                <span className="font-semibold text-zinc-900">${order.tax_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-black text-zinc-900">
                <span>Grand Total:</span>
                <span className="text-emerald-600">${order.grand_total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="border-t border-zinc-200 pt-6 text-[11px] text-zinc-400 space-y-1">
            <div className="font-semibold text-zinc-700 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Certified Electronic Tax Invoice. Valid without physical signature.
            </div>
            <p>
              Returns are accepted within 30 days of delivery date in accordance with Updates E-Commerce return policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
