import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface IalogusInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showPasswordToggle?: boolean;
  errorMessage?: string;
  successMessage?: string;
}

export function IalogusInput({
  label,
  type = 'text',
  showPasswordToggle = false,
  errorMessage,
  successMessage,
  className,
  value,
  ...props
}: IalogusInputProps) {
  const [inputType, setInputType] = useState(type);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(Boolean(value));
  const isPassword = type === 'password';

  useEffect(() => {
    setHasValue(Boolean(value));
  }, [value]);

  const togglePasswordVisibility = () => {
    setInputType(inputType === 'password' ? 'text' : 'password');
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };

  return (
    <div className="w-full">
      <div className="relative">
        <div className="relative rounded-md overflow-hidden">
          <Input
            type={showPasswordToggle && isPassword ? inputType : type}
            className={cn(
              'ialogus-input border-0 focus:ring-0 py-3 px-3 h-14 bg-gray-100 rounded-md outline-none focus:outline-none text-base',
              isFocused && 'bg-orange-50',
              (isFocused || hasValue) && 'pt-6 pb-2',
              errorMessage && 'border-red-500',
              successMessage && 'border-green-500',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            placeholder=""
            {...props}
          />
          
          {label && (
            <label 
              className={cn(
                "floating-label",
                isFocused 
                  ? "floating-label-active" 
                  : hasValue
                    ? "floating-label-active text-gray-600"
                    : "floating-label-inactive"
              )}
              style={{
                color: isFocused ? '#F6921E' : undefined
              }}
            >
              {label}
            </label>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
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
        
        {showPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none z-10"
          >
            {inputType === 'password' ? (
              <Eye size={20} />
            ) : (
              <EyeOff size={20} />
            )}
          </button>
        )}
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
