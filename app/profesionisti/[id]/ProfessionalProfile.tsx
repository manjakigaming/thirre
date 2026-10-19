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
  logo_url?: string | null;
  experience_years?: number | null;
  working_hours?: string | null;
  service_area?: string | null;
};

function getIcon(category: string) {
  const value = category.toLocaleLowerCase("sq-AL");

  if (value.includes("elektricist")) return "âš¡";
  if (value.includes("hidraulik")) return "ðŸ”§";
  if (value.includes("pastrim")) return "âœ¨";
  if (value.includes("renovim")) return "ðŸ ";

  return "ðŸ› ï¸";
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
              "id, user_id, business_name, category, city, phone, description, services, logo_url, experience_years, working_hours, service_area"
            )
            .eq("id", id)
            .maybeSingle(),
          supabase.auth.getUser(),
        ]);

        if (!active) return;

        if (profileResult.error) {
          setError("Profili nuk mund tÃ« ngarkohet. Provo pÃ«rsÃ«ri.");
          return;
        }

        if (!profileResult.data) {
          setError("Ky profesionist nuk u gjet.");
          return;
        }

        setProfessional(profileResult.data as Professional);

        const currentUser = userResult.data.user;

        setIsOwner(
          Boolean(
            currentUser &&
              currentUser.id === profileResult.data.user_id
          )
        );
      } catch {
        if (active) {
          setError("Ndodhi njÃ« gabim gjatÃ« ngarkimit tÃ« profilit.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      void loadProfessional();
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
            <span aria-hidden="true">â†</span>
            Kthehu te profesionistÃ«t
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
              âš ï¸
            </div>

            <h1 className="text-2xl font-black">{error}</h1>

            <p className="mt-3 leading-7 text-slate-500">
              Kontrollo adresÃ«n ose kthehu te lista e profesionistÃ«ve.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              Shiko profesionistÃ«t
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
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10 text-5xl shadow-lg backdrop-blur-sm sm:h-24 sm:w-24 sm:text-6xl">
                    {professional.logo_url ? (
                      <img
                        src={professional.logo_url}
                        alt={`Logoja e ${professional.business_name}`}
                        className="h-full w-full bg-white p-2 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getIcon(professional.category)
                    )}
                  </div>

                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-blue-50">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Profil profesional
                  </span>
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                  ShÃ«rbime nÃ« KosovÃ«
                </p>

                <h1 className="mt-3 break-words text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {professional.business_name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
                    {professional.category}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-blue-100">
                    <span aria-hidden="true">ðŸ“</span>
                    {professional.city}, KosovÃ«
                  </span>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                  Njihuni me profesionistin dhe shÃ«rbimet qÃ« ofron.
                </p>
              </div>
            </header>

            <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_280px] lg:gap-10 lg:p-12">
              <div className="min-w-0">
                <section>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xl">
                      ðŸ“‹
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                        Informacion
                      </p>
                      <h2 className="mt-1 text-xl font-black sm:text-2xl">
                        Rreth shÃ«rbimeve
                      </h2>
                    </div>
                  </div>

                  <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-8 text-slate-600 sm:text-base">
                    {professional.description?.trim() ||
                      "Ky profesionist ende nuk ka shtuar pÃ«rshkrimin e shÃ«rbimeve."}
                  </p>
                </section>

                <div className="my-8 border-t border-slate-100" />

                <section>
                  <h2 className="text-lg font-black">
                    ShÃ«rbimet qÃ« ofron
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    ShÃ«rbimet e zgjedhura nga ky profesionist.
                  </p>

                  {professional.services &&
                  professional.services.length > 0 ? (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {professional.services.map((service, index) => (
                        <li
                          key={`${service}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800"
                        >
                          <span aria-hidden="true">âœ“</span>
                          {service}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                      Ky profesionist ende nuk ka shtuar shÃ«rbime nÃ« listÃ«.
                    </p>
                  )}
                </section>

                <div className="my-8 border-t border-slate-100" />

                <section>
                  <h2 className="text-lg font-black">
                    Informacion pÃ«r profesionistin
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

                    {professional.experience_years != null && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          PÃ«rvoja
                        </p>
                        <p className="mt-2 break-words font-bold text-slate-900">
                          {professional.experience_years}{" "}
                          {professional.experience_years === 1 ? "vit" : "vite"}
                        </p>
                      </div>
                    )}

                    {professional.working_hours?.trim() && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          Orari i punÃ«s
                        </p>
                        <p className="mt-2 break-words font-bold text-slate-900">
                          {professional.working_hours}
                        </p>
                      </div>
                    )}

                    {professional.service_area?.trim() && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <p className="text-xs font-semibold text-slate-500">
                          Zona e shÃ«rbimit
                        </p>
                        <p className="mt-2 break-words font-bold text-slate-900">
                          {professional.service_area}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                    {isOwner ? "âœï¸" : "ðŸ”Ž"}
                  </div>

                  <h2 className="mt-4 font-black text-slate-900">
                    {isOwner
                      ? "Menaxho profilin tÃ«nd"
                      : "Po kÃ«rkon kÃ«tÃ« shÃ«rbim?"}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isOwner
                      ? "PÃ«rditÃ«so tÃ« dhÃ«nat e biznesit dhe listÃ«n e shÃ«rbimeve."
                      : "Shiko informacionin e profesionistit pÃ«r tÃ« kuptuar nÃ«se shÃ«rbimi tÃ« pÃ«rshtatet."}
                  </p>

                  {isOwner ? (
                    <Link
                      href="/offer-services"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white shadow-sm transition hover:bg-blue-800"
                    >
                      âœï¸ Ndrysho profilin
                    </Link>
                  ) : (
                    <Link
                      href="/#profesionistet"
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-center font-bold text-blue-800 transition hover:bg-blue-100"
                    >
                      Shiko profesionistÃ«t
                    </Link>
                  )}
                </section>

                {professional.phone?.trim() && (
                  <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Kontakt
                    </p>
                    <p className="mt-2 break-words font-bold text-slate-900">
                      {professional.phone}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Numri i kontaktit i vendosur nga profesionisti.
                    </p>
                  </section>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    THIRRE
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Gjej profesionistin e duhur pÃ«r punÃ«n qÃ« tÃ« nevojitet.
                  </p>
                </div>
              </aside>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/80 px-6 py-5 text-center sm:px-9">
              <p className="text-xs font-medium text-slate-400">
                THIRRE Â· Gjej profesionistin e duhur nÃ« KosovÃ«
              </p>
            </footer>
          </article>
        ) : null}
      </div>
    </main>
  );
}
