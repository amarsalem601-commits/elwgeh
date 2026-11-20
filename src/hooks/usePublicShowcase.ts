import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  photo_url: string;
  display_order: number;
}

export interface ShowcaseProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  image_url: string;
  price: number | null;
  display_order: number;
  is_active: boolean;
}

const cacheKeys = {
  team: 'elwageh:public-team',
  products: 'elwageh:showcase-products',
};

function readCache<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T[] : [];
  } catch (error) {
    console.warn(`Unable to read public content cache "${key}"`, error);
    return [];
  }
}

function writeCache<T>(key: string, value: T[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Unable to save public content cache "${key}"`, error);
  }
}

export function usePublicShowcase() {
  const [team, setTeam] = useState<TeamMember[]>(() => readCache<TeamMember>(cacheKeys.team));
  const [products, setProducts] = useState<ShowcaseProduct[]>(() => readCache<ShowcaseProduct>(cacheKeys.products));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [teamResult, productsResult] = await Promise.all([
          supabase.from('team_members').select('*').order('display_order', { ascending: true }),
          supabase.from('showcase_products').select('*').eq('is_active', true).order('display_order', { ascending: true }),
        ]);

        if (!active) return;
        const errors = [teamResult.error, productsResult.error].filter(Boolean);

        if (!teamResult.error && teamResult.data) {
          const members = teamResult.data as TeamMember[];
          setTeam(members);
          writeCache(cacheKeys.team, members);
        }
        if (!productsResult.error && productsResult.data) {
          const items = productsResult.data as ShowcaseProduct[];
          setProducts(items);
          writeCache(cacheKeys.products, items);
        }

        setError(errors.length ? errors.map(item => item?.message).join(' — ') : null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل بيانات الصفحة');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => { active = false; };
  }, []);

  return { team, products, error, loading };
}
