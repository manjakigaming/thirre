
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Conversation = {
  id: string;
  request_id: string;
  client_id: string;
  professional_id: string;
  created_at: string;
  request_title?: string;
  other_name?: string;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function BisedatPage() {
  const [userId, setUserId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadConversations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const user = authData.user;

      if (!user) {
        setUserId("");
        setConversations([]);
        setSelected(null);
        setMessages([]);
        return;
      }

      setUserId(user.id);

      const { data, error: queryError } = await supabase
        .from("conversations")
        .select("id, request_id, client_id, professional_id, created_at")
        .or(`client_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      const rows = (data ?? []) as Conversation[];
      const requestIds = [...new Set(rows.map((item) => item.request_id))];

      const professionalIds = [
        ...new Set(rows.map((item) => item.professional_id)),
      ];

      const [requestResult, profileResult] = await Promise.all([
        requestIds.length > 0
          ? supabase
              .from("service_requests")
              .select("id, title")
              .in("id", requestIds)
          : Promise.resolve({ data: [], error: null }),
        professionalIds.length > 0
          ? supabase
              .from("professional_profiles")
              .select("user_id, business_name")
              .in("user_id", professionalIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (requestResult.error) throw requestResult.error;
      if (profileResult.error) throw profileResult.error;

      const titleMap = new Map(
        (requestResult.data ?? []).map((item) => [item.id, item.title])
      );

      const nameMap = new Map(
        (profileResult.data ?? []).map((item) => [
          item.user_id,
          item.business_name,
        ])
      );

      const enriched: Conversation[] = rows.map((item) => {
        const otherId =
          item.client_id === user.id ? item.professional_id : item.client_id;

        return {
          ...item,
          request_title:
            titleMap.get(item.request_id) ?? "Kërkesë shërbimi",
          other_name:
            nameMap.get(otherId) ??
            (item.professional_id === otherId
              ? "Profesionist i THIRRE"
              : "Klient i THIRRE"),
        };
      });

      setConversations(enriched);
      setSelected((current) =>
        current
          ? enriched.find((item) => item.id === current.id) ?? null
          : null
      );
    } catch (err) {
      console.error("Gabim gjatë ngarkimit të bisedave:", err);
      setError(
        "Bisedat nuk u ngarkuan. Kontrollo lidhjen dhe qasjen në Supabase, pastaj provo përsëri."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setMessagesLoading(true);
    setError("");

    try {
      const { data, error: queryError } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (queryError) throw queryError;

      setMessages((data ?? []) as Message[]);
    } catch (err) {
      console.error("Gabim gjatë ngarkimit të mesazheve:", err);
      setError("Mesazhet nuk u ngarkuan. Kontrollo qasjen në Supabase.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadConversations();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selected) return;

    const conversationId = selected.id;
    let cancelled = false;

    async function fetchMessages() {
      setMessagesLoading(true);
      setError("");

      try {
        const { data, error: queryError } = await supabase
          .from("messages")
          .select("id, conversation_id, sender_id, body, created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (cancelled) return;
        if (queryError) throw queryError;

        setMessages((data ?? []) as Message[]);
      } catch (err) {
        if (cancelled) return;

        console.error("Gabim gjatë ngarkimit të mesazheve:", err);
        setError("Mesazhet nuk u ngarkuan. Provo përsëri.");
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    void fetchMessages();

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;

          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message]
          );
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [selected]);

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId || !selected || !draft.trim() || sending) return;

    const body = draft.trim();

    if (body.length > 5000) {
      setError("Mesazhi nuk mund të jetë më i gjatë se 5000 karaktere.");
      return;
    }

    setSending(true);
    setError("");
    setNotice("");

    try {
      const { error: insertError } = await supabase.from("messages").insert({
        conversation_id: selected.id,
        sender_id: userId,
        body,
      });

      if (insertError) throw insertError;

      setDraft("");
      setNotice("Mesazhi u dërgua.");
      await loadMessages(selected.id);
    } catch (err) {
      console.error("Gabim gjatë dërgimit të mesazhit:", err);
      setError(
        "Mesazhi nuk u dërgua. Kontrollo qasjen dhe politikat e Supabase."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="font-bold text-blue-700 hover:text-blue-900">
          ← Kthehu në THIRRE
        </Link>

        <header className="my-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            THIRRE
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Bisedat</h1>
          <p className="mt-2 text-slate-600">
            Komuniko me klientët dhe profesionistët për shërbimet e tua.
          </p>
        </header>

        {!userId && !loading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="font-bold">
              Duhet të kyçesh për t&apos;i parë bisedat.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
            >
              Kyçu në llogari
            </Link>
          </section>
        ) : (
          <div className="grid min-h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
            <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-slate-100 p-4">
                <h2 className="font-black">Bisedat e mia</h2>
                <button
                  type="button"
                  onClick={() => void loadConversations()}
                  disabled={loading}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? "Duke rifreskuar..." : "Rifresko"}
                </button>
              </div>

              {loading ? (
                <p className="p-5 text-sm text-slate-500">
                  Duke ngarkuar bisedat...
                </p>
              ) : conversations.length === 0 ? (
                <p className="p-5 text-sm leading-6 text-slate-500">
                  Ende nuk ke biseda. Biseda krijohet kur një profesionist
                  dërgon ofertë për kërkesën tënde.
                </p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto md:max-h-[650px]">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => {
                        setSelected(conversation);
                        setNotice("");
                        setError("");
                      }}
                      className={`w-full border-b border-slate-100 p-4 text-left transition hover:bg-blue-50 ${
                        selected?.id === conversation.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <p className="truncate font-bold">
                        {conversation.other_name}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {conversation.request_title}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="flex min-h-[480px] flex-col">
              {selected ? (
                <>
                  <div className="border-b border-slate-200 bg-slate-50 p-4 sm:p-5">
                    <h2 className="font-black">{selected.other_name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kërkesa: {selected.request_title}
                    </p>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
                    {messagesLoading ? (
                      <p className="py-10 text-center text-sm text-slate-500">
                        Duke ngarkuar mesazhet...
                      </p>
                    ) : messages.length === 0 ? (
                      <p className="py-10 text-center text-sm text-slate-500">
                        Fillo bisedën duke dërguar mesazhin e parë.
                      </p>
                    ) : (
                      messages.map((message) => {
                        const own = message.sender_id === userId;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              own ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                own
                                  ? "bg-blue-700 text-white"
                                  : "bg-slate-100 text-slate-900"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-sm">
                                {message.body}
                              </p>
                              <p
                                className={`mt-2 text-[10px] ${
                                  own ? "text-blue-100" : "text-slate-500"
                                }`}
                              >
                                {new Date(message.created_at).toLocaleString(
                                  "sq-XK",
                                  { dateStyle: "short", timeStyle: "short" }
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    onSubmit={sendMessage}
                    className="border-t border-slate-200 p-4 sm:p-5"
                  >
                    <label htmlFor="message" className="sr-only">
                      Mesazhi yt
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <textarea
                        id="message"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={5000}
                        rows={2}
                        placeholder="Shkruaj mesazhin..."
                        className="min-w-0 flex-1 resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        required
                      />
                      <button
                        type="submit"
                        disabled={sending || !draft.trim()}
                        className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending ? "Duke dërguar..." : "Dërgo"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl"
                    aria-hidden="true"
                  >
                    💬
                  </div>
                  <h2 className="mt-4 text-xl font-black">
                    Zgjidh një bisedë
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Zgjidh një bisedë nga lista për të lexuar dhe dërguar
                    mesazhe.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

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
