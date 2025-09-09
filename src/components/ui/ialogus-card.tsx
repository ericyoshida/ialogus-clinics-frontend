
import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import { Card } from '@/components/ui/card';

export interface IalogusCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: boolean;
  backgroundImage?: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function IalogusCard({
  title,
  description,
  icon,
  gradient = false,
  backgroundImage,
  className,
  onClick,
  children,
}: IalogusCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const cardStyle = {
    backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 h-full shadow",
        gradient ? "bg-gradient-to-br from-[#ff8e25]/10 to-[#8f2da3]/10" : "bg-white",
        isHovered && "shadow-lg transform scale-[1.01]",
        onClick && "cursor-pointer",
        className
      )}
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-4 right-4 text-[#ff8e25] transition-opacity duration-300">
        {icon}
      </div>
      
      <div className="p-6 flex flex-col h-full">
        <div>
          <h3 className={cn(
            "text-xl font-medium",
            gradient ? "text-[#ff8e25]" : "text-gray-700"
          )}>
            {title}
          </h3>
          
          {description && (
            <p className="text-gray-600 mt-2">
              {description}
            </p>
          )}
        </div>
        
        <div className="mt-auto">
          {children}
        </div>
      </div>
      
      {gradient && (
        <div className="absolute bottom-0 right-0">
          <div className="w-32 h-32 bg-gradient-to-br from-[#ff8e25] to-[#8f2da3] rounded-tl-full opacity-80"></div>
        </div>
      )}
    </Card>
  );
}
