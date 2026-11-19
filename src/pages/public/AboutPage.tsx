import React from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Shield, Award, Truck } from 'lucide-react';
import { ABOUT_TEXT } from '@/data/companyInfo';

const AboutPage: React.FC = () => (
  <PublicPageLayout title="من نحن">
    <Card className="border-primary/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold font-cairo text-primary">من نحن</h2>
        </div>
        <p className="font-cairo text-base leading-8 text-foreground">{ABOUT_TEXT}</p>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      {[
        { icon: Shield, title: 'ضمان شامل', desc: 'ضمان حقيقي على كل أعمال الصيانة' },
        { icon: Award, title: 'فنيين خبراء', desc: 'فريق متخصص في منظمات الهواء' },
        { icon: Truck, title: 'كل أنواع السيارات', desc: 'صيانة الشاحنات والسيارات الكبيرة' },
      ].map((f, i) => {
        const Icon = f.icon;
        return (
          <Card key={i} className="border-primary/20">
            <CardContent className="p-5 text-center space-y-2">
              <div className="inline-flex p-3 rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-cairo font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground font-cairo">{f.desc}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  </PublicPageLayout>
);

export default AboutPage;
