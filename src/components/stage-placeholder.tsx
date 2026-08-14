import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Construction } from "lucide-react";

export function StagePlaceholder({
  title,
  description,
  stage,
}: {
  title: string;
  description: string;
  stage: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Construction className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">هذه الشاشة تُبنى في {stage}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            البنية الخلفية (الجداول والحركات والدوال) جاهزة بالكامل. الواجهة الكاملة لهذا القسم
            تُنفَّذ في المرحلة المخصصة لها حتى تبقى مطابقة للتطبيق القديم في الحقول وسير العمل.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
