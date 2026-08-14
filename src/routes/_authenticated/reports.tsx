import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — سلام لإدارة المبيعات" },
      { name: "description", content: "تقارير المبيعات والمشتريات والأرباح والعملاء والمخزون" },
      { property: "og:title", content: "التقارير — سلام لإدارة المبيعات" },
      { property: "og:description", content: "تقارير المبيعات والمشتريات والأرباح والعملاء والمخزون" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="التقارير" description="تقارير المبيعات والمشتريات والأرباح والعملاء والمخزون" stage="المرحلة 7" />
  ),
});
