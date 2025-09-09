
import React from 'react';
import { IalogusCard } from '@/components/ui/ialogus-card';

interface CompanyCardProps {
  name: string;
  logo?: string;
  isGradient?: boolean;
}

export function CompanyCard({ name, logo, isGradient = false }: CompanyCardProps) {
  return (
    <IalogusCard
      title={name}
      gradient={isGradient}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      }
    >
      <div className="flex items-center justify-center mt-6">
        {logo ? (
          <img src={logo} alt={name} className="max-h-24 max-w-full" />
        ) : (
          <div className={`${isGradient ? 'bg-gradient-to-br from-[#ff8e25] to-[#8f2da3]' : 'bg-gray-200'} w-24 h-24 rounded-lg flex items-center justify-center`}>
            {isGradient ? (
              <div className="w-10 h-10 bg-white/30 rounded-full"></div>
            ) : (
              <span className="text-gray-400 text-3xl">Logo</span>
            )}
          </div>
        )}
      </div>
    </IalogusCard>
  );
}
