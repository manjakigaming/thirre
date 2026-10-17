"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
};

type Professional = {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  city: string;
  phone: string | null;
  description: string | null;
  services: string[] | string | null;
  experience_years: number | null;
  working_hours: string | null;
  service_area: string | null;
  logo_url: string | null;
};

type ServiceRequest = {
  id: string;
  title: string;
  category: string;
  city: string;
  description: string | null;
  status: string;
  created_at: string;
};

type Offer = {
  id: string;
  request_id: string;
  message: string;
  created_at: string;
};

type BanInfo = {
  banned: boolean;
  reason: string;
};

export default function AdminUserDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
          Duke hapur detajet e përdoruesit...
        </main>
      }
    >
      <AdminUserDetailsContent />
    </Suspense>
  );
}

function AdminUserDetailsContent() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  const [banInfo, setBanInfo] = useState<BanInfo>({
    banned: false,
    reason: "",
  });
  const [reason, setReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [banMessage, setBanMessage] = useState("");
  const [banError, setBanError] = useState("");

  const loadBanStatus = useCallback(async () => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      throw new Error("Sesioni ka skaduar. Kyçu përsëri.");
    }

    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(userId)}/ban`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Nuk u lexua statusi i bllokimit.");
    }

    setBanInfo({
      banned: result.banned === true,
      reason: typeof result.reason === "string" ? result.reason : "",
    });
    setReason(typeof result.reason === "string" ? result.reason : "");
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadDetails() {
      setLoading(true);
      setError("");

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !authData.user) {
          throw new Error("Duhet të kyçesh për të vazhduar.");
        }

        const { data: adminData, error: adminError } =
          await supabase.rpc("is_admin");

        if (adminError || adminData !== true) {
          throw new Error("Nuk ke leje administratori.");
        }

        const [
          userResult,
          professionalResult,
          requestsResult,
          offersResult,
        ] = await Promise.all([
          supabase.rpc("admin_list_users"),
          supabase
            .from("professional_profiles")
            .select(
              "id,user_id,business_name,category,city,phone,description,services,experience_years,working_hours,service_area,logo_url"
            )
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("service_requests")
            .select("id,title,category,city,description,status,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("service_request_responses")
            .select("id,request_id,message,created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

        if (userResult.error) throw userResult.error;
        if (professionalResult.error) throw professionalResult.error;
        if (requestsResult.error) throw requestsResult.error;
        if (offersResult.error) throw offersResult.error;

        const allUsers = (userResult.data ?? []) as AdminUser[];
        const foundUser = allUsers.find((item) => item.id === userId);

        if (!foundUser) {
          throw new Error("Përdoruesi nuk u gjet.");
        }

        if (cancelled) return;

        setUser(foundUser);
        setProfessional(professionalResult.data as Professional | null);
        setRequests((requestsResult.data ?? []) as ServiceRequest[]);
        setOffers((offersResult.data ?? []) as Offer[]);

        await loadBanStatus();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Nuk mund të ngarkoheshin të dhënat."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [userId, loadBanStatus]);

  async function changeBan(action: "ban" | "unban") {
    const confirmation =
      action === "ban"
        ? "A je i sigurt që dëshiron ta bllokosh këtë përdorues?"
        : "A je i sigurt që dëshiron ta zhbllokosh këtë përdorues?";

    if (!window.confirm(confirmation)) return;

    setBanLoading(true);
    setBanMessage("");
    setBanError("");

    try {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      const accessToken = data.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error("Sesioni ka skaduar. Kyçu përsëri.");
      }

      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/ban`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            action,
            reason: reason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Veprimi nuk u krye.");
      }

      setBanInfo({
        banned: result.banned === true,
        reason: action === "ban" ? reason.trim() : "",
      });

      setBanMessage(result.message || "Veprimi u krye me sukses.");

      if (action === "unban") {
        setReason("");
      }
    } catch (err) {
      setBanError(
        err instanceof Error ? err.message : "Ndodhi një gabim."
      );
    } finally {
      setBanLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        Duke ngarkuar të dhënat e përdoruesit...
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-slate-900 p-6">
          <h1 className="text-xl font-bold">Nuk mund të hapen detajet</h1>
          <p className="mt-3 text-sm text-red-300">
            {error || "Përdoruesi nuk u gjet."}
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-4 py-2"
          >
            Kthehu te paneli
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-blue-400">
              THIRRE ADMIN
            </p>
            <h1 className="mt-2 text-2xl font-black">
              Detajet e përdoruesit
            </h1>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm hover:bg-slate-800"
          >
            ← Kthehu te paneli
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Email-i</p>
          <h2 className="mt-2 break-all text-xl font-bold">
            {user.email || "Pa email"}
          </h2>

          <p className="mt-5 text-sm text-slate-400">ID e përdoruesit</p>
          <p className="mt-1 break-all font-mono text-xs text-slate-300">
            {user.id}
          </p>

          <p className="mt-5 text-sm text-slate-400">Data e regjistrimit</p>
          <p className="mt-1">
            {new Date(user.created_at).toLocaleString("sq-AL")}
          </p>

          <div className="mt-5 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
            {professional ? "Profesionist" : "Klient / pa profil profesionisti"}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Statusi i llogarisë</h2>
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                banInfo.banned
                  ? "bg-red-500/15 text-red-300"
                  : "bg-emerald-500/15 text-emerald-300"
              }`}
            >
              {banInfo.banned ? "E bllokuar" : "Aktive"}
            </span>
          </div>

          {banInfo.banned && (
            <p className="mt-4 text-sm text-slate-300">
              <span className="text-slate-400">Arsyeja:</span>{" "}
              {banInfo.reason || "Nuk është dhënë arsye."}
            </p>
          )}

          {!banInfo.banned && (
            <div className="mt-4">
              <label
                htmlFor="ban-reason"
                className="mb-2 block text-sm text-slate-300"
              >
                Arsyeja e bllokimit
              </label>
              <textarea
                id="ban-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Shkruaje arsyen..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          {banMessage && (
            <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
              {banMessage}
            </p>
          )}

          {banError && (
            <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
              {banError}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {banInfo.banned ? (
              <button
                type="button"
                onClick={() => void changeBan("unban")}
                disabled={banLoading}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {banLoading ? "Duke punuar..." : "Zhblloko përdoruesin"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void changeBan("ban")}
                disabled={banLoading || !reason.trim()}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {banLoading ? "Duke punuar..." : "Blloko përdoruesin"}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-bold">Profili profesional</h2>

          {!professional ? (
            <p className="mt-4 text-sm text-slate-400">
              Ky përdorues nuk ka profil profesional.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {professional.logo_url && (
                <img
                  src={professional.logo_url}
                  alt="Logo e biznesit"
                  className="h-20 w-20 rounded-xl border border-slate-700 object-cover"
                />
              )}

              <h3 className="text-lg font-bold">
                {professional.business_name || "Pa emër biznesi"}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Kategoria" value={professional.category} />
                <Detail label="Qyteti" value={professional.city} />
                <Detail label="Telefoni" value={professional.phone} />
                <Detail
                  label="Përvoja"
                  value={
                    professional.experience_years != null
                      ? `${professional.experience_years} vite`
                      : null
                  }
                />
                <Detail label="Orari i punës" value={professional.working_hours} />
                <Detail label="Zona e shërbimit" value={professional.service_area} />
              </div>

              <div>
                <p className="text-sm text-slate-400">Përshkrimi</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {professional.description || "Nuk ka përshkrim."}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Shërbimet</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {Array.isArray(professional.services)
                    ? professional.services.join(", ")
                    : professional.services || "Nuk janë specifikuar."}
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Kërkesat e publikuara</h2>
            <span className="text-sm text-slate-400">
              {requests.length} gjithsej
            </span>
          </div>

          {requests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Ky përdorues nuk ka publikuar kërkesa.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {requests.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold">{item.title}</h3>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.category || "Pa kategori"} · {item.city || "Pa qytet"}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                    {item.description || "Pa përshkrim."}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleDateString("sq-AL")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Ofertat e dërguara</h2>
            <span className="text-sm text-slate-400">
              {offers.length} gjithsej
            </span>
          </div>

          {offers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Ky përdorues nuk ka dërguar oferta.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {offers.map((offer) => (
                <article
                  key={offer.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <p className="text-xs text-slate-500">
                    ID e kërkesës: {offer.request_id}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                    {offer.message}
                  </p>
                  <p className="mt-3 text-xs text-slate-500">
                    {new Date(offer.created_at).toLocaleDateString("sq-AL")}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 break-words">{value || "Nuk është plotësuar."}</p>
    </div>
  );
}