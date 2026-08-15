import { createFileRoute } from "@tanstack/react-router";
import { getAccountStatement } from "@/lib/parties/statements.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/api/print/statement/$partyId")({
  component: PrintStatementPage,
});

function PrintStatementPage() {
  const { partyId } = Route.useParams();
  const search = Route.useSearch() as any;

  // Since it's a server route for printing, we usually fetch data in a loader or component
  // For simplicity in this template, we'll use a component with a query
  // and trigger window.print() after load.
  
  return (
    <div className="p-8 dir-rtl" style={{ direction: 'rtl' }}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">كشف حساب</h1>
        <p>جاري تحميل البيانات...</p>
      </div>
      {/* Real printing logic would be more involved, often using a server route that returns HTML */}
    </div>
  );
}
