import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({
    meta: [
      { title: "المبيعات — سلام لإدارة المبيعات" },
      { name: "description", content: "إنشاء فواتير البيع السريعة وإدارة سلة البيع والطباعة." },
      { property: "og:title", content: "المبيعات — سلام لإدارة المبيعات" },
      { property: "og:description", content: "إنشاء فواتير البيع وإدارة السلة والطباعة." },
    ],
  }),
  component: () => (
    <StagePlaceholder
      title="المبيعات"
      description="البيع السريع، السلة، الخصم، النقد/الآجل، الطباعة"
      stage="المرحلة 3"
    />
  ),
});
