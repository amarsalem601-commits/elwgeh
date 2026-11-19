import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { FileText, ShoppingCart, ShoppingBag, TrendingUp } from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { t } = useLanguage();

  const reportCards = [
    { title: t('reports.salesReport'), icon: ShoppingCart, value: '0', sub: t('order') },
    { title: t('reports.purchaseReport'), icon: ShoppingBag, value: '0', sub: t('order') },
    { title: t('reports.inventoryReport'), icon: FileText, value: '0', sub: t('items') },
    { title: t('reports.profitSummary'), icon: TrendingUp, value: '0', sub: t('currency') },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground font-cairo">{t('reports.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((r, i) => (
          <Card key={i} className="p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <r.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{r.title}</p>
                <p className="text-xl font-bold text-foreground">{r.value} <span className="text-sm font-normal text-muted-foreground">{r.sub}</span></p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-12 shadow-card text-center">
        <p className="text-muted-foreground font-cairo">{t('noData')}</p>
      </Card>
    </div>
  );
};

export default ReportsPage;
