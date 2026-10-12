
"use client";

import { useState } from "react";

const categories = [
  { name: "Elektricistë", icon: "⚡", desc: "Instalime dhe riparime" },
  { name: "Hidraulikë", icon: "🔧", desc: "Ujë, gypa dhe sanitari" },
  { name: "Pastrim", icon: "✨", desc: "Shtëpi dhe lokale" },
  { name: "Renovime", icon: "🏠", desc: "Rregullim dhe ndërtim" },
];

const professionals = [
  { name: "Arben Krasniqi", job: "Elektricist", city: "Prishtinë", rating: "4.9", reviews: 28, icon: "⚡", color: "#eaf2ff" },
  { name: "Blerim Gashi", job: "Hidraulik", city: "Prishtinë", rating: "4.8", reviews: 19, icon: "🔧", color: "#e8f8f1" },
  { name: "Elira Home Clean", job: "Pastrim profesional", city: "Fushë Kosovë", rating: "5.0", reviews: 14, icon: "✨", color: "#f4eaff" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = professionals.filter((p) => {
    const term = search.toLowerCase();
    return `${p.name} ${p.job} ${p.city}`.toLowerCase().includes(term)
      && (!selected || p.job.toLowerCase().includes(selected.toLowerCase()));
  });

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#15233b]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
          <a href="#" className="flex items-center gap-2 text-2xl font-black tracking-tight text-blue-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-xl text-white">T</span>
            THIRRE<span className="text-blue-500">.</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#kategorite" className="hover:text-blue-700">Kategoritë</a>
            <a href="#profesionistet" className="hover:text-blue-700">Profesionistët</a>
            <a href="#si-funksionon" className="hover:text-blue-700">Si funksionon</a>
          </nav>
          <button onClick={() => setMenuOpen(!menuOpen)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold md:hidden">
            {menuOpen ? "Mbyll ✕" : "☰ Menu"}
          </button>
          <a href="#regjistrohu" className="hidden rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 md:block">
            Ofro shërbime
          </a>
        </div>
        {menuOpen && (
          <div className="flex flex-col gap-4 border-t border-slate-100 bg-white px-6 py-5 text-sm font-semibold md:hidden">
            <a href="#kategorite" onClick={() => setMenuOpen(false)}>Kategoritë</a>
            <a href="#profesionistet" onClick={() => setMenuOpen(false)}>Profesionistët</a>
            <a href="#si-funksionon" onClick={() => setMenuOpen(false)}>Si funksionon</a>
            <a href="#regjistrohu" onClick={() => setMenuOpen(false)}>Ofro shërbime</a>
          </div>
        )}
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#102b67] via-[#1747a5] to-[#2878e8] text-white">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Shërbime lokale, më lehtë
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Profesionisti i duhur, <span className="text-blue-200">pa humbur kohë.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 md:text-lg">
              Gjej mjeshtrin që të duhet. Krahaso ofertat, zbulo profesionistë dhe gjej zgjidhjen për shtëpinë tënde në Kosovë.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); document.getElementById("profesionistet")?.scrollIntoView({ behavior: "smooth" }); }} className="mt-9 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl shadow-blue-950/20 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <span className="text-xl">⌕</span>
                <input value={search} onChange={(e) => { setSearch(e.target.value); setSelected(""); }} placeholder="Çfarë shërbimi po kërkon?" className="w-full py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400" />
              </div>
              <button type="submit" className="rounded-xl bg-blue-700 px-7 py-4 font-bold text-white transition hover:bg-blue-800">
                Kërko profesionist
              </button>
            </form>
            <p className="mt-4 text-sm text-blue-100">Për elektricitet, ujësjellës, pastrim dhe renovime.</p>
          </div>

          <div className="hidden md:block">
            <div className="ml-auto max-w-md rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-white/15 pb-5">
                <div>
                  <p className="text-sm text-blue-100">THIRRE për shtëpinë tënde</p>
                  <h2 className="mt-1 text-xl font-bold">Çfarë të duhet sot?</h2>
                </div>
                <span className="text-3xl">⌂</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <button key={c.name} onClick={() => { setSelected(c.name === "Elektricistë" ? "Elektricist" : c.name === "Hidraulikë" ? "Hidraulik" : c.name === "Pastrim" ? "Pastrim" : "Renovime"); document.getElementById("profesionistet")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-2xl border border-white/15 bg-white/10 p-5 text-left transition hover:bg-white/20">
                    <span className="text-3xl">{c.icon}</span>
                    <p className="mt-4 font-bold">{c.name}</p>
                    <p className="mt-1 text-xs leading-5 text-blue-100">{c.desc}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4 text-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-xl">✓</div>
                  <div>
                    <p className="font-bold">Kërko. Krahaso. Zgjedh.</p>
                    <p className="mt-1 text-xs text-slate-500">Një mënyrë më e thjeshtë për të gjetur ndihmë.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="kategorite" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Gjej sipas kategorisë</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Çfarë pune të duhet?</h2>
            <p className="mt-3 text-slate-500">Zgjedh shërbimin dhe fillo kërkimin.</p>
          </div>
          <span className="text-sm font-semibold text-slate-500">4 kategori fillestare</span>
        </div>
        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <button key={c.name} onClick={() => { setSelected(c.name === "Elektricistë" ? "Elektricist" : c.name === "Hidraulikë" ? "Hidraulik" : c.name === "Pastrim" ? "Pastrim" : "Renovime"); setSearch(""); document.getElementById("profesionistet")?.scrollIntoView({ behavior: "smooth" }); }} className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl transition group-hover:bg-blue-100">{c.icon}</span>
              <h3 className="mt-5 text-lg font-extrabold">{c.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{c.desc}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700">Shiko shërbimet <span>→</span></span>
            </button>
          ))}
        </div>
      </section>

      <section id="profesionistet" className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Eksploro</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Profesionistë për ty</h2>
              <p className="mt-3 text-slate-500">Shembuj demonstrues të mënyrës si do të paraqiten profilet.</p>
            </div>
            {selected && <button onClick={() => setSelected("")} className="self-start rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">Hiq filtrin ×</button>}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-lg font-bold">Nuk u gjet asnjë rezultat.</p>
              <p className="mt-2 text-sm text-slate-500">Provo një emër tjetër ose hiqe filtrin.</p>
              <button onClick={() => { setSearch(""); setSelected(""); }} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Pastro kërkimin</button>
            </div>
          ) : (
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <article key={p.name} className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{ backgroundColor: p.color }} className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">{p.icon}</div>
                      <div>
                        <h3 className="font-extrabold">{p.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{p.job}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Shembull</span>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                    <span className="text-slate-500">⌖ {p.city}</span>
                    <span className="font-bold text-amber-600">★ {p.rating} <span className="font-normal text-slate-400">({p.reviews})</span></span>
                  </div>
                  <button onClick={() => alert("Ky është vetëm demonstrim. Kontakti dhe ofertat do të aktivizohen në hapin tjetër.")} className="mt-5 w-full rounded-xl border border-blue-200 px-4 py-3 font-bold text-blue-700 transition hover:bg-blue-50">Shiko profilin</button>
                </article>
              ))}
            </div>
          )}
          <p className="mt-6 text-xs leading-5 text-slate-400">Shënim: profilet dhe vlerësimet e mësipërme janë shembuj demonstrues, jo profesionistë realë të verifikuar.</p>
        </div>
      </section>

      <section id="si-funksionon" className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Thjeshtë dhe shpejt</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Si funksionon THIRRE?</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", title: "Trego çfarë të duhet", text: "Përshkruaje punën dhe vendndodhjen tënde." },
            { n: "02", title: "Krahaso ofertat", text: "Merr oferta dhe krahaso çmimet e profesionistëve." },
            { n: "03", title: "Zgjedh profesionistin", text: "Kontakto personin që të përshtatet më së miri." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-sm font-black tracking-widest text-blue-700">{s.n}</span>
              <h3 className="mt-4 text-xl font-extrabold">{s.title}</h3>
              <p className="mt-3 leading-7 text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="regjistrohu" className="px-5 pb-16 md:px-8 md:pb-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#102b67] p-8 text-white sm:flex-row sm:items-center md:p-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-blue-200">Për profesionistë</p>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">Gjej më shumë klientë me THIRRE.</h2>
            <p className="mt-3 max-w-xl leading-7 text-blue-100">Bëhu pjesë e platformës dhe ndihmo klientët të gjejnë shërbimin e duhur.</p>
          </div>
          <button onClick={() => alert("Regjistrimi i profesionistëve do të aktivizohet në hapin e ardhshëm.")} className="shrink-0 rounded-xl bg-white px-6 py-4 font-extrabold text-blue-800 transition hover:bg-blue-50">Regjistrohu si profesionist</button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <a href="#" className="text-lg font-black text-blue-700">THIRRE.</a>
          <p>Gjej profesionistin e duhur. © {new Date().getFullYear()} THIRRE.</p>
          <p>Projekt në zhvillim · Kosovë</p>
        </div>
      </footer>
    </main>
  );
}
