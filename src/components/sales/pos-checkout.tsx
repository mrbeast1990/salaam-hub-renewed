import { 
  Save, 
  Printer, 
  X, 
  CheckCircle2,
  Calendar,
  CreditCard,
  DollarSign,
  AlertCircle,
  Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

interface POSCheckoutProps {
  total: number;
  customer: any;
  onConfirm: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
}

export function POSCheckout({ total, customer, onConfirm, onCancel, isPending }: POSCheckoutProps) {
  const [paid, setPaid] = useState(total);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionDate, setTransactionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);

  const finalTotal = total - discount;
  const remaining = finalTotal - paid;

  useEffect(() => {
    setPaid(finalTotal);
  }, [finalTotal]);

  const handleConfirm = () => {
    if (paid < 0) {
      toast.error("المبلغ المدفوع لا يمكن أن يكون سالباً");
      return;
    }
    
    if (finalTotal < 0) {
      toast.error("الإجمالي لا يمكن أن يكون سالباً");
      return;
    }

    onConfirm({
      paid,
      paymentMethod,
      transactionDate,
      notes,
      discount,
      total: finalTotal
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="size-3" /> تاريخ الفاتورة
          </Label>
          <Input 
            type="date" 
            value={transactionDate} 
            onChange={(e) => setTransactionDate(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <CreditCard className="size-3" /> طريقة الدفع
          </Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">نقدي (خزينة)</SelectItem>
              <SelectItem value="bank">تحويل بنكي</SelectItem>
              <SelectItem value="credit">آجل (ذمم)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg space-y-4 border">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">إجمالي البنود:</span>
          <span className="font-mono">{total.toFixed(2)}</span>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">الخصم الإضافي</Label>
          <div className="relative">
            <Minus className="absolute right-3 top-2.5 size-4 text-destructive" />
            <Input 
              type="number" 
              className="pr-9 text-lg font-mono text-destructive" 
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-muted-foreground/20">
          <div className="flex justify-between items-center text-2xl font-black">
            <span>الإجمالي المستحق</span>
            <span className="font-mono text-primary">{finalTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Label className="text-xs font-bold flex items-center gap-1">
            <DollarSign className="size-3 text-green-600" /> المبلغ المدفوع الآن
          </Label>
          <Input 
            type="number" 
            className="text-2xl font-mono text-green-600 h-14 text-center" 
            value={paid}
            onChange={(e) => setPaid(Number(e.target.value) || 0)}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => setPaid(finalTotal)}>كامل المبلغ</Button>
            <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => setPaid(0)}>آجل بالكامل</Button>
            <Button variant="outline" size="sm" className="flex-1 text-[10px]" onClick={() => setPaid(finalTotal / 2)}>النصف</Button>
          </div>
        </div>

        {remaining > 0 && (
          <div className="p-2 bg-amber-50 rounded border border-amber-100 flex items-center gap-2 text-amber-800 text-xs">
            <AlertCircle className="size-4" />
            <span>سيتم تسجيل مبلغ <b>{remaining.toFixed(2)}</b> كمديونية على العميل.</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">ملاحظات</Label>
        <Textarea 
          placeholder="أدخل أي ملاحظات إضافية هنا..." 
          className="text-sm h-20"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          className="flex-1 h-14 text-lg font-bold" 
          onClick={handleConfirm}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="ml-2 size-5 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <CheckCircle2 className="ml-2 size-5" />
              تأكيد وحفظ الفاتورة
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          className="h-14 px-6" 
          onClick={onCancel}
          disabled={isPending}
        >
          تراجع
        </Button>
      </div>
    </div>
  );
}

import { Loader2 } from "lucide-react";
