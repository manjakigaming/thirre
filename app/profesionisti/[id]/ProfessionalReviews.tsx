"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  professional_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type EligibleRequest = {
  id: string;
  title: string;
};

type ProfessionalReviewsProps = {
  professionalId: string;
};

export default function ProfessionalReviews({
  professionalId,
}: ProfessionalReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligibleRequests, setEligibleRequests] = useState<EligibleRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        // Vlerësimet publike lexohen vetëm nga pamja që nuk ekspozon reviewer_id.
        const { data: reviewData, error: reviewError } = await supabase
          .from("professional_reviews_public")
          .select("id, professional_id, rating, comment, created_at")
          .eq("professional_id", professionalId)
          .order("created_at", { ascending: false });

        if (!active) return;

        if (reviewError) {
          setError("Vlerësimet nuk mund të ngarkohen. Provo përsëri.");
          setLoading(false);
          return;
        }

        setReviews((reviewData ?? []) as Review[]);

        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (!active) return;

        if (authError || !authData.user) {
          setEligibleRequests([]);
          setLoading(false);
          return;
        }

        const user = authData.user;

        if (user.id === professionalId) {
          setEligibleRequests([]);
          setLoading(false);
          return;
        }

        // Gjej kërkesat të cilave u është përgjigjur ky profesionist.
        const { data: responses, error: responsesError } = await supabase
          .from("service_request_responses")
          .select("request_id")
          .eq("user_id", professionalId);

        if (!active) return;

        if (responsesError) {
          setError("Nuk mund të kontrollohen kërkesat për vlerësim.");
          setLoading(false);
          return;
        }

        const requestIds = [
          ...new Set((responses ?? []).map((response) => response.request_id)),
        ];

        if (requestIds.length === 0) {
          setEligibleRequests([]);
          setLoading(false);
          return;
        }

        // Kërkesat duhet t'i përkasin klientit të kyçur.
        const { data: requests, error: requestsError } = await supabase
          .from("service_requests")
          .select("id, title")
          .eq("user_id", user.id)
          .in("id", requestIds);

        if (!active) return;

        if (requestsError) {
          setError("Nuk mund të ngarkohen kërkesat e tua.");
          setLoading(false);
          return;
        }

        // Kontrollo vlerësimet e mëparshme vetëm për përdoruesin e kyçur.
        // Kjo kërkon që RLS të lejojë leximin e rreshtave të vet.
        const { data: myReviews, error: myReviewsError } = await supabase
          .from("professional_reviews")
          .select("request_id")
          .eq("reviewer_id", user.id)
          .eq("professional_id", professionalId);

        if (!active) return;

        if (myReviewsError) {
          setError(
            "Nuk mund të kontrollohen vlerësimet e tua. Kontrollo politikat e sigurisë."
          );
          setLoading(false);
          return;
        }

        const reviewedRequests = new Set(
          (myReviews ?? []).map((review) => review.request_id)
        );

        const available = (requests ?? []).filter(
          (request) => !reviewedRequests.has(request.id)
        );

        setEligibleRequests(available as EligibleRequest[]);

        if (
          selectedRequest &&
          !available.some((request) => request.id === selectedRequest)
        ) {
          setSelectedRequest("");
        }

        setLoading(false);
      } catch {
        if (!active) return;
        setError("Ndodhi një gabim gjatë ngarkimit. Provo përsëri.");
        setLoading(false);
      }
    }

    void fetchData();

    return () => {
      active = false;
    };
  }, [professionalId, retry, selectedRequest]);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!selectedRequest) {
      setError("Zgjidh kërkesën për të cilën dëshiron të japësh vlerësim.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Zgjidh një vlerësim nga 1 deri në 5 yje.");
      return;
    }

    if (comment.length > 1500) {
      setError("Komenti nuk mund të jetë më i gjatë se 1500 karaktere.");
      return;
    }

    setSubmitting(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      const user = authData.user;

      if (authError || !user) {
        setError("Duhet të kyçesh për të dhënë vlerësim.");
        return;
      }

      if (user.id === professionalId) {
        setError("Nuk mund ta vlerësosh profilin tënd.");
        return;
      }

      const { error: insertError } = await supabase
        .from("professional_reviews")
        .insert({
          request_id: selectedRequest,
          reviewer_id: user.id,
          professional_id: professionalId,
          rating,
          comment: comment.trim() || null,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setError("Këtë kërkesë e ke vlerësuar më parë.");
        } else if (
          insertError.code === "42501" ||
          insertError.code === "403"
        ) {
          setError(
            "Nuk ke leje për këtë vlerësim. Kontrollo nëse profesionisti i është përgjigjur kërkesës."
          );
        } else {
          console.error("Review insert failed:", insertError);
          setError(
            "Vlerësimi nuk u ruajt. Kontrollo lidhjen dhe provo përsëri."
          );
        }
        return;
      }

      setComment("");
      setRating(5);
      setSelectedRequest("");
      setNotice("Vlerësimi yt u dërgua me sukses.");
      setRetry((value) => value + 1);
    } catch {
      setError("Ndodhi një gabim. Provo përsëri.");
    } finally {
      setSubmitting(false);
    }
  }

  const average =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      : 0;

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Përvojat e klientëve
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-900 sm:text-2xl">
            Vlerësimet dhe komentet
          </h2>
        </div>

        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-right">
          <p className="text-2xl font-black text-blue-800">
            {reviews.length ? average.toFixed(1) : "—"}
            <span className="text-sm"> / 5</span>
          </p>
          <p className="text-xs text-slate-600">
            {reviews.length}{" "}
            {reviews.length === 1 ? "vlerësim" : "vlerësime"}
          </p>
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"
        >
          {notice}
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">
          Duke ngarkuar vlerësimet...
        </p>
      ) : (
        <>
          {reviews.length === 0 ? (
            <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
              Ky profesionist ende nuk ka vlerësime.
            </p>
          ) : (
            <>
              <div
                className="mt-5 flex gap-1 text-xl text-amber-500"
                aria-label={`Mesatarja ${average.toFixed(1)} nga 5 yje`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index}>
                    {index < Math.round(average) ? "★" : "☆"}
                  </span>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-100 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className="text-lg tracking-wide text-amber-500"
                        aria-label={`${review.rating} nga 5 yje`}
                      >
                        {"★".repeat(review.rating)}
                        <span className="text-slate-200">
                          {"☆".repeat(5 - review.rating)}
                        </span>
                      </span>

                      <time
                        className="text-xs text-slate-500"
                        dateTime={review.created_at}
                      >
                        {new Date(review.created_at).toLocaleDateString(
                          "sq-AL"
                        )}
                      </time>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                      {review.comment?.trim() || "Vlerësim pa koment."}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}

          {eligibleRequests.length > 0 && (
            <form
              onSubmit={submitReview}
              className="mt-8 border-t border-slate-100 pt-6"
            >
              <h3 className="text-lg font-black text-slate-900">
                Vlerëso këtë profesionist
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Zgjidh kërkesën tënde dhe ndaje përvojën me klientët e tjerë.
              </p>

              <label
                htmlFor="review-request"
                className="mt-5 block text-sm font-bold text-slate-700"
              >
                Kërkesa
              </label>

              <select
                id="review-request"
                value={selectedRequest}
                onChange={(event) => setSelectedRequest(event.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Zgjidh kërkesën...</option>
                {eligibleRequests.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.title}
                  </option>
                ))}
              </select>

              <fieldset className="mt-5">
                <legend className="text-sm font-bold text-slate-700">
                  Vlerësimi yt
                </legend>

                <div className="mt-2 flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      aria-label={`${value} ${value === 1 ? "yll" : "yje"}`}
                      aria-pressed={rating === value}
                      className={`rounded-lg px-1 text-3xl transition ${
                        value <= rating
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {rating} nga 5 yje
                </p>
              </fieldset>

              <label
                htmlFor="review-comment"
                className="mt-5 block text-sm font-bold text-slate-700"
              >
                Komenti (opsional)
              </label>

              <textarea
                id="review-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={1500}
                rows={4}
                placeholder="Si ishte përvoja jote me këtë profesionist?"
                className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-right text-xs text-slate-400">
                {comment.length}/1500
              </p>

              <button
                type="submit"
                disabled={submitting || !selectedRequest}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {submitting ? "Duke dërguar..." : "Dërgo vlerësimin"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}