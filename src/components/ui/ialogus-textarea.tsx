import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

interface IalogusTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  errorMessage?: string;
  successMessage?: string;
}

export function IalogusTextarea({
  label,
  errorMessage,
  successMessage,
  className,
  value,
  ...props
}: IalogusTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="w-full">
      <div className={cn(
        "relative rounded-md overflow-hidden transition-colors",
        isFocused ? "bg-orange-50" : "bg-gray-100"
      )}>
        <div 
          className={cn(
            "absolute left-0 right-0 top-0 h-6 z-10",
            isFocused ? "bg-orange-50" : "bg-gray-100"
          )}
        />
        
        <Textarea
          className={cn(
            'border-0 focus:ring-0 min-h-[90px] rounded-md outline-none focus:outline-none resize-y px-3 w-full relative z-0',
            (isFocused || hasValue) ? 'pt-7 pb-2' : 'py-3',
            errorMessage && 'border-red-500',
            successMessage && 'border-green-500',
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          value={value}
          placeholder=""
          style={{ backgroundColor: 'transparent' }}
          {...props}
        />
        
        {label && (
          <label 
            className={cn(
              "absolute left-3 transition-all duration-200 pointer-events-none z-20",
              isFocused 
                ? "text-xs font-medium top-2" 
                : hasValue
                  ? "text-xs font-medium top-2 text-gray-600"
                  : "text-base text-gray-500 top-3"
            )}
            style={{
              color: isFocused ? '#F6921E' : undefined
            }}
          >
            {label}
          </label>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden z-20">
          <div 
            className={cn(
              'w-full transition-all duration-200', 
              isFocused 
                ? 'h-1' 
                : 'h-0.5'
            )}
            style={{
              background: isFocused 
                ? 'linear-gradient(90deg, #F6921E 14%, #EE413D 45%, #E63F42 50%, #D33952 57%, #B2306D 66%, #852492 76%, #4B14C1 87%, #0501FA 99%, #0000FF 100%)' 
                : 'linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 30%, #8b8fff 70%, #0000cc 100%)'
            }}
          />
        </div>
      </div>
      
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
      
      {successMessage && (
        <p className="text-xs text-green-500 mt-1">{successMessage}</p>
      )}
    </div>
  );
} 