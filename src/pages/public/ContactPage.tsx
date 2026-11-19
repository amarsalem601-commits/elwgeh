import React from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { PHONES } from '@/data/companyInfo';

const ContactPage: React.FC = () => (
  <PublicPageLayout title="أرقام التواصل">
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-cairo flex items-center gap-2 text-primary">
          <Phone className="h-5 w-5" />
          اتصل بنا
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PHONES.map(p => (
          <a
            key={p}
            href={`tel:${p}`}
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 hover:bg-muted transition-all"
            dir="ltr"
          >
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <span className="font-cairo text-base font-semibold">{p}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  </PublicPageLayout>
);

export default ContactPage;
