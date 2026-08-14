import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "التنبيهات — سلام لإدارة المبيعات" },
      { name: "description", content: "نواقص المخزون، الصلاحيات المقاربة، الديون المتأخرة" },
      { property: "og:title", content: "التنبيهات — سلام لإدارة المبيعات" },
      { property: "og:description", content: "نواقص المخزون، الصلاحيات المقاربة، الديون المتأخرة" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="التنبيهات" description="نواقص المخزون، الصلاحيات المقاربة، الديون المتأخرة" stage="المرحلة 9" />
  ),
});
