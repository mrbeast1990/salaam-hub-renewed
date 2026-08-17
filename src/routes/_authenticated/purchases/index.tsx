import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/purchases/index")({
  beforeLoad: () => {
    throw redirect({ to: "/purchases/new" });
  },
});
