import { createFileRoute, Link } from '@tanstack/react-router';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { getAuditSummary } from '@/lib/reports/audit.functions';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/_authenticated/audit')({
  component: AuditPage,
});

function AuditPage() {
  const fetchAudit = useServerFn(getAuditSummary);
  const { data, isPending } = useQuery({
    queryKey: ['audit-summary'],
    queryFn: () => fetchAudit()
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="مركز التدقيق والرقابة" 
        description="فحص شامل لسلامة البيانات ومطابقة الحركات المالية والمخزنية" 
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <ScoreCard title="المبيعات" score={data?.healthScores.sales} />
          <ScoreCard title="المشتريات" score={data?.healthScores.purchases} />
          <ScoreCard title="المخزون" score={data?.healthScores.inventory} />
          <ScoreCard title="الخزينة" score={data?.healthScores.treasury} />
          <ScoreCard title="الحسابات" score={data?.healthScores.parties} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            نتائج الفحص التلقائي
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
             <div className="space-y-2">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
             </div>
          ) : !data?.findings.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="size-12 text-green-500 mb-2" />
              <p className="font-medium">كافة البيانات متطابقة وسليمة</p>
              <p className="text-sm text-muted-foreground">لم يتم العثور على أي انحرافات في الحركات المالية أو المخزنية.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.findings.map((f, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg border bg-muted/30">
                  <AlertCircle className={`size-5 mt-0.5 ${f.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="font-semibold text-sm">{f.message || 'مشكلة في مطابقة البيانات'}</p>
                    <p className="text-xs text-muted-foreground mt-1">الموحدة: {f.module} | الشدة: {f.severity}</p>
                    {f.details && (
                      <pre className="mt-2 text-[10px] bg-background p-2 rounded border overflow-x-auto">
                        {JSON.stringify(f.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-between items-center">
            <div className="flex gap-3">
              <Info className="size-5 text-blue-500 shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <p className="font-bold">ملاحظة أمنية:</p>
                <p>هذا المركز للقراءة فقط. لا يمكن إجراء أي تعديلات يدوية على الحركات لضمان سلامة سجل التدقيق Audit Log. أي تصحيح يجب أن يتم عبر مستندات عكسية (مرتجعات) أو حركات تسوية معتمدة.</p>
              </div>
            </div>
            <Link 
              to="/migration-review"
              className="text-xs font-bold text-blue-700 hover:underline bg-white px-3 py-2 rounded border border-blue-200"
            >
              مراجعة الترحيل (Legacy Import)
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreCard({ title, score = 100 }: { title: string, score?: number }) {
  const colorClass = score >= 95 ? 'text-green-600' : score >= 80 ? 'text-amber-600' : 'text-red-600';
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{score}%</p>
      </CardContent>
    </Card>
  );
}
