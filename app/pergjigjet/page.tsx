
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ServiceRequest = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  status: string;
  created_at?: string;
};

type ResponseItem = {
  id: string;
  request_id: string;
  user_id: string;
  message: string;
  created_at: string;
};

type Tab = "requests" | "offers";

export default function PergjigjetPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<ResponseItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<Tab>("requests");
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        setUserId(null);
        setRequests([]);
        setResponses([]);
        setIncomingOffers([]);
        return;
      }

      setUserId(user.id);

      const [requestResult, responseResult] = await Promise.all([
        supabase
          .from("service_requests")
          .select(
            "id, user_id, title, description, category, city, status, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("service_request_responses")
          .select("id, request_id, user_id, message, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (requestResult.error) throw requestResult.error;
      if (responseResult.error) throw responseResult.error;

      const requestData = (requestResult.data ?? []) as ServiceRequest[];
      const sentData = (responseResult.data ?? []) as ResponseItem[];

      setRequests(requestData);
      setResponses(sentData);

      const ownRequestIds = requestData
        .filter((request) => request.user_id === user.id)
        .map((request) => request.id);

      if (ownRequestIds.length > 0) {
        const { data, error: offersError } = await supabase
          .from("service_request_responses")
          .select("id, request_id, user_id, message, created_at")
          .in("request_id", ownRequestIds)
          .order("created_at", { ascending: false });

        if (offersError) throw offersError;
        setIncomingOffers((data ?? []) as ResponseItem[]);
      } else {
        setIncomingOffers([]);
      }
    } catch (err) {
      console.error("Gabim gjatÃ« ngarkimit:", err);
      setError(
        err instanceof Error
          ? `Gabim: ${err.message}`
          : "TÃ« dhÃ«nat nuk u ngarkuan. Provo pÃ«rsÃ«ri."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  async function sendResponse(request: ServiceRequest) {
    const message = (messages[request.id] ?? "").trim();

    setNotice("");
    setError("");

    if (!userId) {
      setError("Duhet tÃ« kyÃ§esh pÃ«r tÃ« dÃ«rguar ofertÃ«.");
      return;
    }

    if (request.user_id === userId) {
      setError("Nuk mund t'i dÃ«rgosh ofertÃ« kÃ«rkesÃ«s tÃ«nde.");
      return;
    }

    if (request.status !== "open") {
      setError("Kjo kÃ«rkesÃ« Ã«shtÃ« mbyllur dhe nuk pranon oferta.");
      return;
    }

    if (message.length < 5 || message.length > 2000) {
      setError("Oferta duhet tÃ« ketÃ« 5 deri nÃ« 2000 karaktere.");
      return;
    }

    setSendingId(request.id);

    try {
      const { error: insertError } = await supabase
        .from("service_request_responses")
        .insert({
          request_id: request.id,
          user_id: userId,
          message,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("Ke dÃ«rguar tashmÃ« ofertÃ« pÃ«r kÃ«tÃ« kÃ«rkesÃ«.");
        }
        throw insertError;
      }

      setMessages((current) => ({ ...current, [request.id]: "" }));
      setNotice("Oferta u dÃ«rgua me sukses!");
      await loadData();
    } catch (err) {
      console.error("Gabim gjatÃ« dÃ«rgimit tÃ« ofertÃ«s:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Oferta nuk u dÃ«rgua. Provo pÃ«rsÃ«ri."
      );
    } finally {
      setSendingId(null);
    }
  }

  async function closeRequest(request: ServiceRequest) {
    if (!userId || request.user_id !== userId) {
      setError("VetÃ«m pronari mund ta mbyllÃ« kÃ«rkesÃ«n.");
      return;
    }

    if (request.status !== "open") return;

    const confirmed = window.confirm(
      `A je i sigurt qÃ« dÃ«shiron ta mbyllÃ«sh kÃ«rkesÃ«n "${request.title}"?`
    );

    if (!confirmed) return;

    setNotice("");
    setError("");
    setClosingId(request.id);

    try {
      const { data, error: closeError } = await supabase.rpc(
        "close_service_request",
        { request_id: request.id }
      );

      if (closeError) throw closeError;

      if (data !== true) {
        throw new Error(
          "KÃ«rkesa nuk u mbyll. Mund tÃ« jetÃ« mbyllur mÃ« herÃ«t."
        );
      }

      setNotice("KÃ«rkesa u mbyll me sukses.");
      await loadData();
    } catch (err) {
      console.error("Gabim gjatÃ« mbylljes sÃ« kÃ«rkesÃ«s:", err);
      setError(
        err instanceof Error
          ? `Nuk u mbyll kÃ«rkesa: ${err.message}`
          : "KÃ«rkesa nuk u mbyll. Provo pÃ«rsÃ«ri."
      );
    } finally {
      setClosingId(null);
    }
  }

  const myResponseRequestIds = new Set(
    responses.map((response) => response.request_id)
  );

  const myRequests = requests.filter(
    (request) => request.user_id === userId
  );

  const requestById = new Map(
    requests.map((request) => [request.id, request])
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-bold text-blue-700 hover:text-blue-900"
        >
          â† Kthehu nÃ« THIRRE
        </Link>

        <header className="mt-6">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            THIRRE
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            KÃ«rkesat dhe ofertat
          </h1>
          <p className="mt-3 leading-7 text-slate-600">
            Shiko punÃ«t e publikuara, dÃ«rgo oferta dhe menaxho kÃ«rkesat e tua.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setTab("requests")}
            className={`rounded-xl px-4 py-3 text-sm font-bold ${
              tab === "requests"
                ? "bg-blue-700 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            KÃ«rkesat e klientÃ«ve
          </button>

          <button
            onClick={() => setTab("offers")}
            className={`rounded-xl px-4 py-3 text-sm font-bold ${
              tab === "offers"
                ? "bg-blue-700 text-white"
                : "border border-slate-300 bg-white text-slate-700"
            }`}
          >
            Ofertat pÃ«r kÃ«rkesat e mia ({incomingOffers.length})
          </button>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? "Duke ngarkuar..." : "Rifresko"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/kerkesat"
            className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800"
          >
            Publiko kÃ«rkesÃ«
          </Link>

          {!userId && !loading && (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-blue-700"
            >
              Hyr nÃ« llogari
            </Link>
          )}
        </div>

        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
          >
            {notice}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 break-words rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-slate-500">Duke ngarkuar tÃ« dhÃ«nat...</p>
        ) : tab === "requests" ? (
          requests.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-xl font-bold">Nuk ka kÃ«rkesa ende</h2>
              <p className="mt-2 text-sm text-slate-500">
                KÃ«rkesat e publikuara do tÃ« shfaqen kÃ«tu.
              </p>
            </div>
          ) : (
            <section className="mt-8 space-y-5">
              {requests.map((request) => {
                const isOwner = request.user_id === userId;
                const alreadyResponded = myResponseRequestIds.has(request.id);
                const isOpen = request.status === "open";

                return (
                  <article
                    key={request.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                        {request.category}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        ðŸ“ {request.city}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isOpen
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isOpen ? "E hapur" : "E mbyllur"}
                      </span>
                    </div>

                    <h2 className="mt-4 text-xl font-extrabold">
                      {request.title}
                    </h2>

                    <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
                      {request.description}
                    </p>

                    {request.created_at && (
                      <p className="mt-4 text-xs text-slate-400">
                        Publikuar mÃ«{" "}
                        {new Date(request.created_at).toLocaleDateString("sq-AL")}
                      </p>
                    )}

                    {isOwner ? (
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <p className="text-sm text-slate-600">
                          {isOpen
                            ? "Kjo Ã«shtÃ« kÃ«rkesa jote. Mund t'i shohÃ«sh ofertat te skeda pÃ«rkatÃ«se."
                            : "Kjo kÃ«rkesÃ« Ã«shtÃ« mbyllur. Ofertat e mÃ«parshme ruhen."}
                        </p>

                        {isOpen && (
                          <button
                            onClick={() => void closeRequest(request)}
                            disabled={closingId === request.id}
                            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {closingId === request.id
                              ? "Duke mbyllur..."
                              : "Mbylle kÃ«rkesÃ«n"}
                          </button>
                        )}
                      </div>
                    ) : !userId ? (
                      isOpen ? (
                        <Link
                          href="/login"
                          className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
                        >
                          KyÃ§u pÃ«r tÃ« dÃ«rguar ofertÃ«
                        </Link>
                      ) : (
                        <p className="mt-5 text-sm text-slate-500">
                          Kjo kÃ«rkesÃ« Ã«shtÃ« mbyllur.
                        </p>
                      )
                    ) : !isOpen ? (
                      <p className="mt-5 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
                        Kjo kÃ«rkesÃ« Ã«shtÃ« mbyllur dhe nuk pranon oferta tÃ« reja.
                      </p>
                    ) : alreadyResponded ? (
                      <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                        Ke dÃ«rguar tashmÃ« ofertÃ« pÃ«r kÃ«tÃ« kÃ«rkesÃ«.
                      </p>
                    ) : (
                      <div className="mt-6 border-t border-slate-100 pt-5">
                        <label
                          htmlFor={`message-${request.id}`}
                          className="mb-2 block text-sm font-bold"
                        >
                          DÃ«rgo ofertÃ«n tÃ«nde
                        </label>

                        <textarea
                          id={`message-${request.id}`}
                          value={messages[request.id] ?? ""}
                          onChange={(event) =>
                            setMessages((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={4}
                          minLength={5}
                          maxLength={2000}
                          placeholder="PÃ«rshkruaj si mund ta kryesh punÃ«n..."
                          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        />

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-xs text-slate-400">
                            {(messages[request.id] ?? "").length}/2000
                          </span>

                          <button
                            onClick={() => void sendResponse(request)}
                            disabled={sendingId === request.id}
                            className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                          >
                            {sendingId === request.id
                              ? "Duke dÃ«rguar..."
                              : "DÃ«rgo ofertÃ«n"}
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </section>
          )
        ) : !userId ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <h2 className="text-xl font-bold">KyÃ§u nÃ« llogari</h2>
            <p className="mt-2 text-sm text-slate-600">
              PÃ«r tÃ« parÃ« ofertat pÃ«r kÃ«rkesat e tua, duhet tÃ« kyÃ§esh.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              Hyr nÃ« llogari
            </Link>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">Ende nuk ke publikuar kÃ«rkesÃ«</h2>
            <p className="mt-2 text-sm text-slate-500">
              Kur profesionistÃ«t t&apos;u dÃ«rgojnÃ« oferta kÃ«rkesave tÃ« tua, ato do tÃ« shfaqen kÃ«tu.
            </p>
            <Link
              href="/kerkesat"
              className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              Publiko kÃ«rkesÃ«
            </Link>
          </div>
        ) : incomingOffers.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">Nuk ke marrÃ« oferta ende</h2>
            <p className="mt-2 text-sm text-slate-500">
              Ofertat do tÃ« shfaqen kÃ«tu pasi profesionistÃ«t t&apos;u pÃ«rgjigjen kÃ«rkesave tÃ« tua.
            </p>
          </div>
        ) : (
          <section className="mt-8 space-y-5">
            {incomingOffers.map((offer) => {
              const request = requestById.get(offer.request_id);

              return (
                <article
                  key={offer.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    Oferta pÃ«r kÃ«rkesÃ«n
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold">
                    {request?.title ?? "KÃ«rkesÃ« shÃ«rbimi"}
                  </h2>
                  {request && (
                    <p className="mt-2 text-sm text-slate-500">
                      {request.category} Â· {request.city}
                    </p>
                  )}
                  <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">
                    {offer.message}
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    DÃ«rguar mÃ«{" "}
                    {new Date(offer.created_at).toLocaleDateString("sq-AL")}
                  </p>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
