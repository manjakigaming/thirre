"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  request_id: string | null;
  created_at: string;
  read_at: string | null;
};

export default function NjoftimetPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        setUserId("");
        setNotifications([]);
        return;
      }

      setUserId(user.id);

      const { data, error: queryError } = await supabase
        .from("notifications")
        .select(
          "id, user_id, type, title, body, request_id, created_at, read_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setNotifications((data ?? []) as Notification[]);
    } catch (err) {
      console.error("Gabim gjatë ngarkimit të njoftimeve:", err);
      setError("Njoftimet nuk u ngarkuan. Provo ta rifreskosh faqen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as Notification;
          setNotifications((current) =>
            current.some((item) => item.id === incoming.id)
              ? current
              : [incoming, ...current]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  async function markAsRead(item: Notification) {
    if (!userId || item.read_at || updatingId) return;

    setUpdatingId(item.id);
    setError("");
    setNotice("");

    const readAt = new Date().toISOString();

    try {
      const { data, error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", item.id)
        .eq("user_id", userId)
        .is("read_at", null)
        .select("id");

      if (updateError) throw updateError;

      if (!data?.length) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === item.id
              ? { ...notification, read_at: readAt }
              : notification
          )
        );
        setNotice("Njoftimi tashmë është lexuar ose është përditësuar.");
        return;
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, read_at: readAt }
            : notification
        )
      );
      setNotice("Njoftimi u shënua si i lexuar.");
    } catch (err) {
      console.error("Gabim gjatë shënimit si të lexuar:", err);
      setError("Njoftimi nuk u përditësua. Kontrollo politikat e Supabase.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    if (!userId || unreadCount === 0 || updatingId) return;

    setUpdatingId("all");
    setError("");
    setNotice("");

    const readAt = new Date().toISOString();

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .is("read_at", null);

      if (updateError) throw updateError;

      setNotifications((current) =>
        current.map((item) =>
          item.read_at ? item : { ...item, read_at: readAt }
        )
      );
      setNotice("Të gjitha njoftimet u shënuan si të lexuara.");
    } catch (err) {
      console.error("Gabim gjatë përditësimit të njoftimeve:", err);
      setError("Njoftimet nuk u përditësuan. Provo përsëri.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="font-bold text-blue-700 transition hover:text-blue-900"
        >
          ← Kthehu në THIRRE
        </Link>

        <header className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
              THIRRE
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Njoftimet
            </h1>
            <p className="mt-2 text-slate-600">
              Mbaji nën kontroll ofertat dhe mesazhet e reja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0 || updatingId !== null || !userId}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingId === "all"
              ? "Duke përditësuar..."
              : "Shëno të gjitha si të lexuara"}
          </button>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-black">Njoftimet e tua</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">
              {unreadCount} të palexuara
            </span>
          </div>

          {!userId && !loading ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5">
              <p className="font-bold">Kyçu për t'i parë njoftimet e tua.</p>
              <Link
                href="/login"
                className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                Kyçu në llogari
              </Link>
            </div>
          ) : loading ? (
            <p className="py-10 text-center text-slate-500">
              Duke ngarkuar njoftimet...
            </p>
          ) : notifications.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
              <div className="text-4xl" aria-hidden="true">
                🔔
              </div>
              <h3 className="mt-4 text-lg font-black">
                Ende nuk ke njoftime
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Kur dikush dërgon ofertë për kërkesën tënde ose të vjen mesazh
                i ri, njoftimi do të shfaqet këtu.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-2xl border p-4 transition sm:p-5 ${
                    item.read_at
                      ? "border-slate-200 bg-white"
                      : "border-blue-200 bg-blue-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm"
                      aria-hidden="true"
                    >
                      {item.type === "new_message" ? "💬" : "🔔"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black">{item.title}</h3>
                        {!item.read_at && (
                          <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-bold text-white">
                            E re
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                        {item.body}
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleString("sq-XK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.type === "new_message" && (
                          <Link
                            href="/bisedat"
                            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800"
                          >
                            Hap bisedat
                          </Link>
                        )}

                        {item.request_id && item.type === "new_offer" && (
                          <Link
                            href="/pergjigjet"
                            className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white hover:bg-blue-800"
                          >
                            Shiko ofertat
                          </Link>
                        )}

                        {!item.read_at && (
                          <button
                            type="button"
                            onClick={() => void markAsRead(item)}
                            disabled={updatingId !== null}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {updatingId === item.id
                              ? "Duke ruajtur..."
                              : "Shëno si të lexuar"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Rifresko njoftimet
          </button>
        </section>

        {(error || notice) && (
          <div
            role="status"
            className={`mt-4 rounded-xl p-4 text-sm font-semibold ${
              error
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error || notice}
          </div>
        )}
      </div>
    </main>
  );
}
