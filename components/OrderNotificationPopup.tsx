"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ShoppingBag, X, ArrowRight, Bell } from "lucide-react";

export interface NewOrderNotification {
  id: string;
  order_number: string;
  customer_name?: string;
  total: number;
  created_at: string;
}

export function OrderNotificationPopup() {
  const router = useRouter();
  const [notification, setNotification] = useState<NewOrderNotification | null>(null);
  const [recentOrders, setRecentOrders] = useState<NewOrderNotification[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const seenOrderIds = useRef(new Set<string>());

  useEffect(() => {
    let lastCheckedTime = new Date().toISOString();

    async function loadRecentOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, created_at, customers(name)")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Unable to load recent orders for notifications.", error);
        return;
      }

      const rows = (data ?? []) as unknown as Array<{
        id: string;
        order_number: string;
        total: number;
        created_at: string;
        customers?: { name: string } | null;
      }>;
      setRecentOrders(rows.map((order) => ({
        id: order.id,
        order_number: order.order_number || order.id.slice(0, 8),
        customer_name: order.customers?.name || "Customer",
        total: Number(order.total) || 0,
        created_at: order.created_at,
      })));
    }

    function handleOpenNotifications() {
      setIsPanelOpen((open) => !open);
      void loadRecentOrders();
    }

    window.addEventListener("open-order-notifications", handleOpenNotifications);

    async function showOrder(order: {
      id: string;
      order_number?: string;
      total?: number;
      customer_id?: string;
      created_at?: string;
      customers?: { name: string } | null;
    }) {
      if (seenOrderIds.current.has(order.id)) return;
      seenOrderIds.current.add(order.id);

      let customerName = order.customers?.name || "Customer";
      if (customerName === "Customer" && order.customer_id) {
        try {
          const { data: customer } = await supabase.from("customers").select("name").eq("id", order.customer_id).maybeSingle();
          if (customer?.name) customerName = customer.name;
        } catch {
          // Keep the generic customer label if the lookup is unavailable.
        }
      }

      const nextOrder = {
        id: order.id,
        order_number: order.order_number || order.id.slice(0, 8),
        customer_name: customerName,
        total: Number(order.total) || 0,
        created_at: order.created_at || new Date().toISOString(),
      };
      setRecentOrders((current) => [nextOrder, ...current.filter((item) => item.id !== order.id)].slice(0, 10));
      setNotification(nextOrder);
    }

    const channel = supabase
      .channel("admin-realtime-orders")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          const newOrder = payload.new as {
            id: string;
            order_number?: string;
            total?: number;
            customer_id?: string;
            created_at: string;
          };

          void showOrder(newOrder);
        }
      )
      .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Order realtime channel unavailable; polling remains active.", error);
        }
      });

    async function pollNewOrders() {
      try {
        const { data: newOrders, error } = await supabase
          .from("orders")
          .select("id, order_number, total, customer_id, created_at")
          .gt("created_at", lastCheckedTime)
          .order("created_at", { ascending: true })
          .limit(100);
        if (error) throw error;

        if (newOrders?.length) {
          for (const row of newOrders) {
            const order = row as unknown as {
              id: string;
              order_number: string;
              total: number;
              customer_id: string;
              created_at: string;
            };
            await showOrder(order);
            if (order.created_at > lastCheckedTime) lastCheckedTime = order.created_at;
          }
        }
      } catch (error) {
        console.error("Unable to check for new orders.", error);
      }
    }

    void pollNewOrders();
    const interval = setInterval(() => void pollNewOrders(), 5000);

    return () => {
      window.removeEventListener("open-order-notifications", handleOpenNotifications);
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Keep the alert visible long enough to be noticed during active work.
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 30000);
    return () => clearTimeout(timer);
  }, [notification]);

  if (!notification && !isPanelOpen) return null;

  const handleClick = () => {
    if (!notification) return;
    const targetOrder = notification.order_number || notification.id;
    setNotification(null);
    router.push(`/orders?search=${encodeURIComponent(targetOrder)}&highlight=${encodeURIComponent(notification.id)}`);
  };

  const openOrder = (order: NewOrderNotification) => {
    setIsPanelOpen(false);
    setNotification(null);
    router.push(`/orders?search=${encodeURIComponent(order.order_number)}&highlight=${encodeURIComponent(order.id)}`);
  };

  return (
    <>
      {isPanelOpen && (
        <section aria-label="Recent orders" aria-modal="false" className="fixed right-4 top-[76px] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl" role="dialog">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-bold text-navy">Recent Orders</h2>
              <p className="text-xs text-gray-500">Select an order to open it.</p>
            </div>
            <button aria-label="Close notifications" className="rounded-md p-2 text-gray-500 hover:bg-gray-100" onClick={() => setIsPanelOpen(false)} type="button"><X size={16} /></button>
          </header>
          <div className="max-h-[min(65vh,28rem)] overflow-y-auto">
            {recentOrders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No recent orders found.</p>
            ) : recentOrders.map((order) => (
              <button className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-0" key={order.id} onClick={() => openOrder(order)} type="button">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">{order.order_number}</span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">{order.customer_name} · {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-navy">₹{order.total.toLocaleString("en-IN")}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {notification && <aside 
      aria-label="New order alert" 
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div 
        onClick={handleClick}
        className="group relative bg-white border-2 border-emerald-500 shadow-2xl rounded-2xl p-4 cursor-pointer hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-start gap-3.5"
        style={{
          boxShadow: "0 10px 30px -5px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.2)",
        }}
      >
        {/* Pulsing Bell Icon Badge */}
        <div className="relative shrink-0 mt-0.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <ShoppingBag size={22} className="animate-bounce" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Bell size={10} /> New Order Received!
            </span>
          </div>
          <h4 className="text-sm font-bold text-navy truncate">
            {notification.order_number}
          </h4>
          <p className="text-xs text-gray-600 truncate mt-0.5">
            Customer: <strong className="text-gray-900">{notification.customer_name}</strong>
          </p>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-100">
            <span className="text-xs font-extrabold text-navy">
              ₹{notification.total.toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View in Orders <ArrowRight size={12} />
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotification(null);
          }}
          className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          title="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    </aside>}
    </>
  );
}
