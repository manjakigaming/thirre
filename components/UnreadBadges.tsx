
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UnreadBadges() {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const loadUnreadNotifications = useCallback(async (id: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", id)
      .is("read_at", null);

    if (error) {
      console.error("Gabim gjatë numërimit të njoftimeve:", error.message);
      return;
    }

    setUnreadNotifications(count ?? 0);
  }, []);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        setUserId(null);
        setUnreadNotifications(0);
        return;
      }

      const id = data.user.id;
      setUserId(id);
      await loadUnreadNotifications(id);
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void initialize();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadUnreadNotifications]);

  useEffect(() => {
    if (!userId) return;

    const intervalId = window.setInterval(() => {
      void loadUnreadNotifications(userId);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [userId, loadUnreadNotifications]);

  if (unreadNotifications === 0) return null;

  return (
    <span
      className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black leading-none text-white"
      aria-label={`${unreadNotifications} njoftime të palexuara`}
    >
      {unreadNotifications > 99 ? "99+" : unreadNotifications}
    </span>
  );
}
