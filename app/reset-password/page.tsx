
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validLink, setValidLink] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const currentUrl = new URL(window.location.href);
      const accessToken = currentUrl.hash.match(/access_token=([^&]+)/)?.[1];
      const refreshToken = currentUrl.hash.match(/refresh_token=([^&]+)/)?.[1];
      const hashType = currentUrl.hash.match(/type=([^&]+)/)?.[1];

      try {
        // Linku mund të vijë si code nga PKCE.
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) throw exchangeError;
        } else if (
          tokenHash &&
          (type === "recovery" || type === "signup")
        ) {
          const { error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type as "recovery" | "signup",
            });

          if (verifyError) throw verifyError;
        } else if (
          accessToken &&
          refreshToken &&
          hashType === "recovery"
        ) {
          const { error: sessionError } =
            await supabase.auth.setSession({
              access_token: decodeURIComponent(accessToken),
              refresh_token: decodeURIComponent(refreshToken),
            });

          if (sessionError) throw sessionError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error(
            "Linku nuk është valid ose ka skaduar. Kërko një link të ri për rikuperim."
          );
        }

        if (active) setValidLink(true);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Nuk mund të verifikohej linku."
          );
        }
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkRecoverySession();

    return () => {
      active = false;
    };
  }, [searchParams]);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Fjalëkalimi duhet të ketë të paktën 8 karaktere.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Sesioni i rikuperimit ka skaduar. Kërko një link të ri."
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut();

      setMessage(
        "Fjalëkalimi u ndryshua me sukses! Tani mund të kyçesh me fjalëkalimin e ri."
      );

      window.setTimeout(() => {
        router.replace("/login");
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nuk mund të ndryshohej fjalëkalimi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <Link href="/" className="text-4xl font-bold tracking-tight">
            <span className="text-blue-500">THIRRE</span>
          </Link>

          <h1 className="mt-5 text-2xl font-bold">
            Rikupero fjalëkalimin
          </h1>

          <p className="mt-2 text-slate-400">
            Vendos një fjalëkalim të ri për llogarinë tënde.
          </p>
        </div>

        {checking ? (
          <p className="text-center text-slate-300">
            Duke verifikuar linkun...
          </p>
        ) : validLink ? (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium"
              >
                Fjalëkalimi i ri
              </label>

              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Të paktën 8 karaktere"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium"
              >
                Konfirmo fjalëkalimin
              </label>

              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Shkruaje përsëri"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Duke ruajtur..." : "Ndrysho fjalëkalimin"}
            </button>
          </form>
        ) : null}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-800 bg-emerald-950/50 p-4 text-sm text-emerald-300"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 break-words rounded-xl border border-red-900 bg-slate-950 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {!validLink && !checking && (
          <p className="mt-5 text-center text-sm text-slate-400">
            Kërko një link të ri nga faqja e{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-400 hover:text-blue-300"
            >
              hyrjes
            </Link>
            .
          </p>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href="/login"
            className="text-slate-400 transition hover:text-white"
          >
            ← Kthehu te hyrja
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-slate-950 p-6 text-white">
          Duke hapur faqen...
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
