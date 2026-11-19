import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, Sun, Moon, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/el-wageh-logo.jpeg';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, lang, setLang, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(email, password);
    if (!result.success) setError(result.error || t('login.error'));
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex gap-2 z-10`}>
        <Button variant="outline" size="icon" onClick={toggleTheme} className="rounded-full">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="rounded-full gap-1">
          <Globe className="h-4 w-4" /> {t('language')}
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="rounded-2xl p-8 border border-border bg-card shadow-lg">
          <div className="absolute top-0 left-8 right-8 h-0.5 rounded-full bg-primary" />

          <div className="flex flex-col items-center mb-6 gap-3">
            <div className="rounded-2xl p-3 bg-primary/10">
              <img src={logo} alt="El Wageh Logo" className="h-24 object-contain" />
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-cairo text-primary">
                {t('login.welcome')}
              </p>
              <p className="text-sm mt-1 font-cairo text-muted-foreground">
                {t('login.subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-primary`} />
              <Input
                type="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 font-cairo`}
              />
            </div>
            <div className="relative">
              <Lock className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-primary`} />
              <Input
                type="password"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 font-cairo`}
              />
            </div>

            {error && <p className="text-destructive text-sm text-center font-cairo">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold font-cairo">
              {loading ? '...' : t('login.submit')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/signup" className="text-sm font-cairo hover:underline text-primary">
              {t('signup.link')}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs mt-6 font-cairo text-muted-foreground">
          © 2026 الوجيه لمنظمات الهواء
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
