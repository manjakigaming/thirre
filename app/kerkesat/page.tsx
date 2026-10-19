
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  created_at: string;
};

const categories = [
  "Elektricist",
  "Hidraulik",
  "Pastrim",
  "Renovime",
  "Montim",
  "TjetÃ«r",
];

const cities = [
  "PrishtinÃ«",
  "Prizren",
  "PejÃ«",
  "GjakovÃ«",
  "Gjilan",
  "Ferizaj",
  "MitrovicÃ«",
  "Vushtrri",
  "PodujevÃ«",
  "KaÃ§anik",
  "SuharekÃ«",
  "Lipjan",
  "FushÃ« KosovÃ«",
];

export default function KerkesatPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Hidraulik");
  const [city, setCity] = useState("PrishtinÃ«");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  async function loadRequests() {
    setLoadingRequests(true);
    setRequestsError("");

    const { data, error } = await supabase
      .from("service_requests")
      .select("id, title, description, category, city, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Gabim gjatÃ« leximit tÃ« kÃ«rkesave:", error);
      setRequestsError(
        "KÃ«rkesat nuk mund tÃ« ngarkohen pÃ«r momentin. Provo pÃ«rsÃ«ri."
      );
    } else {
      setRequests((data ?? []) as ServiceRequest[]);
    }

    setLoadingRequests(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchRequests() {
      const { data, error } = await supabase
        .from("service_requests")
        .select("id, title, description, category, city, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Gabim gjate leximit te kerkesave:", error);
        setRequestsError(
          "Kerkesat nuk mund te ngarkohen per momentin. Provo perseri."
        );
      } else {
        setRequests((data ?? []) as ServiceRequest[]);
        setRequestsError("");
      }

      setLoadingRequests(false);
    }

    void fetchRequests();

    return () => {
      cancelled = true;
    };
  }, []);

  async function publishRequest(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setMessage(
          "Duhet tÃ« kyÃ§esh nÃ« llogarinÃ« tÃ«nde pÃ«r tÃ« publikuar kÃ«rkesÃ«."
        );
        return;
      }

      const { error } = await supabase
        .from("service_requests")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          city,
          description: description.trim(),
        });

      if (error) throw error;

      setTitle("");
      setCategory("Hidraulik");
      setCity("PrishtinÃ«");
      setDescription("");
      setSuccess(true);
      setMessage("KÃ«rkesa u publikua me sukses!");

      await loadRequests();
    } catch (error) {
      console.error("Gabim gjatÃ« publikimit:", error);
      setMessage(
        "KÃ«rkesa nuk u publikua. Kontrollo lidhjen dhe provo pÃ«rsÃ«ri."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link href="/"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          â† Kthehu nÃ« THIRRE
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
            THIRRE
          </p>

          <h1 className="mt-3 text-3xl font-extrabold">
            KÃ«rko njÃ« profesionist
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            Trego Ã§farÃ« pune tÃ« duhet dhe nÃ« cilin qytet.
            Publiko kÃ«rkesÃ«n qÃ« profesionistÃ«t ta shohin.
          </p>

          <form onSubmit={publishRequest} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold"
              >
                Ã‡farÃ« pune tÃ« duhet?
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
                maxLength={150}
                placeholder="P.sh. Montim i rubinetit"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Kategoria
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="mb-2 block text-sm font-semibold"
                >
                  Qyteti
                </label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                >
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold"
              >
                PÃ«rshkruaje punÃ«n
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                rows={5}
                placeholder="Shpjego Ã§farÃ« duhet tÃ« bÃ«het..."
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {description.length}/2000 karaktere
              </p>
            </div>

            {message && (
              <p
                role="status"
                className={`rounded-xl p-3 text-sm ${
                  success
                    ? "bg-green-50 text-green-800"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Duke publikuar..." : "Publiko kÃ«rkesÃ«n"}
            </button>

            <p className="text-xs leading-5 text-slate-500">
              Duhet tÃ« jesh i kyÃ§ur pÃ«r tÃ« publikuar kÃ«rkesÃ«.
            </p>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold">
                KÃ«rkesat e fundit
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                PunÃ« qÃ« kÃ«rkojnÃ« profesionistÃ« nÃ« KosovÃ«.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRequests()}
              disabled={loadingRequests}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60"
            >
              {loadingRequests ? "Duke ngarkuar..." : "Rifresko"}
            </button>
          </div>

          {loadingRequests ? (
            <p className="mt-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
              Duke ngarkuar kÃ«rkesat...
            </p>
          ) : requestsError ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {requestsError}
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="ml-2 font-bold underline"
              >
                Provo pÃ«rsÃ«ri
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="font-bold">Ende nuk ka kÃ«rkesa</h3>
              <p className="mt-2 text-sm text-slate-600">
                Kur tÃ« publikohet njÃ« kÃ«rkesÃ«, ajo do tÃ« shfaqet kÃ«tu.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              {requests.map((request) => (
                <article
                  key={request.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {request.category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {request.city}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold">
                    {request.title}
                  </h3>

                  <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                    {request.description}
                  </p>

                  <p className="mt-4 text-xs text-slate-500">
                    Publikuar mÃ«{" "}
                    {new Date(request.created_at).toLocaleDateString("sq-XK")}
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
