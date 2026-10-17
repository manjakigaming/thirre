
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AccountGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let checking = false;

    async function checkAccount() {
      if (checking || !active) return;
      checking = true;

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn(
            "Nuk u lexua sesioni:",
            sessionError.message
          );
          return;
        }

        if (!session) return;

        const response = await fetch("/api/account-status", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });

        if (!response.ok) {
          const details = await response.text().catch(() => "");

          console.warn(
            "Kontrolli i llogarisë dështoi:",
            response.status,
            details
          );

          return;
        }

        const result = await response.json();

        if (active && result.banned === true) {
          await supabase.auth.signOut();
          router.replace("/login");
          router.refresh();
        }
      } catch (error) {
        console.warn(
          "Gabim gjatë kontrollit të llogarisë:",
          error
        );
      } finally {
        checking = false;
      }
    }

    void checkAccount();

    const interval = window.setInterval(() => {
      void checkAccount();
    }, 15000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkAccount();
    });

    return () => {
      active = false;
      window.clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
