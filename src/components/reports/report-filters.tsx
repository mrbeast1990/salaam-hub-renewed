import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Filter, Printer, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ar } from "date-fns/locale";

interface ReportFiltersProps {
  onFilter: (filters: { from_date?: string; to_date?: string }) => void;
  onPrint?: () => void;
  isLoading?: boolean;
}

export function ReportFilters({ onFilter, onPrint, isLoading }: ReportFiltersProps) {
  const [fromDate, setFromDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());

  const handleApply = () => {
    onFilter({
      from_date: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
      to_date: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
    });
  };

  const handleReset = () => {
    setFromDate(undefined);
    setToDate(undefined);
    onFilter({});
  };

  return (
    <div className="flex flex-col md:flex-row items-end gap-3 bg-background p-4 rounded-xl border shadow-sm">
      <div className="grid gap-1.5 w-full md:w-auto">
        <label className="text-[10px] font-bold text-muted-foreground mr-1">من تاريخ</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[160px] justify-start text-right font-normal h-10",
                !fromDate && "text-muted-foreground"
              )}
            >
              <Calendar className="ml-2 h-4 w-4" />
              {fromDate ? format(fromDate, "yyyy-MM-dd") : <span>اختر التاريخ</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={fromDate}
              onSelect={setFromDate}
              initialFocus
              locale={ar}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-1.5 w-full md:w-auto">
        <label className="text-[10px] font-bold text-muted-foreground mr-1">إلى تاريخ</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[160px] justify-start text-right font-normal h-10",
                !toDate && "text-muted-foreground"
              )}
            >
              <Calendar className="ml-2 h-4 w-4" />
              {toDate ? format(toDate, "yyyy-MM-dd") : <span>اختر التاريخ</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={toDate}
              onSelect={setToDate}
              initialFocus
              locale={ar}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        <Button 
          onClick={handleApply} 
          disabled={isLoading}
          className="flex-1 md:flex-none h-10"
        >
          <Filter className="ml-2 h-4 w-4" />
          تطبيق
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleReset}
          className="h-10 w-10"
          title="إعادة ضبط"
        >
          <X className="h-4 w-4" />
        </Button>
        {onPrint && (
          <Button 
            variant="outline" 
            onClick={onPrint}
            className="flex-1 md:flex-none h-10 border-primary text-primary hover:bg-primary/5"
          >
            <Printer className="ml-2 h-4 w-4" />
            طباعة
          </Button>
        )}
      </div>
    </div>
  );
}