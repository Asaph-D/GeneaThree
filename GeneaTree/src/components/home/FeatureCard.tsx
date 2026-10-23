import React, { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { TiltCard } from '../aceternity/effects';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  items: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, items }) => {
  return (
    <TiltCard className="feature-card relative h-full rounded-2xl border border-white/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 bg-primary-500 rounded-md p-3 text-white">
          {icon}
        </div>
        <div className="ml-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400">
        {description}
      </p>
      <ul className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <Check className="h-4 w-4 text-primary-500 mr-2" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </TiltCard>
  );
};

export default FeatureCard;