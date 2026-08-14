import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({
    meta: [
      { title: "المخزون — سلام لإدارة المبيعات" },
      { name: "description", content: "الأصناف، الأسعار، الحد الأدنى، الباركود، التصنيفات، الأرصدة من الحركات" },
      { property: "og:title", content: "المخزون — سلام لإدارة المبيعات" },
      { property: "og:description", content: "الأصناف، الأسعار، الحد الأدنى، الباركود، التصنيفات، الأرصدة من الحركات" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="المخزون" description="الأصناف، الأسعار، الحد الأدنى، الباركود، التصنيفات، الأرصدة من الحركات" stage="المرحلة 4" />
  ),
});
