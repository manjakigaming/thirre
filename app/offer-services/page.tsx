"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const categories = [
  "Elektricist",
  "Hidraulik",
  "Pastrim",
  "Renovime",
  "Tjetër",
];

export default function OfferServicesPage() {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("Elektricist");
  const [city, setCity] = useState("Prishtinë");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setMessage(
            "Duhet të kyçesh në llogarinë tënde para se të ofrosh shërbime."
          );
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("professional_profiles")
          .select("business_name, category, city, phone, description")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          setMessage("Gabim gjatë ngarkimit të profilit: " + error.message);
          return;
        }

        if (data) {
          setHasProfile(true);
          setBusinessName(data.business_name ?? "");
          setCategory(data.category ?? "Elektricist");
          setCity(data.city ?? "Prishtinë");
          setPhone(data.phone ?? "");
          setDescription(data.description ?? "");
        }
      } catch {
        setMessage("Ndodhi një gabim gjatë ngarkimit të profilit.");
      } finally {
        setLoadingProfile(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!userId) {
      setMessage("Kyçu në llogari para se ta ruash profilin.");
      return;
    }

    if (!businessName.trim() || !city.trim()) {
      setMessage("Plotëso emrin dhe qytetin.");
      return;
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
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (error) {
        setMessage("Gabim gjatë ruajtjes: " + error.message);
        return;
      }

      setHasProfile(true);
      setMessage("Profili yt u ruajt me sukses!");
    } catch {
      setMessage("Ndodhi një gabim. Provo përsëri.");
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        Duke ngarkuar profilin...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="font-black text-blue-400">
          ← Kthehu te THIRRE
        </Link>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-9">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-400">
            THIRRE për profesionistë
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {hasProfile ? "Ndrysho profilin tënd" : "Ofro shërbimet e tua"}
          </h1>

          <p className="mt-3 leading-7 text-slate-400">
            Plotëso ose ndrysho të dhënat e biznesit tënd që klientët të dinë
            çfarë shërbimesh ofron.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Emri i biznesit ose emri yt
              </label>
              <input
                required
                maxLength={100}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="P.sh. Arben Elektricisti"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Kategoria e shërbimit
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Qyteti
              </label>
              <input
                required
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="P.sh. Prishtinë"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Numri i telefonit
              </label>
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Do ta rregullojmë kontaktin më vonë"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Përshkrimi i shërbimeve
              </label>
              <textarea
                rows={4}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Përshkruaj përvojën dhe shërbimet që ofron..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !userId}
              className="w-full rounded-xl bg-blue-600 px-5 py-4 font-bold transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Duke ruajtur..."
                : hasProfile
                  ? "Ruaj ndryshimet"
                  : "Ruaj profilin"}
            </button>

            {message && (
              <p
                role="status"
                aria-live="polite"
                className="break-words rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm"
              >
                {message}
              </p>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}