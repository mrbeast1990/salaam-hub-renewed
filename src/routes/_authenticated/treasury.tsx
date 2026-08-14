import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/treasury")({
  head: () => ({
    meta: [
      { title: "الخزينة — سلام لإدارة المبيعات" },
      { name: "description", content: "حركات النقد والبنك والمصروفات من دفتر الخزينة" },
      { property: "og:title", content: "الخزينة — سلام لإدارة المبيعات" },
      { property: "og:description", content: "حركات النقد والبنك والمصروفات من دفتر الخزينة" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="الخزينة" description="حركات النقد والبنك والمصروفات من دفتر الخزينة" stage="المرحلة 6" />
  ),
});
