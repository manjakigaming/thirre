
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setResetMessage("");
    setResetError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.user || !data.session?.access_token) {
        await supabase.auth.signOut();
        throw new Error("Nuk u gjet sesioni i llogarisë.");
      }

      const response = await fetch("/api/account-status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        await supabase.auth.signOut();
        throw new Error(
          result.error ||
            "Nuk mund të verifikohet statusi i llogarisë."
        );
      }

      if (result.banned) {
        await supabase.auth.signOut();

        throw new Error(
          `Llogaria jote është bllokuar nga administratori. Arsyeja: ${
            result.reason || "Nuk është dhënë arsye."
          }`
        );
      }

      const { data: isAdmin, error: adminError } =
        await supabase.rpc("is_admin");

      if (adminError) {
        console.error(
          "Gabim gjatë kontrollit të administratorit:",
          adminError
        );
      }

      if (!adminError && isAdmin === true) {
        router.replace("/admin");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim gjatë hyrjes."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setResetMessage("");
    setResetError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setResetError(
        "Shkruaje email adresën në fushën e email-it dhe provo përsëri."
      );
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) {
        throw error;
      }

      setResetMessage(
        "Nëse kjo email adresë është e regjistruar, do të marrësh një email me linkun për rikuperimin e fjalëkalimit. Kontrollo edhe dosjen Spam."
      );
    } catch (error) {
      setResetError(
        error instanceof Error
          ? error.message
          : "Nuk mund të dërgohej email-i. Provo përsëri."
      );
    } finally {
      setResetLoading(false);
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
            Mirë se u ktheve!
          </h1>

          <p className="mt-2 text-slate-400">
            Hyr në llogarinë tënde për të vazhduar.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium"
            >
              Email adresa
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ti@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
              >
                Fjalëkalimi
              </label>

              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={resetLoading}
                className="text-sm font-medium text-blue-400 transition hover:text-blue-300 disabled:opacity-60"
              >
                {resetLoading
                  ? "Duke dërguar..."
                  : "Harrove fjalëkalimin?"}
              </button>
            </div>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Shkruaje fjalëkalimin"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Duke hyrë..." : "Hyr në llogari"}
          </button>
        </form>

        {message && (
          <p
            role="alert"
            aria-live="polite"
            className="mt-5 break-words rounded-xl border border-red-900 bg-slate-950 p-4 text-sm text-red-300"
          >
            {message}
          </p>
        )}

        {resetMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-5 break-words rounded-xl border border-emerald-800 bg-emerald-950/50 p-4 text-sm text-emerald-300"
          >
            {resetMessage}
          </p>
        )}

        {resetError && (
          <p
            role="alert"
            aria-live="polite"
            className="mt-5 break-words rounded-xl border border-red-900 bg-slate-950 p-4 text-sm text-red-300"
          >
            {resetError}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Nuk ke llogari?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-400 hover:text-blue-300"
          >
            Regjistrohu
          </Link>
        </p>

        <p className="mt-4 text-center text-sm">
          <Link
            href="/"
            className="text-slate-400 transition hover:text-white"
          >
            ← Kthehu në faqen kryesore
          </Link>
        </p>
      </div>
    </main>
  );
}
