import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/purchases")({
  beforeLoad: () => {
    // Redirect to New Purchase by default
    throw redirect({ to: "/purchases/new" });
  },
});