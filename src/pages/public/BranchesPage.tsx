import React from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { BRANCHES } from '@/data/companyInfo';

const BranchesPage: React.FC = () => (
  <PublicPageLayout title="فروعنا">
    <h2 className="text-2xl font-bold font-cairo text-primary mb-2">فروعنا في خدمتك</h2>
    <p className="text-muted-foreground font-cairo mb-4">اختار أقرب فرع ليك واحصل على اتجاهات الوصول مباشرة.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {BRANCHES.map((b, i) => (
        <Card key={i} className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-cairo font-bold text-lg">{b.city}</h3>
                <p className="text-sm text-muted-foreground font-cairo leading-7">{b.address}</p>
              </div>
            </div>
            <Button asChild className="w-full font-cairo gap-2">
              <a href={b.mapUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-4 w-4" />
                افتح في الخريطة
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </PublicPageLayout>
);

export default BranchesPage;
