import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMigrationStats, getMigrationBatches } from '@/lib/migration/migration.functions';
import { startDryRunMigration } from '@/lib/migration/dry-run.functions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Database, History, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Route = createFileRoute('/_authenticated/migration-review')({
  component: MigrationReviewPage,
});

function MigrationReviewPage() {
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['migration-stats'],
    queryFn: () => getMigrationStats(),
  });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['migration-batches'],
    queryFn: () => getMigrationBatches(),
  });

  const dryRunMutation = useMutation({
    mutationFn: () => startDryRunMigration(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['migration-batches'] });
    }
  });

  return (
    <div className="container mx-auto py-8 space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مركز مراجعة الترحيل (M8)</h1>
          <p className="text-muted-foreground mt-2">
            مراقبة حالة نقل البيانات من النظام القديم (Read Only)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => dryRunMutation.mutate()}
            disabled={dryRunMutation.isPending}
          >
            <RefreshCcw className={`w-4 h-4 ml-2 ${dryRunMutation.isPending ? 'animate-spin' : ''}`} />
            تشغيل تجريبي (Dry Run)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="w-4 h-4 ml-2 text-blue-500" />
              إجمالي السجلات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.values(stats).reduce((acc, curr) => acc + curr.total, 0) : '...'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle2 className="w-4 h-4 ml-2 text-green-500" />
              سجلات مرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.values(stats).reduce((acc, curr) => acc + curr.migrated, 0) : '...'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="w-4 h-4 ml-2 text-amber-500" />
              سجلات تحتاج مراجعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <History className="w-4 h-4 ml-2 text-purple-500" />
              دفعات الترحيل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>إحصائيات الجداول</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الجدول</TableHead>
                  <TableHead className="text-center">إجمالي</TableHead>
                  <TableHead className="text-center">مرحل</TableHead>
                  <TableHead className="text-center">النسبة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats && Object.entries(stats).map(([name, s]) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium text-right">{name}</TableCell>
                    <TableCell className="text-center">{s.total}</TableCell>
                    <TableCell className="text-center">{s.migrated}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={s.total === s.migrated && s.total > 0 ? "default" : "outline"}>
                        {s.total > 0 ? Math.round((s.migrated / s.total) * 100) : 0}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>دفعات الترحيل الأخيرة</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">السجلات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches?.map((batch: any) => (
                  <TableRow key={batch.id}>
                    <TableCell className="text-right">
                      {format(new Date(batch.started_at), 'PPP p', { locale: ar })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={batch.status === 'completed' ? 'secondary' : 'default'}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {batch.summary?.imported || 0}
                    </TableCell>
                  </TableRow>
                ))}
                {(!batches || batches.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      لا توجد دفعات ترحيل بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center">
            <AlertCircle className="w-5 h-5 ml-2" />
            تنبيهات المرحلة الثامنة
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <ul className="list-disc list-inside space-y-1">
            <li>النظام القديم في حالة Read Only بالكامل.</li>
            <li>الترحيل الحالي هو Dry Run لأغراض الاختبار.</li>
            <li>يجب مطابقة أرصدة العملاء والموردين يدوياً قبل الاعتماد النهائي.</li>
            <li>سيتم تفعيل Audit Center فور اكتمال أول دفعة ترحيل.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
