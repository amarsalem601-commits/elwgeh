import React, { useEffect, useState } from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  photo_url: string;
}

const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });
      setMembers((data as any) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <PublicPageLayout title="فريقنا">
      <div className="text-center space-y-2 mb-4">
        <div className="inline-flex p-3 rounded-xl bg-primary/10">
          <Users className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl font-bold font-cairo text-primary">فريق الوجيه</h2>
        <p className="text-muted-foreground font-cairo">نخبة من الفنيين والمختصين تحت تصرفك</p>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground font-cairo py-10">جاري التحميل...</p>
      ) : members.length === 0 ? (
        <p className="text-center text-muted-foreground font-cairo py-10">لم يتم إضافة أعضاء الفريق بعد</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Card key={m.id} className="border-primary/20 hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-square bg-muted overflow-hidden">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5">
                    <Users className="h-16 w-16 text-primary/30" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-1">
                <h3 className="font-cairo font-bold text-lg">{m.name}</h3>
                {m.role && <p className="text-sm text-primary font-cairo">{m.role}</p>}
                {m.description && (
                  <p className="text-xs text-muted-foreground font-cairo leading-6 mt-2">{m.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PublicPageLayout>
  );
};

export default TeamPage;
