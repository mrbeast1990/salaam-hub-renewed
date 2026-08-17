import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/purchases/")({
  beforeLoad: () => {
    throw redirect({ to: "/purchases/new" });
  },
});
