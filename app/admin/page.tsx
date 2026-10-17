
"use client";

import { useEffect, useMemo, useState } from "react";
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

type Tab =
  | "overview"
  | "professionals"
  | "requests"
  | "offers"
  | "users";

type UserFilter = "all" | "professional" | "client";

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

  async function loadData() {
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

      // Kontrollo nëse përdoruesi është administrator.
      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc("is_admin");

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

      setProfessionals(professionalsResult.data ?? []);
      setRequests(requestsResult.data ?? []);
      setOffers(offersResult.data ?? []);
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
  }

  useEffect(() => {
    void loadData();
  }, []);

  const professionalUserIds = useMemo(
    () => new Set(professionals.map((p) => p.user_id)),
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

      setProfessionals((current) =>
        current.filter((item) => item.id !== id)
      );
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
          item.id === request.id
            ? { ...item, status: nextStatus }
            : item
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

      setRequests((current) =>
        current.filter((item) => item.id !== id)
      );

      setOffers((current) =>
        current.filter((item) => item.request_id !== id)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kërkesa nuk mund të fshihet."
      );
    } finally {
      setBusy("");
    }
  }

  async function deleteOffer(id: string) {
    if (!window.confirm("A dëshiron ta fshish këtë ofertë?")) {
      return;
    }

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
    { label: "Profesionistë", value: professionals.length, icon: "👨‍🔧" },
    { label: "Kërkesa", value: requests.length, icon: "📋" },
    {
      label: "Kërkesa të hapura",
      value: requests.filter((r) => r.status === "open").length,
      icon: "🟢",
    },
    { label: "Oferta", value: offers.length, icon: "💬" },
    { label: "Përdorues", value: users.length, icon: "👥" },
  ];

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Përmbledhje", icon: "▦" },
    { id: "professionals", label: "Profesionistët", icon: "♙" },
    { id: "requests", label: "Kërkesat", icon: "☷" },
    { id: "offers", label: "Ofertat", icon: "↗" },
    { id: "users", label: "Përdoruesit", icon: "♙" },
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
          <div className="text-5xl">🔐</div>
          <h1 className="mt-5 text-2xl font-bold">THIRRE Admin</h1>
          <p className="mt-3 text-sm text-slate-400">{error}</p>
          <a
            href="/login"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500"
          >
            Shko te kyçja
          </a>
          <button
            onClick={() => void loadData()}
            className="ml-2 mt-6 rounded-xl border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
          >
            Provo përsëri
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              THIRRE
            </p>
            <h1 className="mt-1 text-2xl font-black">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-400">
              Menaxhimi i platformës
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Shiko faqen
            </Link>
            <button
              onClick={() => void loadData()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
            >
              ↻ Rifresko
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <nav className="mb-8 flex flex-wrap gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold">Statistikat</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-slate-400">{stat.label}</span>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className="mt-4 text-3xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(tab === "overview" || tab === "professionals") && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Profesionistët</h2>
              <span className="text-sm text-slate-400">
                {professionals.length} gjithsej
              </span>
            </div>

            {professionals.length === 0 ? (
              <EmptyState text="Nuk ka profesionistë për t'u shfaqur." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-4">Biznesi</th>
                      <th className="p-4">Kategoria</th>
                      <th className="p-4">Qyteti</th>
                      <th className="p-4">Veprimet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {professionals.map((p) => (
                      <tr key={p.id} className="bg-slate-950 hover:bg-slate-900/70">
                        <td className="p-4 font-semibold">{p.business_name || "Pa emër"}</td>
                        <td className="p-4 text-slate-300">{p.category || "—"}</td>
                        <td className="p-4 text-slate-300">{p.city || "—"}</td>
                        <td className="p-4">
                          <button
                            disabled={busy === p.id}
                            onClick={() => void deleteProfessional(p.id)}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {busy === p.id ? "Duke punuar..." : "Fshije"}
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
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Kërkesat</h2>
              <span className="text-sm text-slate-400">{requests.length} gjithsej</span>
            </div>

            {requests.length === 0 ? (
              <EmptyState text="Nuk ka kërkesa për t'u shfaqur." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {requests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="font-bold">{request.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs ${
                        request.status === "open"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-slate-700 text-slate-300"
                      }`}>
                        {request.status === "open" ? "E hapur" : request.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      {request.category || "Pa kategori"} Â· {request.city || "Pa qytet"}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        disabled={busy === request.id}
                        onClick={() => void toggleRequestStatus(request)}
                        className="rounded-lg border border-blue-500/30 px-3 py-2 text-sm text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
                      >
                        {request.status === "open" ? "Mbylle" : "Rihape"}
                      </button>
                      <button
                        disabled={busy === request.id}
                        onClick={() => void deleteRequest(request.id)}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
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
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Ofertat</h2>
              <span className="text-sm text-slate-400">{offers.length} gjithsej</span>
            </div>

            {offers.length === 0 ? (
              <EmptyState text="Nuk ka oferta për t'u shfaqur." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {offers.map((offer) => (
                  <article key={offer.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-xs text-slate-500">Kërkesa: {offer.request_id}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{offer.message}</p>
                    <p className="mt-3 text-xs text-slate-500">Përdoruesi: {offer.user_id}</p>
                    <button
                      disabled={busy === offer.id}
                      onClick={() => void deleteOffer(offer.id)}
                      className="mt-4 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Fshije ofertën
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "users" && (
          <section className="mb-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Përdoruesit</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Kërko, filtro dhe kliko email-in për detaje.
                </p>
              </div>
              <span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300">
                {filteredUsers.length} nga {users.length}
              </span>
            </div>

            <div className="mb-5 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-3">
              <div>
                <label htmlFor="user-search" className="mb-2 block text-sm text-slate-400">
                  Kërko përdoruesin
                </label>
                <input
                  id="user-search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Email ose ID..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="user-filter" className="mb-2 block text-sm text-slate-400">
                  Lloji i llogarisë
                </label>
                <select
                  id="user-filter"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as UserFilter)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="all">Të gjithë përdoruesit</option>
                  <option value="professional">Profesionistë</option>
                  <option value="client">Klientë / pa profil profesionisti</option>
                </select>
              </div>

              <div>
                <label htmlFor="user-sort" className="mb-2 block text-sm text-slate-400">
                  Renditja
                </label>
                <select
                  id="user-sort"
                  value={userSort}
                  onChange={(e) => setUserSort(e.target.value as "newest" | "oldest")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option value="newest">Më të rinjtë së pari</option>
                  <option value="oldest">Më të vjetrit së pari</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => {
                    setUserSearch("");
                    setUserFilter("all");
                    setUserSort("newest");
                  }}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Pastro filtrat
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <EmptyState text="Nuk u gjet asnjë përdorues me këta filtra." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-4">Email-i</th>
                      <th className="p-4">Lloji</th>
                      <th className="p-4">ID e përdoruesit</th>
                      <th className="p-4">Regjistruar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.map((user) => {
                      const isProfessional = professionalUserIds.has(user.id);

                      return (
                        <tr key={user.id} className="bg-slate-950 hover:bg-slate-900/70">
                          <td className="p-4 font-medium">
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {user.email || "Pa email"}
                            </Link>
                          </td>
                          <td className="p-4">
                            <span className={`rounded-full px-3 py-1 text-xs ${
                              isProfessional
                                ? "bg-blue-500/10 text-blue-300"
                                : "bg-slate-800 text-slate-300"
                            }`}>
                              {isProfessional ? "Profesionist" : "Klient / pa profil"}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-slate-400">
                            {user.id}
                          </td>
                          <td className="p-4 text-slate-300">
                            {new Date(user.created_at).toLocaleDateString("sq-AL")}
                          </td>
                        </tr>
                      );
                    })}
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
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}
