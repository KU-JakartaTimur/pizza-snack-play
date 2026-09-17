import { createFileRoute, redirect } from "@tanstack/react-router";

/** `/` tidak punya halaman sendiri — arahkan ke jadwal hari ini. */
export const Route = createFileRoute("/_app/")({
  beforeLoad: () => {
    throw redirect({ to: "/hari-ini" });
  },
});
