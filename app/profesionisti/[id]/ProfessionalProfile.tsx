
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
  services?: string[] | null;
};

function getIcon(category: string) {
  const value = category.toLocaleLowerCase("sq-AL");

  if (value.includes("elektricist")) return "⚡";
  if (value.includes("hidraulik")) return "🔧";
  if (value.includes("pastrim")) return "✨";
  if (value.includes("renovim")) return "🏠";

  return "🛠️";
}

export default function ProfessionalProfile() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [professional, setProfessional] = useState<Professional | null>(null);
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
              "id, user_id, business_name, category, city, phone, description, services"
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
    <main className="min-h-screen bg-[#f4f7fc] px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/#profesionistet"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <span aria-hidden="true">←</span>
            Kthehu te profesionistët
          </Link>

          <Link
            href="/"
            className="text-sm font-bold text-slate-500 transition hover:text-blue-700"
          >
            THIRRE.
          </Link>
        </div>

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
            role="alert"
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
          <article className="mt-7 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <header className="relative overflow-hidden bg-gradient-to-br from-[#082b68] via-[#0755aa] to-[#0879e8] px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-blue-300/10 blur-2xl"
              />

              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-5xl shadow-lg backdrop-blur-sm sm:h-24 sm:w-24 sm:text-6xl">
                    {getIcon(professional.category)}
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-blue-50">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Profil profesional
                  </span>
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  Shërbime në Kosovë
                </p>

                <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {professional.business_name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                    {professional.category}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-100">
                    <span aria-hidden="true">📍</span>
                    {professional.city}, Kosovë
                  </span>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                  Njihuni me profesionistin dhe shërbimet që ofron.
                </p>
              </div>
            </header>

            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_280px] lg:gap-10 lg:p-12">
              <div className="min-w-0">
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                      📋
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                        Informacion
                      </p>
                      <h2 className="mt-1 text-xl font-black sm:text-2xl">
                        Rreth shërbimeve
                      </h2>
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-8 text-slate-600 sm:text-base">
                    {professional.description?.trim() ||
                      "Ky profesionist ende nuk ka shtuar përshkrimin e shërbimeve."}
                  </p>
                </section>

                <div className="my-8 border-t border-slate-100" />

                <section>
                  <h2 className="text-lg font-black">
                    Shërbimet që ofron
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Shërbimet e zgjedhura nga ky profesionist.
                  </p>

                  {professional.services &&
                  professional.services.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {professional.services.map((service, index) => (
                        <li
                          key={`${service}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800"
                        >
                          <span aria-hidden="true">✓</span>
                          {service}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                      Ky profesionist ende nuk ka shtuar shërbime në listë.
                    </p>
                  )}
                </section>

                <div className="my-8 border-t border-slate-100" />

                <section>
                  <h2 className="text-lg font-black">
                    Informacion për profesionistin
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Kategoria
                      </p>
                      <p className="mt-2 break-words font-bold text-slate-900">
                        {professional.category}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Qyteti
                      </p>
                      <p className="mt-2 break-words font-bold text-slate-900">
                        {professional.city}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {isOwner ? "✏️" : "🔎"}
                  </div>

                  <h2 className="mt-4 font-black text-slate-900">
                    {isOwner
                      ? "Menaxho profilin tënd"
                      : "Po kërkon këtë shërbim?"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isOwner
                      ? "Përditëso të dhënat e biznesit dhe listën e shërbimeve."
                      : "Shiko informacionin e profesionistit për të kuptuar nëse shërbimi të përshtatet."}
                  </p>

                  {isOwner ? (
                    <Link
                      href="/offer-services"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-blue-800"
                    >
                      ✏️ Ndrysho profilin
                    </Link>
                  ) : (
                    <Link
                      href="/#profesionistet"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-center font-bold text-blue-800 transition hover:bg-blue-100"
                    >
                      Shiko profesionistët
                    </Link>
                  )}
                </section>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    THIRRE
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Gjej profesionistin e duhur për punën që të nevojitet.
                  </p>
                </div>
              </aside>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 text-center sm:px-9">
              <p className="text-xs font-medium text-slate-400">
                THIRRE · Gjej profesionistin e duhur në Kosovë
              </p>
            </footer>
          </article>
        ) : null}
      </div>
    </main>
  );
}
