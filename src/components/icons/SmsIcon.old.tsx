import { cn } from '@/lib/utils';
import { SVGProps } from 'react';

export function SmsIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={cn("text-yellow-500", className)} 
      {...props}
    >
      <path d="M22 12.5c0-2.76-2.24-5-5-5h-5.5V16h5.5c2.76 0 5-2.24 5-5z" />
      <path d="M14.5 2h-5c-2.76 0-5 2.24-5 5v10c0 2.76 2.24 5 5 5h5c2.76 0 5-2.24 5-5v-4.5" />
      <line x1="6" y1="12" x2="14" y2="12" />
      <line x1="6" y1="8" x2="9" y2="8" />
      <line x1="6" y1="16" x2="9" y2="16" />
    </svg>
  );
} 