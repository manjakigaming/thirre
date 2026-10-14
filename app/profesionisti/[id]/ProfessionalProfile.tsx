"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Professional = {
  id: string;
  user_id: string;
  business_name: string;
  category: string;
  city: string;
  phone?: string | null;
  description?: string | null;
};

function getIcon(category: string) {
  const value = category.toLowerCase();

  if (value.includes("elektricist")) return "⚡";
  if (value.includes("hidraulik")) return "🔧";
  if (value.includes("pastrim")) return "✨";
  if (value.includes("renovim")) return "🏠";

  return "🛠️";
}

export default function ProfessionalProfile() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [professional, setProfessional] =
    useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfessional() {
      setLoading(true);
      setError("");

      try {
        const [profileResult, userResult] = await Promise.all([
          supabase
            .from("professional_profiles")
            .select(
              "id, user_id, business_name, category, city, phone, description"
            )
            .eq("id", id)
            .maybeSingle(),
          supabase.auth.getUser(),
        ]);

        if (!active) return;

        if (profileResult.error) {
          setError("Profili nuk mund të ngarkohet. Provo përsëri.");
          return;
        }

        if (!profileResult.data) {
          setError("Ky profesionist nuk u gjet.");
          return;
        }

        const profile = profileResult.data as Professional;
        setProfessional(profile);

        const currentUser = userResult.data.user;
        setIsOwner(
          Boolean(currentUser && currentUser.id === profile.user_id)
        );
      } catch {
        if (active) {
          setError("Ndodhi një gabim gjatë ngarkimit të profilit.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      void loadProfessional();
    } else {
      setLoading(false);
      setError("ID-ja e profesionistit mungon.");
    }

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
        >
          <span aria-hidden="true">←</span>
          Kthehu te THIRRE
        </Link>

        {loading ? (
          <div
            role="status"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm"
          >
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
            <p className="font-semibold text-slate-600">
              Duke ngarkuar profilin...
            </p>
          </div>
        ) : error ? (
          <section
            role="status"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-black">{error}</h1>

            <p className="mt-3 leading-7 text-slate-500">
              Kontrollo adresën ose kthehu te lista e profesionistëve.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              Shiko profesionistët
            </Link>
          </section>
        ) : professional ? (
          <article className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
            <header className="relative overflow-hidden bg-gradient-to-br from-[#082b68] via-[#0755aa] to-[#0879e8] px-6 py-10 text-white sm:px-10 sm:py-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-blue-300/10 blur-2xl"
              />

              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-4xl shadow-lg backdrop-blur-sm">
                  {getIcon(professional.category)}
                </div>

                <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Profili i profesionistit
                </div>

                <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-4xl">
                  {professional.business_name}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">
                    {professional.category}
                  </span>

                  <span className="text-sm font-medium text-blue-100">
                    📍 {professional.city}, Kosovë
                  </span>
                </div>

                <p className="mt-5 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Njihuni me shërbimet që ofron ky profesionist në Kosovë.
                </p>
              </div>
            </header>

            <div className="p-6 sm:p-10">
              <section>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                    📋
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Informacion
                    </p>
                    <h2 className="text-xl font-black sm:text-2xl">
                      Rreth shërbimeve
                    </h2>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-wrap break-words leading-8 text-slate-600">
                  {professional.description?.trim() ||
                    "Ky profesionist ende nuk ka shtuar përshkrimin e shërbimeve."}
                </p>
              </section>

              <div className="my-8 border-t border-slate-100" />

              {isOwner ? (
                <section className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl">
                      ✏️
                    </div>

                    <div>
                      <h2 className="font-black text-blue-950">
                        Menaxho profilin tënd
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Përditëso emrin, kategorinë, qytetin dhe përshkrimin
                        e shërbimeve kur të kesh nevojë.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/offer-services"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-800 sm:w-auto"
                  >
                    ✏️ Ndrysho profilin
                  </Link>
                </section>
              ) : (
                <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                      🔎
                    </div>

                    <div>
                      <h2 className="font-black text-slate-900">
                        Po kërkon këtë shërbim?
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Shiko shërbimet që ofron ky profesionist dhe gjej
                        personin e duhur për punën që të nevojitet.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <p className="mt-8 text-center text-xs text-slate-400">
                THIRRE · Gjej profesionistin e duhur në Kosovë
              </p>
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}