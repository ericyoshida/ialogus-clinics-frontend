import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

interface IalogusButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'gradient' | 'auth-gradient' | 'auth-gradient-no-blue' | 'diagonal-gradient' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

export function IalogusButton({
  children,
  variant = 'gradient',
  size = 'default',
  fullWidth = false,
  className,
  ...props
}: IalogusButtonProps) {
  return (
    <Button
      className={cn(
        'font-normal rounded-md transition-all',
        variant === 'gradient' && 'ialogus-gradient text-white hover:opacity-90',
        variant === 'auth-gradient' && 'ialogus-gradient-auth text-white hover:opacity-90',
        variant === 'auth-gradient-no-blue' && 'ialogus-gradient-auth-no-blue text-white hover:opacity-90',
        variant === 'diagonal-gradient' && 'ialogus-gradient-diagonal text-white hover:opacity-90',
        variant === 'outline' && 'border border-ialogus-purple text-ialogus-purple bg-transparent hover:bg-ialogus-purple/10',
        variant === 'ghost' && 'text-ialogus-purple bg-transparent hover:bg-ialogus-purple/10',
        size === 'default' && 'py-2 px-4',
        size === 'sm' && 'py-1 px-3 text-sm',
        size === 'lg' && 'py-3 px-6 text-lg',
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
