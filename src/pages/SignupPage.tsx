import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Mail, User, Phone, Sun, Moon, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/el-wageh-logo.jpeg';

const SignupPage: React.FC = () => {
  const { signup } = useAuth();
  const { t, lang, setLang, isRTL } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;
    setLoading(true);
    setError('');
    const result = await signup(form.email, form.password, form.name, form.phone);
    if (result.success) {
      navigate('/employee-dashboard');
    } else {
      setError(result.error || t('signup.error'));
    }
    setLoading(false);
  };

  const update = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setError('');
  };

  const inputStyle = {
    background: 'hsl(230 40% 18%)',
    borderColor: 'hsl(42 85% 50% / 0.25)',
    color: 'hsl(42 40% 85%)',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, hsl(230 45% 8%) 0%, hsl(230 40% 12%) 40%, hsl(235 35% 10%) 100%)' }}
    >
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full stars-twinkle"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              background: 'hsl(42 85% 70%)',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`,
            }}
          />
        ))}
        <div className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(42 85% 50%), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(42 85% 50%), transparent)' }} />
      </div>

      <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex gap-2 z-10`}>
        <Button
          variant="outline" size="icon" onClick={toggleTheme} className="rounded-full"
          style={{ borderColor: 'hsl(42 85% 50% / 0.4)', color: 'hsl(42 70% 70%)', background: 'hsl(230 40% 15%)' }}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline" size="sm" onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="rounded-full gap-1"
          style={{ borderColor: 'hsl(42 85% 50% / 0.4)', color: 'hsl(42 70% 70%)', background: 'hsl(230 40% 15%)' }}
        >
          <Globe className="h-4 w-4" /> {t('language')}
        </Button>
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div
          className="rounded-2xl p-8 border relative"
          style={{
            background: 'hsl(230 40% 14%)',
            borderColor: 'hsl(42 85% 50% / 0.3)',
            boxShadow: '0 0 60px hsl(42 85% 40% / 0.15), 0 20px 60px hsl(230 50% 5% / 0.5)',
          }}
        >
          <div className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(42 85% 50%), transparent)' }} />

          <div className="flex flex-col items-center mb-5 gap-2">
            <div className="lantern-glow rounded-xl p-2" style={{ background: 'hsl(230 40% 18%)' }}>
              <img src={logo} alt="El Wageh Logo" className="h-16 object-contain" />
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="stars-twinkle" style={{ color: 'hsl(42 85% 60%)' }}>✦</span>
                <span className="text-sm font-cairo font-bold" style={{ color: 'hsl(42 85% 65%)' }}>رمضان كريم</span>
                <span className="stars-twinkle" style={{ color: 'hsl(42 85% 60%)', animationDelay: '1s' }}>✦</span>
              </div>
              <p className="text-xl font-bold font-cairo mt-1"
                style={{
                  background: 'linear-gradient(135deg, hsl(42 85% 55%), hsl(38 90% 70%))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                {t('signup.title')}
              </p>
              <p className="text-xs mt-0.5 font-cairo" style={{ color: 'hsl(230 20% 60%)' }}>
                {t('signup.subtitle')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { icon: User, key: 'name', placeholder: t('signup.name'), type: 'text' },
              { icon: Mail, key: 'email', placeholder: t('login.email'), type: 'email' },
              { icon: Phone, key: 'phone', placeholder: t('signup.phone'), type: 'tel' },
              { icon: Lock, key: 'password', placeholder: t('login.password'), type: 'password' },
            ].map(({ icon: Icon, key, placeholder, type }) => (
              <div key={key} className="relative">
                <Icon
                  className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4`}
                  style={{ color: 'hsl(42 60% 55%)' }}
                />
                <Input
                  type={type}
                  placeholder={placeholder}
                  value={form[key as keyof typeof form]}
                  onChange={e => update(key, e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} h-11 font-cairo`}
                  style={inputStyle}
                />
              </div>
            ))}

            {error && <p className="text-destructive text-sm text-center font-cairo">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-base font-semibold font-cairo mt-1"
              style={{
                background: 'linear-gradient(135deg, hsl(42 85% 42%), hsl(38 90% 55%))',
                color: 'hsl(230 45% 8%)',
                fontWeight: '700',
              }}
            >
              {loading ? '...' : t('signup.submit')}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm font-cairo hover:underline"
              style={{ color: 'hsl(42 70% 60%)' }}>
              {t('signup.loginLink')}
            </Link>
          </div>
        </div>

        <p className="text-center text-xs mt-6 font-cairo" style={{ color: 'hsl(42 40% 45%)' }}>
          🌙 © 2026 الوجيه لمنظمات الهواء ✨
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
