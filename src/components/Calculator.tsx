import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Calculator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t, isRTL } = useLanguage();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  const handleNumber = (n: string) => {
    if (resetNext) {
      setDisplay(n);
      setResetNext(false);
    } else {
      setDisplay(display === '0' ? n : display + n);
    }
  };

  const handleOp = (newOp: string) => {
    const current = parseFloat(display);
    if (prev !== null && op) {
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(result);
    } else {
      setPrev(current);
    }
    setOp(newOp);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, operator: string) => {
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (prev !== null && op) {
      const current = parseFloat(display);
      const result = calculate(prev, current, op);
      setDisplay(String(result));
      setPrev(null);
      setOp(null);
      setResetNext(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrev(null);
    setOp(null);
    setResetNext(false);
  };

  const buttons = [
    ['C', '÷', '×', '-'],
    ['7', '8', '9', '+'],
    ['4', '5', '6', '='],
    ['1', '2', '3', '.'],
    ['0'],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20">
      <div className="bg-card rounded-2xl shadow-lg border border-border w-72 overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 bg-primary">
          <span className="text-primary-foreground font-semibold text-sm">{t('calculator')}</span>
          <button onClick={onClose} className="text-primary-foreground/80 hover:text-primary-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3 text-right text-2xl font-mono bg-secondary text-foreground h-14 flex items-center justify-end px-4 overflow-hidden">
          {display}
        </div>
        <div className="p-3 grid grid-cols-4 gap-2">
          {buttons.flat().map((btn, i) => (
            <button
              key={i}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '=') handleEquals();
                else if (['+', '-', '×', '÷'].includes(btn)) handleOp(btn);
                else handleNumber(btn);
              }}
              className={`
                h-12 rounded-lg font-semibold text-lg transition-colors
                ${btn === '0' ? 'col-span-2' : ''}
                ${btn === 'C' ? 'bg-destructive text-destructive-foreground' : ''}
                ${btn === '=' ? 'bg-primary text-primary-foreground row-span-2' : ''}
                ${['+', '-', '×', '÷'].includes(btn) ? 'bg-accent text-accent-foreground' : ''}
                ${!['C', '=', '+', '-', '×', '÷'].includes(btn) ? 'bg-secondary text-foreground hover:bg-muted' : ''}
              `}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calculator;
