"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import type { AiPeriodReportResult, AiReportResult } from "@/lib/db/schema";
import { AI_DISCLAIMER } from "@/lib/constants";

type ReportTabsProps = {
  result: AiReportResult | AiPeriodReportResult;
  showPeriodTabs?: boolean;
};

function ItemList({ items }: { items: { title: string; detail: string }[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i}>
          <Card className="p-3">
            <p className="font-medium text-sm">{item.title}</p>
            <p className="text-sm text-muted mt-1">{item.detail}</p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function ReportTabs({ result, showPeriodTabs }: ReportTabsProps) {
  const period = result as AiPeriodReportResult;
  const hasHydration =
    showPeriodTabs && (period.hydrationInsights?.length ?? 0) > 0;
  const hasDiet = showPeriodTabs && (period.dietInsights?.length ?? 0) > 0;

  return (
    <div>
      <Tabs defaultValue="supplements">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="supplements">補充栄養</TabsTrigger>
          <TabsTrigger value="limits">制限成分</TabsTrigger>
          <TabsTrigger value="safety">服薬安全</TabsTrigger>
          {hasHydration && <TabsTrigger value="hydration">水分</TabsTrigger>}
          {hasDiet && <TabsTrigger value="diet">食事</TabsTrigger>}
        </TabsList>
        <TabsContent value="supplements">
          <ItemList items={result.supplements ?? []} />
        </TabsContent>
        <TabsContent value="limits">
          <ItemList items={result.limits ?? []} />
        </TabsContent>
        <TabsContent value="safety">
          <ItemList items={result.medicationSafety ?? []} />
        </TabsContent>
        {hasHydration && (
          <TabsContent value="hydration">
            <ItemList items={period.hydrationInsights ?? []} />
          </TabsContent>
        )}
        {hasDiet && (
          <TabsContent value="diet">
            <ItemList items={period.dietInsights ?? []} />
          </TabsContent>
        )}
      </Tabs>
      <p className="text-xs text-muted mt-6 leading-relaxed">{AI_DISCLAIMER}</p>
    </div>
  );
}
