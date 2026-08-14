import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/purchases")({
  head: () => ({
    meta: [
      { title: "المشتريات — سلام لإدارة المبيعات" },
      { name: "description", content: "فواتير الشراء، الموردون، أصناف بأسعار الشراء، الطباعة" },
      { property: "og:title", content: "المشتريات — سلام لإدارة المبيعات" },
      { property: "og:description", content: "فواتير الشراء، الموردون، أصناف بأسعار الشراء، الطباعة" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="المشتريات" description="فواتير الشراء، الموردون، أصناف بأسعار الشراء، الطباعة" stage="المرحلة 3" />
  ),
});
