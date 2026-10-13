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
    <main className="min-h-screen bg-[#f7f9fc] px-5 py-10 text-[#15233b]">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900"
        >
          ← Kthehu te THIRRE
        </Link>

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8">
            Duke ngarkuar profilin...
          </div>
        ) : error ? (
          <div
            role="status"
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-8"
          >
            <h1 className="text-2xl font-black">{error}</h1>

            <p className="mt-3 text-slate-500">
              Kontrollo adresën ose kthehu te lista e profesionistëve.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
            >
              Shiko profesionistët
            </Link>
          </div>
        ) : professional ? (
          <article className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#102b67] to-[#2878e8] p-8 text-white sm:p-12">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-4xl">
                {getIcon(professional.category)}
              </div>

              <p className="mt-6 text-sm font-bold uppercase tracking-widest text-blue-200">
                Profili i profesionistit
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                {professional.business_name}
              </h1>

              <p className="mt-3 font-semibold text-blue-100">
                {professional.category}
              </p>

              <p className="mt-4 text-blue-100">
                📍 {professional.city}, Kosovë
              </p>
            </div>

            <div className="p-8 sm:p-10">
              <h2 className="text-xl font-black">Rreth shërbimeve</h2>

              <p className="mt-4 whitespace-pre-wrap leading-8 text-slate-600">
                {professional.description?.trim() ||
                  "Ky profesionist ende nuk ka shtuar përshkrimin e shërbimeve."}
              </p>

              {isOwner && (
                <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="font-bold text-blue-900">
                    Ky është profili yt profesional.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Mund t'i ndryshosh të dhënat e biznesit dhe shërbimet që ofron.
                  </p>

                  <Link
                    href="/offer-services"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 sm:w-auto"
                  >
                    ✏️ Ndrysho profilin
                  </Link>
                </div>
              )}

              {!isOwner && (
                <div className="mt-8 rounded-2xl bg-blue-50 p-5">
                  <p className="font-bold text-blue-900">
                    Po kërkon këtë shërbim?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Shiko të dhënat e profesionistit. Mundësinë e kontaktit
                    do ta rregullojmë në fund.
                  </p>
                </div>
              )}
            </div>
          </article>
        ) : null}
      </div>
    </main>
  );
}