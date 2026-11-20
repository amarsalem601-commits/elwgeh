import React from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone } from 'lucide-react';
import { CONTACT_BRANCHES } from '@/data/companyInfo';

const ContactPage: React.FC = () => (
  <PublicPageLayout title="أرقام التواصل">
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="font-cairo flex items-center gap-2 text-primary">
          <Phone className="h-5 w-5" />
          اتصل بنا
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTACT_BRANCHES.map(branch => (
          <div key={branch.name} className="rounded-2xl border border-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-cairo text-base font-bold text-foreground">{branch.name}</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {branch.phones.map(phone => (
                <a
                  key={phone}
                  href={`tel:${phone}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background p-3 font-cairo text-base font-bold text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" />
                  <span dir="ltr">{phone}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  </PublicPageLayout>
);

export default ContactPage;
