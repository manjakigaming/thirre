
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const categories = ["Elektricist", "Hidraulik", "Pastrim", "Renovime", "Tjetër"];

const suggestedServices: Record<string, string[]> = {
  Elektricist: [
    "Instalime elektrike",
    "Riparime elektrike",
    "Montim ndriçimi",
    "Montim prizash dhe çelësash",
    "Kontroll i instalimeve",
  ],
  Hidraulik: [
    "Riparime të ujësjellësit",
    "Montim i rubinetave",
    "Montim i lavamanëve",
    "Riparim i rrjedhjeve",
    "Instalim i ngrohjes",
  ],
  Pastrim: [
    "Pastrim i shtëpive",
    "Pastrim i banesave",
    "Pastrim i zyrave",
    "Pastrim pas renovimit",
    "Pastrim i dritareve",
  ],
  Renovime: [
    "Lyerje e mureve",
    "Vendosje e pllakave",
    "Punime me gips",
    "Renovim i banjove",
    "Renovim i kuzhinave",
  ],
  Tjetër: [
    "Montim mobiliesh",
    "Mirëmbajtje",
    "Riparime të ndryshme",
  ],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function OfferServicesPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Elektricist");
  const [city, setCity] = useState("Prishtinë");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [workingHours, setWorkingHours] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [customService, setCustomService] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
          setMessage(
            "Duhet të kyçesh në llogarinë tënde para se të ofrosh shërbime."
          );
          setMessageError(true);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("professional_profiles")
          .select(
            "business_name, category, city, phone, description, services, logo_url, experience_years, working_hours, service_area"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;

        if (error) {
          setMessage("Gabim gjatë ngarkimit të profilit: " + error.message);
          setMessageError(true);
          return;
        }

        if (data) {
          setHasProfile(true);
          setBusinessName(data.business_name ?? "");
          setCategory(data.category ?? "Elektricist");
          setCity(data.city ?? "Prishtinë");
          setPhone(data.phone ?? "");
          setDescription(data.description ?? "");
          setLogoUrl(data.logo_url ?? "");
          setExperienceYears(String(data.experience_years ?? 0));
          setWorkingHours(data.working_hours ?? "");
          setServiceArea(data.service_area ?? "");
          setServices(
            Array.isArray(data.services)
              ? data.services.filter(
                  (item): item is string => typeof item === "string"
                )
              : []
          );
        }
      } catch {
        if (active) {
          setMessage("Ndodhi një gabim gjatë ngarkimit të profilit.");
          setMessageError(true);
        }
      } finally {
        if (active) setLoadingProfile(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function toggleService(service: string) {
    setServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : current.length >= 20
          ? current
          : [...current, service]
    );

    setMessage("");
    setMessageError(false);
  }

  function addCustomService() {
    const value = customService.trim();

    if (!value) return;

    if (
      services.some(
        (item) =>
          item.toLocaleLowerCase("sq-AL") ===
          value.toLocaleLowerCase("sq-AL")
      )
    ) {
      setMessage("Ky shërbim është shtuar tashmë.");
      setMessageError(true);
      return;
    }

    if (services.length >= 20) {
      setMessage("Mund të shtosh deri në 20 shërbime.");
      setMessageError(true);
      return;
    }

    setServices((current) => [...current, value]);
    setCustomService("");
    setMessage("");
    setMessageError(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setMessageError(false);

    if (!userId) {
      setMessage("Kyçu në llogari para se ta ruash profilin.");
      setMessageError(true);
      return;
    }

    if (!businessName.trim() || !city.trim()) {
      setMessage("Plotëso emrin e biznesit dhe qytetin.");
      setMessageError(true);
      return;
    }

    if (!services.length) {
      setMessage("Zgjidh ose shto të paktën një shërbim.");
      setMessageError(true);
      return;
    }

    const years = Number.parseInt(experienceYears, 10);

    if (!Number.isFinite(years) || years < 0 || years > 80) {
      setMessage("Përvoja duhet të jetë një numër nga 0 deri në 80.");
      setMessageError(true);
      return;
    }

    if (logoUrl.trim()) {
      try {
        const parsed = new URL(logoUrl.trim());

        if (!["https:", "http:"].includes(parsed.protocol)) {
          throw new Error("URL e pavlefshme");
        }
      } catch {
        setMessage("Vendos një link të vlefshëm për logon (https://...).");
        setMessageError(true);
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("professional_profiles")
        .upsert(
          {
            user_id: userId,
            business_name: businessName.trim(),
            category,
            city: city.trim(),
            phone: phone.trim() || null,
            description: description.trim() || null,
            services,
            logo_url: logoUrl.trim() || null,
            experience_years: years,
            working_hours: workingHours.trim() || null,
            service_area: serviceArea.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        setMessage("Gabim gjatë ruajtjes: " + error.message);
        setMessageError(true);
        return;
      }

      setHasProfile(true);
      setMessage("Profili dhe shërbimet u ruajtën me sukses!");
    } catch {
      setMessage("Ndodhi një gabim. Provo përsëri.");
      setMessageError(true);
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-700">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-700" />
          Duke ngarkuar profilin...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900"
        >
          ← Kthehu te THIRRE
        </Link>

        <section className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          <header className="bg-gradient-to-br from-[#082b68] via-[#0755aa] to-[#0879e8] px-6 py-8 text-white sm:px-9 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
              THIRRE për profesionistë
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">
              {hasProfile ? "Ndrysho profilin tënd" : "Ofro shërbimet e tua"}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Plotëso të dhënat dhe zgjidh shërbimet që ofron, në mënyrë që
              klientët në Kosovë të të gjejnë më lehtë.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-9">
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-black">Të dhënat e biznesit</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informacionet bazë që do të shfaqen në profilin tënd.
                </p>
              </div>

              <div>
                <label htmlFor="businessName" className="mb-2 block text-sm font-bold">
                  Emri i biznesit ose emri yt
                </label>
                <input
                  id="businessName"
                  required
                  maxLength={100}
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="P.sh. Arben Elektricisti"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-2 block text-sm font-bold">
                    Kategoria
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setMessage("");
                    }}
                    className={inputClass}
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="mb-2 block text-sm font-bold">
                    Qyteti
                  </label>
                  <input
                    id="city"
                    required
                    maxLength={100}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="P.sh. Prishtinë"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-bold">
                  Telefoni (opsional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  maxLength={40}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Numri i kontaktit"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="logoUrl" className="mb-2 block text-sm font-bold">
                  Linku i logos (opsional)
                </label>
                <input
                  id="logoUrl"
                  type="url"
                  maxLength={1000}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={inputClass}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Vendos linkun publik të logos. Ngarkimi direkt i fotografisë
                  mund të shtohet më vonë.
                </p>

                {logoUrl.trim() && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <Image
                        src={logoUrl.trim()}
                        alt="Parapamja e logos"
                        fill
                        sizes="56px"
                        unoptimized
                        className="object-contain"
                        onError={(e) => {
                          e.currentTarget.style.visibility = "hidden";
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-500">
                      Parapamja e logos
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-5 border-t border-slate-100 pt-7">
              <div>
                <h2 className="text-lg font-black">Përvoja dhe orari</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Ndihmo klientët të kuptojnë përvojën dhe disponueshmërinë tënde.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="experienceYears" className="mb-2 block text-sm font-bold">
                    Përvoja (vite)
                  </label>
                  <input
                    id="experienceYears"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="workingHours" className="mb-2 block text-sm font-bold">
                    Orari i punës
                  </label>
                  <input
                    id="workingHours"
                    maxLength={120}
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="P.sh. Hënë–Shtunë, 08:00–18:00"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="serviceArea" className="mb-2 block text-sm font-bold">
                  Zona ku punon
                </label>
                <input
                  id="serviceArea"
                  maxLength={250}
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  placeholder="P.sh. Prishtinë, Fushë Kosovë, Lipjan"
                  className={inputClass}
                />
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <h2 className="text-lg font-black">Shërbimet që ofron</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Zgjidh shërbimet për kategorinë tënde ose shto një shërbim tjetër.
                Mund të zgjedhësh deri në 20.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(suggestedServices[category] ?? suggestedServices.Tjetër).map(
                  (service) => {
                    const selected = services.includes(service);

                    return (
                      <label
                        key={service}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={!selected && services.length >= 20}
                          onChange={() => toggleService(service)}
                          className="h-4 w-4 accent-blue-700"
                        />
                        <span className="text-sm font-semibold">{service}</span>
                      </label>
                    );
                  }
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="customService" className="mb-2 block text-sm font-bold">
                  Shto shërbim tjetër
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="customService"
                    maxLength={100}
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomService();
                      }
                    }}
                    placeholder="P.sh. Montim i kamerave"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addCustomService}
                    disabled={!customService.trim() || services.length >= 20}
                    className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Shto
                  </button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">Shërbimet e zgjedhura</h3>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">
                    {services.length}/20
                  </span>
                </div>

                {services.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Ende nuk ke zgjedhur shërbime.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {services.map((service) => (
                      <li
                        key={service}
                        className="flex items-center gap-2 rounded-full border border-blue-100 bg-white py-2 pl-3 pr-2 text-sm font-semibold text-slate-700"
                      >
                        <span>{service}</span>
                        <button
                          type="button"
                          onClick={() => toggleService(service)}
                          aria-label={`Hiq shërbimin ${service}`}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="border-t border-slate-100 pt-7">
              <h2 className="text-lg font-black">Përshkrimi i biznesit</h2>
              <p className="mt-1 text-sm text-slate-500">
                Trego shkurt përvojën dhe cilësinë e punës që ofron.
              </p>
              <label htmlFor="description" className="sr-only">
                Përshkrimi i shërbimeve
              </label>
              <textarea
                id="description"
                rows={5}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Përshkruaj përvojën, shërbimet dhe zonat ku punon..."
                className={`${inputClass} mt-4 resize-y`}
              />
              <p className="mt-2 text-right text-xs text-slate-400">
                {description.length}/2000 karaktere
              </p>
            </section>

            <button
              type="submit"
              disabled={loading || !userId}
              className="w-full rounded-xl bg-blue-700 px-5 py-4 font-black text-white shadow-lg shadow-blue-700/20 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Duke ruajtur..."
                : hasProfile
                  ? "Ruaj ndryshimet"
                  : "Publiko profilin"}
            </button>

            {message && (
              <div
                role="status"
                aria-live="polite"
                className={`break-words rounded-xl border p-4 text-sm font-medium ${
                  messageError
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                {message}
                {!messageError && hasProfile && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="font-bold underline underline-offset-4"
                    >
                      Kthehu te faqja kryesore
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        <p className="mt-5 text-center text-xs text-slate-400">
          THIRRE · Gjej profesionistin e duhur në Kosovë
        </p>
      </div>
    </main>
  );
}
