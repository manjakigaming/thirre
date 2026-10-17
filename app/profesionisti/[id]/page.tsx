
import { Suspense } from "react";
import ProfessionalProfile from "./ProfessionalProfile";

export default function ProfessionalPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-5 text-[#15233b]">
          Duke ngarkuar profilin...
        </main>
      }
    >
      <ProfessionalProfile />
    </Suspense>
  );
}
