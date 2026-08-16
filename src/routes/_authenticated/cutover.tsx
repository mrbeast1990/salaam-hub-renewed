import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { startFinalCutover, getCutoverStatus } from '@/lib/migration/cutover.functions'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertCircle, Rocket } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/cutover')({
  component: CutoverPage
})

function CutoverPage() {
  const [isRunning, setIsRunning] = useState(false)
  
  const statusQuery = useQuery({
    queryKey: ['cutover-status'],
    queryFn: () => getCutoverStatus()
  })

  const cutoverFn = useServerFn(startFinalCutover)

  const handleStartCutover = async () => {
    if (!confirm('هل أنت متأكد من بدء عملية التحويل النهائي؟ سيتم إيقاف النظام القديم.')) return
    
    setIsRunning(true)
    try {
      await cutoverFn()
      toast.success('تم التحويل النهائي بنجاح!')
      statusQuery.refetch()
    } catch (error: any) {
      toast.error('فشل التحويل: ' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const status = statusQuery.data

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-6 h-6 text-primary" />
            المرحلة التاسعة: Final Cutover
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${status?.isLive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <h3 className="font-semibold mb-2">حالة الإنتاج</h3>
              <p className="text-2xl font-bold">
                {status?.isLive ? 'LIVE - فعال' : 'PRE-CUTOVER - مرحلة ما قبل التحويل'}
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">درجة الصحة النهائية</h3>
              <p className="text-2xl font-bold">{status?.healthScore || 0}/100</p>
            </div>
          </div>

          {!status?.isLive && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p className="font-bold mb-2">تحذير:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>سيتم سحب كافة البيانات المتبقية (Delta).</li>
                <li>سيتم إغلاق النظام القديم للقراءة فقط.</li>
                <li>لا يمكن التراجع عن هذه الخطوة.</li>
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={handleStartCutover}
              disabled={isRunning || status?.isLive}
              className="gap-2 w-full md:w-auto"
            >
              {isRunning ? <Loader2 className="animate-spin" /> : <Rocket className="w-5 h-5" />}
              {status?.isLive ? 'نظام الإنتاج مفعل' : 'بدأ التحويل النهائي (Go Live)'}
            </Button>
          </div>

          {status?.lastBatch && (
            <div className="mt-8 border-t pt-6">
              <h3 className="font-bold mb-4">تفاصيل آخر عملية:</h3>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto text-left" dir="ltr">
                {JSON.stringify(status.lastBatch, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
