import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageProgressProps {
  title: string;
  current: number;
  total: number;
  unit: string;
  color?: string;
}

export const UsageProgress: React.FC<UsageProgressProps> = ({ 
  title, 
  current, 
  total, 
  unit,
  color = 'bg-blue-600'
}) => {
  const percentage = Math.min(Math.round((current / total) * 100), 100);
  
  return (
    <Card className="overflow-hidden border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <div className="text-2xl font-bold">
            {current.toLocaleString()} <span className="text-sm font-normal text-slate-400">{unit}</span>
          </div>
          <div className="text-sm text-slate-400">
            {percentage}% of {total.toLocaleString()} {unit}
          </div>
        </div>
        
        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
