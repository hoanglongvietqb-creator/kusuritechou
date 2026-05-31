"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import type { AiReportResult } from "@/lib/db/schema";
import { AI_DISCLAIMER } from "@/lib/constants";

type ReportTabsProps = {
  result: AiReportResult;
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

export function ReportTabs({ result }: ReportTabsProps) {
  return (
    <div>
      <Tabs defaultValue="supplements">
        <TabsList>
          <TabsTrigger value="supplements">補充栄養</TabsTrigger>
          <TabsTrigger value="limits">制限成分</TabsTrigger>
          <TabsTrigger value="safety">服薬安全</TabsTrigger>
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
      </Tabs>
      <p className="text-xs text-muted mt-6 leading-relaxed">{AI_DISCLAIMER}</p>
    </div>
  );
}
