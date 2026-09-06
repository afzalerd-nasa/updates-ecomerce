import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  CheckCircle,
  Truck,
  Clock,
  MapPin,
  X,
  AlertCircle,
} from 'lucide-react';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  onClose?: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber = '',
  onClose,
}) => {
  const [query, setQuery] = useState(initialOrderNumber || 'ORD-892144');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleTrack = async (searchNum: string) => {
    if (!searchNum.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(searchNum.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No matching order found');
        setOrderData(null);
      } else {
        setOrderData(data.order);
      }
    } catch (err: any) {
      setError(err.message || 'Tracking query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      setQuery(initialOrderNumber);
      handleTrack(initialOrderNumber);
    } else {
      // Demo track default seeded order
      handleTrack('ORD-892144');
    }
  }, [initialOrderNumber]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wide">
              Live Order Tracking
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tracking Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTrack(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Enter Order # (e.g. ORD-892144) or Tracking ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-xs font-mono focus:border-emerald-600 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Track</span>
            </button>
          </form>

          {loading && (
            <div className="py-12 text-center text-xs text-zinc-400">
              Retrieving live package telemetry...
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Tracking Details */}
          {orderData && (
            <div className="space-y-6">
              {/* Order Meta Top Bar */}
              <div className="rounded-2xl bg-zinc-50 p-4 border border-zinc-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="text-zinc-400 text-[11px]">Order Reference</div>
                  <div className="font-mono font-bold text-zinc-900">{orderData.order_number}</div>
                </div>

                <div>
                  <div className="text-zinc-400 text-[11px]">Tracking Number</div>
                  <div className="font-mono font-bold text-emerald-700">{orderData.tracking_number}</div>
                </div>

                <div>
                  <div className="text-zinc-400 text-[11px]">Expected Delivery</div>
                  <div className="font-bold text-zinc-900">{orderData.expected_delivery_date}</div>
                </div>

                <div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-extrabold text-[11px] text-emerald-800 uppercase tracking-wide">
                    {orderData.status}
                  </span>
                </div>
              </div>

              {/* Visual Step Timeline */}
              <div className="rounded-2xl border border-zinc-200 p-6 space-y-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Shipment Progress Timeline
                </h4>

                <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200">
                  {orderData.timeline?.map((step: any, idx: number) => {
                    const isPassed = step.completed;
                    const isCurrent = step.current;

                    return (
                      <div key={step.status} className="relative flex items-start gap-4">
                        {/* Indicator Circle */}
                        <div
                          className={`absolute -left-6 sm:-left-8 flex h-6 w-6 items-center justify-center rounded-full text-white text-xs ${
                            isCurrent
                              ? 'bg-emerald-600 ring-4 ring-emerald-100'
                              : isPassed
                              ? 'bg-emerald-600'
                              : 'bg-zinc-300'
                          }`}
                        >
                          {isPassed ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                        </div>

                        {/* Step Details */}
                        <div>
                          <div
                            className={`text-xs font-bold ${
                              isCurrent
                                ? 'text-emerald-700'
                                : isPassed
                                ? 'text-zinc-900'
                                : 'text-zinc-400'
                            }`}
                          >
                            {step.status}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {isCurrent
                              ? 'In transit with delivery partner. Final destination hub reached.'
                              : isPassed
                              ? 'Stage completed successfully.'
                              : 'Pending prior milestone.'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address & Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Address */}
                <div className="rounded-2xl border border-zinc-200 p-4 space-y-1.5">
                  <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Delivery Destination
                  </div>
                  {orderData.shipping_address ? (
                    <div className="text-zinc-600 leading-relaxed">
                      <strong>{orderData.shipping_address.full_name || 'Customer'}</strong>
                      <br />
                      {orderData.shipping_address.house_flat}, {orderData.shipping_address.street}
                      <br />
                      {orderData.shipping_address.city}, {orderData.shipping_address.state} - {orderData.shipping_address.pin_code}
                      <br />
                      {orderData.shipping_address.country}
                      <br />
                      Contact: {orderData.shipping_address.mobile}
                    </div>
                  ) : (
                    <div className="text-zinc-400">Address on file with courier</div>
                  )}
                </div>

                {/* Items in Package */}
                <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
                  <div className="font-bold text-zinc-900">
                    Items ({orderData.items?.length || 0})
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-2">
                    {orderData.items?.map((it: any) => (
                      <div key={it.id} className="flex items-center gap-2.5">
                        <img
                          src={it.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120'}
                          alt={it.product_name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover bg-zinc-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 truncate">
                          <div className="font-semibold text-zinc-800 truncate">{it.product_name}</div>
                          <div className="text-[10px] text-zinc-400">Qty: {it.quantity} • ${it.unit_price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
