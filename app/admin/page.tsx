
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Professional = {
  id: string;
  business_name: string;
  category: string;
  city: string;
  user_id: string;
};

type ServiceRequest = {
  id: string;
  title: string;
  category: string;
  city: string;
  status: string;
  user_id: string;
};

type Offer = {
  id: string;
  request_id: string;
  user_id: string;
  message: string;
};

type AdminUser = {
  id: string;
  email: string | null;
  created_at: string;
};

type Tab = "overview" | "professionals" | "requests" | "offers" | "users";
type UserFilter = "all" | "professional" | "client";

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Përmbledhje", icon: "📊" },
  { id: "professionals", label: "Profesionistët", icon: "🛠️" },
  { id: "requests", label: "Kërkesat", icon: "📋" },
  { id: "offers", label: "Ofertat", icon: "💬" },
  { id: "users", label: "Përdoruesit", icon: "👥" },
];

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [userSort, setUserSort] = useState<"newest" | "oldest">("newest");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setAuthorized(false);
        setError("Duhet të kyçesh për të hyrë në panelin e administratorit.");
        return;
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError) {
        setAuthorized(false);
        setError(
          `Gabim gjatë kontrollit të administratorit: ${adminError.message}`
        );
        return;
      }

      if (isAdmin !== true) {
        setAuthorized(false);
        setError("Nuk ke leje administratori për këtë faqe.");
        return;
      }

      setAuthorized(true);

      const [
        professionalsResult,
        requestsResult,
        offersResult,
        usersResult,
      ] = await Promise.all([
        supabase
          .from("professional_profiles")
          .select("id,business_name,category,city,user_id")
          .order("created_at", { ascending: false }),

        supabase
          .from("service_requests")
          .select("id,title,category,city,status,user_id")
          .order("created_at", { ascending: false }),

        supabase
          .from("service_request_responses")
          .select("id,request_id,user_id,message")
          .order("created_at", { ascending: false }),

        supabase.rpc("admin_list_users"),
      ]);

      if (professionalsResult.error) throw professionalsResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (offersResult.error) throw offersResult.error;
      if (usersResult.error) throw usersResult.error;

      setProfessionals((professionalsResult.data ?? []) as Professional[]);
      setRequests((requestsResult.data ?? []) as ServiceRequest[]);
      setOffers((offersResult.data ?? []) as Offer[]);
      setUsers((usersResult.data ?? []) as AdminUser[]);
    } catch (err) {
      console.error("THIRRE ADMIN LOAD ERROR:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë ngarkimit të të dhënave."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const professionalUserIds = useMemo(
    () => new Set(professionals.map((professional) => professional.user_id)),
    [professionals]
  );

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();

    return users
      .filter((user) => {
        const email = user.email?.toLowerCase() ?? "";
        const id = user.id.toLowerCase();
        const matchesSearch =
          !query || email.includes(query) || id.includes(query);

        const isProfessional = professionalUserIds.has(user.id);

        const matchesFilter =
          userFilter === "all" ||
          (userFilter === "professional" && isProfessional) ||
          (userFilter === "client" && !isProfessional);

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const difference =
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime();

        return userSort === "newest" ? -difference : difference;
      });
  }, [users, userSearch, userFilter, userSort, professionalUserIds]);

  async function deleteProfessional(id: string) {
    if (
      !window.confirm(
        "A je i sigurt që dëshiron ta fshish këtë profil profesionisti?"
      )
    ) {
      return;
    }

    setBusy(id);
    setError("");

    try {
      const { error } = await supabase
        .from("professional_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setProfessionals((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Profili nuk mund të fshihet."
      );
    } finally {
      setBusy("");
    }
  }

  async function toggleRequestStatus(request: ServiceRequest) {
    const nextStatus = request.status === "open" ? "closed" : "open";

    setBusy(request.id);
    setError("");

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: nextStatus })
        .eq("id", request.id);

      if (error) throw error;

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Statusi nuk mund të ndryshohet."
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteRequest(id: string) {
    if (
      !window.confirm(
        "A dëshiron ta fshish këtë kërkesë? Ofertat e lidhura mund të fshihen gjithashtu."
      )
    ) {
      return;
    }

    setBusy(id);
    setError("");

    try {
      const { error } = await supabase
        .from("service_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setRequests((current) => current.filter((item) => item.id !== id));
      setOffers((current) => current.filter((item) => item.request_id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kërkesa nuk mund të fshihet."
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteOffer(id: string) {
    if (!window.confirm("A dëshiron ta fshish këtë ofertë?")) return;

    setBusy(id);
    setError("");

    try {
      const { error } = await supabase
        .from("service_request_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setOffers((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Oferta nuk mund të fshihet."
      );
    } finally {
      setBusy("");
    }
  }

  const stats = [
    { label: "Profesionistë", value: professionals.length, icon: "🛠️" },
    { label: "Kërkesa", value: requests.length, icon: "📋" },
    {
      label: "Kërkesa të hapura",
      value: requests.filter((request) => request.status === "open").length,
      icon: "🟢",
    },
    { label: "Oferta", value: offers.length, icon: "💬" },
    { label: "Përdorues", value: users.length, icon: "👥" },
  ];

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        Duke kontrolluar qasjen dhe të dhënat...
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-xl font-bold">Qasje e kufizuar</h1>
          <p className="mt-3 text-sm text-red-300">
            {error || "Nuk ke leje për të hapur këtë faqe."}
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold hover:bg-blue-500"
          >
            Shko te kyçja
          </Link>
        </div>
      </main>
    );
  }

  const visibleRequests =
    tab === "overview" ? requests.slice(0, 5) : requests;
  const visibleOffers = tab === "overview" ? offers.slice(0, 5) : offers;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-blue-400">
              THIRRE
            </p>
            <h1 className="mt-1 text-2xl font-black">Admin Dashboard</h1>
            <p className="mt-1 text-xs text-slate-400">
              Menaxhimi i platformës
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Shiko faqen
            </Link>
            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold hover:bg-blue-500"
            >
              ↻ Rifresko
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-7 px-5 py-6">
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <nav
          className="flex flex-wrap gap-2"
          aria-label="Seksionet e administratorit"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                tab === item.id
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <span className="mr-2" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <section>
            <h2 className="mb-4 text-lg font-bold">Statistikat</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <span className="text-xl" aria-hidden="true">
                      {stat.icon}
                    </span>
                  </div>
                  <p className="mt-4 text-3xl font-black">{stat.value}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {(tab === "overview" || tab === "professionals") && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Profesionistët</h2>
              <span className="text-sm text-slate-400">
                {professionals.length} gjithsej
              </span>
            </div>

            {professionals.length === 0 ? (
              <EmptyState text="Nuk ka ende profile profesionistësh." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Biznesi</th>
                      <th className="px-4 py-3 font-semibold">Kategoria</th>
                      <th className="px-4 py-3 font-semibold">Qyteti</th>
                      <th className="px-4 py-3 font-semibold">Veprimet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {(tab === "overview"
                      ? professionals.slice(0, 5)
                      : professionals
                    ).map((professional) => (
                      <tr key={professional.id}>
                        <td className="px-4 py-4 font-bold">
                          {professional.business_name || "Pa emër biznesi"}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {professional.category || "Pa kategori"}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {professional.city || "Pa qytet"}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              void deleteProfessional(professional.id)
                            }
                            disabled={busy === professional.id}
                            className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {busy === professional.id ? "Duke fshirë..." : "Fshije"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {(tab === "overview" || tab === "requests") && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Kërkesat</h2>
              <span className="text-sm text-slate-400">
                {requests.length} gjithsej
              </span>
            </div>

            {visibleRequests.length === 0 ? (
              <EmptyState text="Nuk ka kërkesa për t'u shfaqur." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleRequests.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold">{request.title}</h3>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                          request.status === "open"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {request.status === "open" ? "E hapur" : "E mbyllur"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      {request.category || "Pa kategori"} · {request.city || "Pa qytet"}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleRequestStatus(request)}
                        disabled={busy === request.id}
                        className="rounded-lg border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
                      >
                        {busy === request.id
                          ? "Duke ruajtur..."
                          : request.status === "open"
                            ? "Mbylle"
                            : "Hape"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteRequest(request.id)}
                        disabled={busy === request.id}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Fshije
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {(tab === "overview" || tab === "offers") && (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Ofertat</h2>
              <span className="text-sm text-slate-400">
                {offers.length} gjithsej
              </span>
            </div>

            {visibleOffers.length === 0 ? (
              <EmptyState text="Nuk ka oferta për t'u shfaqur." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {visibleOffers.map((offer) => (
                  <article
                    key={offer.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <p className="break-all text-xs text-slate-500">
                      Kërkesa: {offer.request_id}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                      {offer.message}
                    </p>
                    <p className="mt-3 break-all text-xs text-slate-500">
                      Përdoruesi: {offer.user_id}
                    </p>
                    <button
                      type="button"
                      onClick={() => void deleteOffer(offer.id)}
                      disabled={busy === offer.id}
                      className="mt-4 rounded-lg border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {busy === offer.id ? "Duke fshirë..." : "Fshije ofertën"}
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "users" && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Përdoruesit</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Kërko, filtro dhe kliko email-in për detaje.
                </p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
                {filteredUsers.length} nga {users.length}
              </span>
            </div>

            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-3">
              <label className="text-sm text-slate-300">
                Kërko përdoruesin
                <input
                  type="search"
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Email ose ID..."
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="text-sm text-slate-300">
                Lloji i llogarisë
                <select
                  value={userFilter}
                  onChange={(event) =>
                    setUserFilter(event.target.value as UserFilter)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="all">Të gjithë përdoruesit</option>
                  <option value="professional">Profesionistë</option>
                  <option value="client">Klientë / pa profil</option>
                </select>
              </label>

              <label className="text-sm text-slate-300">
                Renditja
                <select
                  value={userSort}
                  onChange={(event) =>
                    setUserSort(event.target.value as "newest" | "oldest")
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="newest">Më të rinjtë së pari</option>
                  <option value="oldest">Më të vjetrit së pari</option>
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  setUserSearch("");
                  setUserFilter("all");
                  setUserSort("newest");
                }}
                className="w-fit rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                Pastro filtrat
              </button>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState text="Nuk u gjet asnjë përdorues." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Email-i</th>
                      <th className="px-4 py-3 font-semibold">Lloji</th>
                      <th className="px-4 py-3 font-semibold">ID e përdoruesit</th>
                      <th className="px-4 py-3 font-semibold">Regjistruar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/users/${encodeURIComponent(user.id)}`}
                            className="break-all font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                          >
                            {user.email || "Pa email"}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                            {professionalUserIds.has(user.id)
                              ? "Profesionist"
                              : "Klient / pa profil"}
                          </span>
                        </td>
                        <td className="break-all px-4 py-4 font-mono text-xs text-slate-400">
                          {user.id}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {new Date(user.created_at).toLocaleDateString("sq-AL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}
