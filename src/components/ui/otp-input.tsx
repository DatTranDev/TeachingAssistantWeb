'use client';

import { useRef, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function OtpInput({ value, onChange, length = 6, disabled, className }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const chars = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusNext = (index: number) => {
    const next = inputsRef.current[index + 1];
    next?.focus();
  };

  const focusPrev = (index: number) => {
    const prev = inputsRef.current[index - 1];
    prev?.focus();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-1)
      .toUpperCase();
    const newChars = [...chars];
    newChars[index] = char;
    onChange(newChars.join(''));
    if (char) focusNext(index);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (chars[index]) {
        const newChars = [...chars];
        newChars[index] = '';
        onChange(newChars.join(''));
      } else {
        focusPrev(index);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusPrev(index);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusNext(index);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, length - index);
    if (!pasted) return;
    const newChars = [...chars];
    for (let i = 0; i < pasted.length; i++) {
      if (index + i < length) {
        newChars[index + i] = pasted[i] ?? '';
      }
    }
    onChange(newChars.join(''));
    const nextIndex = Math.min(index + pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className={cn('flex items-center gap-3', className)} role="group" aria-label="OTP input">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="text"
          maxLength={1}
          value={chars[index]}
          disabled={disabled}
          autoComplete="one-time-code"
          aria-label={`Ký tự ${index + 1} của ${length}`}
          className={cn(
            'h-12 w-12 rounded-lg border border-border text-center text-xl font-semibold transition-colors',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            chars[index] && 'border-primary bg-primary/5'
          )}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={(e) => handlePaste(e, index)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
