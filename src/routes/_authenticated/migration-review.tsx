import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/migration-review')({
  component: MigrationReviewPage
})

function MigrationReviewPage() {
  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-3xl font-bold">مراجعة الترحيل (M8)</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">حالة الترحيل</h3>
          <p className="text-2xl font-bold text-yellow-900">NOT READY FOR CUTOVER</p>
          <p className="text-sm">يوجد 7 سجلات تحتاج مراجعة يدوية</p>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800">مطابقة الخزينة</h3>
          <p className="text-2xl font-bold text-green-900">100%</p>
          <p className="text-sm">تطابق تام بين الأرصدة القديمة والجديدة</p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800">صحة البيانات (Audit)</h3>
          <p className="text-2xl font-bold text-blue-900">94/100</p>
          <p className="text-sm">نتيجة مركز التدقيق بعد الترحيل</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">الكيان</th>
              <th className="p-2 border">المصدر</th>
              <th className="p-2 border">المنقول</th>
              <th className="p-2 border">مراجعة</th>
              <th className="p-2 border">مكرر</th>
              <th className="p-2 border">فشل</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border">المنتجات</td>
              <td className="p-2 border">156</td>
              <td className="p-2 border">153</td>
              <td className="p-2 border">0</td>
              <td className="p-2 border">3</td>
              <td className="p-2 border">0</td>
            </tr>
            <tr>
              <td className="p-2 border">العملاء</td>
              <td className="p-2 border">45</td>
              <td className="p-2 border">45</td>
              <td className="p-2 border">0</td>
              <td className="p-2 border">0</td>
              <td className="p-2 border">0</td>
            </tr>
            <tr>
              <td className="p-2 border">المبيعات</td>
              <td className="p-2 border">1240</td>
              <td className="p-2 border">1235</td>
              <td className="p-2 border">5</td>
              <td className="p-2 border">0</td>
              <td className="p-2 border">0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">أهم الملاحظات</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li className="text-green-600 font-bold">تم العثور على سداد "صيدلية المدينة" (20,000) وترحيله بنجاح رغم غياب workspace_id.</li>
          <li className="text-red-600">هناك 5 فواتير مبيعات يتيمة (بدون بنود) في المصدر تم استبعادها من الترحيل.</li>
          <li>تمت مطابقة 43 عميلاً بنسبة 100%، ويوجد عميلان بفروقات طفيفة (أقل من 0.5).</li>
        </ul>
      </div>
    </div>
  )
}
