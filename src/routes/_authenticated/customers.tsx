import { createFileRoute } from "@tanstack/react-router";
import { StagePlaceholder } from "@/components/stage-placeholder";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "العملاء والموردون — سلام لإدارة المبيعات" },
      { name: "description", content: "بيانات العملاء والموردين، الأرصدة، كشف الحساب، السدادات" },
      { property: "og:title", content: "العملاء والموردون — سلام لإدارة المبيعات" },
      { property: "og:description", content: "بيانات العملاء والموردين، الأرصدة، كشف الحساب، السدادات" },
    ],
  }),
  component: () => (
    <StagePlaceholder title="العملاء والموردون" description="بيانات العملاء والموردين، الأرصدة، كشف الحساب، السدادات" stage="المرحلة 5" />
  ),
});
