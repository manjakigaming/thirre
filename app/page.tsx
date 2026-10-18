
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Professional = {
  id: string;
  business_name: string;
  category: string;
  city: string;
  phone?: string | null;
  description?: string | null;
  services?: string[] | null;
};

const categories = [
  {
    name: "Elektricistë",
    icon: "⚡",
    desc: "Instalime dhe riparime",
    match: "elektricist",
  },
  {
    name: "Hidraulikë",
    icon: "🔧",
    desc: "Ujë, gypa dhe sanitari",
    match: "hidraulik",
  },
  {
    name: "Pastrim",
    icon: "✨",
    desc: "Shtëpi dhe lokale",
    match: "pastrim",
  },
  {
    name: "Renovime",
    icon: "🏠",
    desc: "Rregullim dhe ndërtim",
    match: "renovim",
  },
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("sq-AL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getCategoryIcon(category: string) {
  const value = normalizeText(category);

  if (value.includes("elektricist")) return "⚡";
  if (value.includes("hidraulik")) return "🔧";
  if (value.includes("pastrim")) return "✨";
  if (value.includes("renovim")) return "🏠";

  return "🛠️";
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [profileResult, userResult] = await Promise.all([
          supabase
            .from("professional_profiles")
            .select(
              "id, business_name, category, city, phone, description, services"
            )
            .order("business_name", { ascending: true }),
          supabase.auth.getUser(),
        ]);

        if (!active) return;

        if (profileResult.error) {
          console.error(
            "Gabim gjatë leximit të profileve:",
            profileResult.error.message
          );
        } else {
          setProfessionals((profileResult.data ?? []) as Professional[]);
        }

        setUserEmail(userResult.data.user?.email ?? null);
      } catch (error) {
        console.error("Gabim gjatë ngarkimit:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Nuk u arrit çkyçja. Provo përsëri.");
      return;
    }

    setUserEmail(null);
    setMenuOpen(false);
  }

  const filtered = professionals.filter((professional) => {
    const term = normalizeText(search);

    const searchableText = normalizeText(
      [
        professional.business_name,
        professional.category,
        professional.city,
        professional.description ?? "",
        ...(Array.isArray(professional.services)
          ? professional.services
          : []),
      ].join(" ")
    );

    const matchesSearch = !term || searchableText.includes(term);

    const matchesCategory =
      !selected ||
      normalizeText(professional.category).includes(normalizeText(selected));

    return matchesSearch && matchesCategory;
  });

  function chooseCategory(name: string) {
    const category = categories.find((item) => item.name === name);

    setSelected(category?.match ?? "");
    setSearch("");
    setMenuOpen(false);

    document
      .getElementById("profesionistet")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function clearFilters() {
    setSelected("");
    setSearch("");
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#15233b]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black text-blue-700"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-xl text-white">
              T
            </span>
            THIRRE<span className="text-blue-500">.</span>
          </Link>

          <nav className="hidden items-center gap-4 whitespace-nowrap text-sm font-semibold text-slate-600 2xl:flex">
            <a href="#kategorite" className="hover:text-blue-700">
              Kategoritë
            </a>
            <a href="#profesionistet" className="hover:text-blue-700">
              Profesionistët
            </a>
            <Link href="/kerkesat" className="hover:text-blue-700">
              Kërko shërbim
            </Link>
            <a href="#si-funksionon" className="hover:text-blue-700">
              Si funksionon
            </a>
          </nav>

          <div className="hidden shrink-0 items-center gap-1.5 2xl:flex">
            {userEmail ? (
              <>
                <Link
                  href="/pergjigjet"
                  className="whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Kërkesat dhe ofertat
                </Link>
                <Link
                  href="/bisedat"
                  className="whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Bisedat
                </Link>
                <Link
                  href="/njoftimet"
                  className="whitespace-nowrap rounded-xl px-2 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  Njoftimet
                </Link>
                <span className="max-w-32 truncate text-xs font-semibold text-slate-600">
                  {userEmail}
                </span>
                <button
                  onClick={logout}
                  className="whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold hover:bg-slate-50"
                >
                  Dil
                </button>
                <Link
                  href="/offer-services"
                  className="whitespace-nowrap rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800"
                >
                  Ofro shërbime
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                >
                  Hyr
                </Link>
                <Link
                  href="/register"
                  className="whitespace-nowrap rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800"
                >
                  Regjistrohu
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="shrink-0 rounded-xl border px-4 py-2 text-sm font-bold 2xl:hidden"
            aria-expanded={menuOpen}
            aria-label="Hap menynë"
          >
            {menuOpen ? "Mbyll ✕" : "☰ Menu"}
          </button>
        </div>

        {menuOpen && (
          <div className="flex flex-col gap-4 border-t bg-white px-6 py-5 text-sm font-semibold 2xl:hidden">
            <a href="#kategorite" onClick={() => setMenuOpen(false)}>
              Kategoritë
            </a>
            <a href="#profesionistet" onClick={() => setMenuOpen(false)}>
              Profesionistët
            </a>
            <Link href="/kerkesat" onClick={() => setMenuOpen(false)}>
              Kërko shërbim
            </Link>
            <a href="#si-funksionon" onClick={() => setMenuOpen(false)}>
              Si funksionon
            </a>

            {userEmail ? (
              <>
                <Link href="/pergjigjet" onClick={() => setMenuOpen(false)}>
                  Kërkesat dhe ofertat
                </Link>
                <Link href="/bisedat" onClick={() => setMenuOpen(false)}>
                  Bisedat
                </Link>
                <Link href="/njoftimet" onClick={() => setMenuOpen(false)}>
                  Njoftimet
                </Link>
                <Link
                  href="/offer-services"
                  onClick={() => setMenuOpen(false)}
                >
                  Ofro shërbime
                </Link>
                <button
                  onClick={logout}
                  className="self-start text-red-600"
                >
                  Dil nga llogaria
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  Hyr në llogari
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  Regjistrohu
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#102b67] via-[#1747a5] to-[#2878e8] text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Shërbime lokale, më lehtë
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              Profesionisti i duhur,{" "}
              <span className="text-blue-200">pa humbur kohë.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 md:text-lg">
              Gjej mjeshtrin që të duhet. Krahaso ofertat dhe zbulo
              profesionistë për shtëpinë tënde në Kosovë.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                document
                  .getElementById("profesionistet")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="mt-9 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row"
            >
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelected("");
                }}
                placeholder="Kërko emër, shërbim ose qytet..."
                aria-label="Kërko sipas emrit, shërbimit ose qytetit"
                className="min-w-0 flex-1 px-3 py-3 text-sm text-slate-800 outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-blue-700 px-7 py-4 font-bold text-white hover:bg-blue-800"
              >
                Kërko profesionist
              </button>
            </form>

            <Link
              href="/kerkesat"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20 sm:w-auto"
            >
              Nuk e gjete profesionistin? Publiko kërkesë →
            </Link>

            <p className="mt-4 text-sm text-blue-100">
              Elektricitet, ujësjellës, pastrim dhe renovime.
            </p>
          </div>

          <div className="hidden md:block">
            <div className="ml-auto max-w-md rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <p className="text-sm text-blue-100">
                THIRRE për shtëpinë tënde
              </p>
              <h2 className="mt-1 border-b border-white/15 pb-5 text-xl font-bold">
                Çfarë të duhet sot?
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => chooseCategory(category.name)}
                    className="rounded-2xl border border-white/15 bg-white/10 p-5 text-left transition hover:bg-white/20"
                  >
                    <span className="text-3xl">{category.icon}</span>
                    <p className="mt-4 font-bold">{category.name}</p>
                    <p className="mt-1 text-xs text-blue-100">
                      {category.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 text-slate-800">
                <p className="font-bold">Kërko. Krahaso. Zgjedh.</p>
                <p className="mt-1 text-xs text-slate-500">
                  Gjej shërbimin e duhur në Kosovë.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="kategorite"
        className="mx-auto max-w-7xl px-5 py-16 md:px-8"
      >
        <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
          Gjej sipas kategorisë
        </p>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">
          Çfarë pune të duhet?
        </h2>
        <p className="mt-3 text-slate-500">
          Zgjedh shërbimin dhe fillo kërkimin.
        </p>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => chooseCategory(category.name)}
              className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                {category.icon}
              </span>
              <h3 className="mt-5 text-lg font-extrabold">{category.name}</h3>
              <p className="mt-2 text-sm text-slate-500">{category.desc}</p>
              <span className="mt-5 inline-block text-sm font-bold text-blue-700">
                Shiko shërbimet →
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        id="profesionistet"
        className="border-y border-slate-200 bg-white py-16 md:py-20"
      >
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            Eksploro
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Profesionistë për ty
          </h2>
          <p className="mt-3 text-slate-500">
            Profilet e regjistruara në THIRRE.
          </p>

          {(selected || search) && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-slate-600">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "profesionist i gjetur"
                  : "profesionistë të gjetur"}
              </p>
              <button
                onClick={clearFilters}
                className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                Hiq filtrin ×
              </button>
            </div>
          )}

          {loading ? (
            <p className="mt-8 text-slate-500">
              Duke ngarkuar profesionistët...
            </p>
          ) : filtered.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <div className="text-4xl">🔎</div>
              <p className="mt-4 text-lg font-bold">
                Nuk u gjetën profesionistë.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Provo një emër, qytet ose shërbim tjetër, ose hiqi filtrat.
              </p>
              <button
                onClick={clearFilters}
                className="mt-5 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
              >
                Shfaq të gjithë profesionistët
              </button>
              <Link
                href="/offer-services"
                className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                Ofro shërbime
              </Link>
            </div>
          ) : (
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((professional) => (
                <article
                  key={professional.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-xl"
                >
                  <Link
                    href={`/profesionisti/${professional.id}`}
                    className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    aria-label={`Shiko profilin e ${professional.business_name}`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                      {getCategoryIcon(professional.category)}
                    </div>
                    <h3 className="mt-4 text-lg font-extrabold hover:text-blue-700">
                      {professional.business_name}
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      {professional.category}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      📍 {professional.city}
                    </p>

                    {professional.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {professional.description}
                      </p>
                    )}

                    {professional.services &&
                      professional.services.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {professional.services.slice(0, 3).map((service) => (
                            <span
                              key={service}
                              className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800"
                            >
                              {service}
                            </span>
                          ))}
                          {professional.services.length > 3 && (
                            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                              +{professional.services.length - 3} të tjera
                            </span>
                          )}
                        </div>
                      )}

                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700">
                      Shiko profilin <span aria-hidden="true">→</span>
                    </span>
                  </Link>

                  {professional.phone && (
                    <a
                      href={`tel:${professional.phone}`}
                      className="mt-5 block rounded-xl bg-blue-700 px-4 py-3 text-center font-bold text-white hover:bg-blue-800"
                    >
                      Kontakto profesionistin
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="si-funksionon"
        className="mx-auto max-w-7xl px-5 py-16 md:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-700">
            Thjeshtë dhe shpejt
          </p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Si funksionon THIRRE?
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Trego çfarë të duhet",
              text: "Përshkruaje punën dhe vendndodhjen tënde.",
            },
            {
              n: "02",
              title: "Krahaso profesionistët",
              text: "Shiko shërbimet dhe krahaso profesionistët.",
            },
            {
              n: "03",
              title: "Kontakto profesionistin",
              text: "Zgjedh personin që të përshtatet më së miri.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <span className="text-sm font-black tracking-widest text-blue-700">
                {step.n}
              </span>
              <h3 className="mt-4 text-xl font-extrabold">{step.title}</h3>
              <p className="mt-3 leading-7 text-slate-500">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center sm:p-8">
          <h3 className="text-xl font-extrabold text-slate-900">
            Nuk e gjete profesionistin që të duhet?
          </h3>
          <p className="mt-2 text-slate-600">
            Publiko kërkesën tënde dhe trego çfarë pune kërkon.
          </p>
          <Link
            href="/kerkesat"
            className="mt-5 inline-flex rounded-xl bg-blue-700 px-6 py-3.5 font-bold text-white transition hover:bg-blue-800"
          >
            Publiko kërkesë →
          </Link>
        </div>
      </section>

      <section id="regjistrohu" className="px-5 pb-16 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#102b67] p-8 text-white sm:flex-row sm:items-center md:p-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-200">
              Për profesionistë
            </p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              Gjej më shumë klientë me THIRRE.
            </h2>
            <p className="mt-3 max-w-xl leading-7 text-blue-100">
              Regjistro shërbimet e tua dhe bëhu pjesë e platformës.
            </p>
          </div>
          <Link
            href="/offer-services"
            className="rounded-xl bg-white px-6 py-4 font-extrabold text-blue-800 hover:bg-blue-50"
          >
            Ofro shërbime
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <Link href="/" className="text-lg font-black text-blue-700">
            THIRRE.
          </Link>
          <p>Gjej profesionistin e duhur. © 2026 THIRRE.</p>
          <p>Projekt në zhvillim · Kosovë</p>
        </div>
      </footer>
    </main>
  );
}
