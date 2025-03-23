import React from 'react';
import { ArrowRightIcon, TrendingUpIcon, ShieldAlertIcon, ClockIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { formatPercent } from '@/lib/utils';

// Types for opportunities
export interface YieldOpportunity {
  asset: {
    name: string;
    symbol: string;
    type: string;
    logoUrl?: string;
  };
  depositAPY: number;
  utilizationRate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendationScore: number;
  liquidity: number;
  ltv: number;
}

interface YieldOpportunitiesListProps {
  opportunities: YieldOpportunity[];
  riskProfileApplied: {
    riskTolerance: number;
    timeHorizon: string;
    minAPY: number;
    preferredAssets: string[];
  };
}

export function YieldOpportunitiesList({ opportunities, riskProfileApplied }: YieldOpportunitiesListProps) {
  // Verify we have valid data
  const validOpportunities = Array.isArray(opportunities) ? opportunities : [];

  if (validOpportunities.length === 0) {
    return (
      <div className="p-3 text-center text-sm bg-gray-800/30 rounded-md border border-gray-700">
        No yield opportunities match your criteria.
      </div>
    );
  }

  // Get the risk profile with safe defaults
  const safeRiskProfile = {
    riskTolerance: riskProfileApplied?.riskTolerance || 5,
    timeHorizon: riskProfileApplied?.timeHorizon || 'Medium',
    minAPY: riskProfileApplied?.minAPY || 0,
    preferredAssets: Array.isArray(riskProfileApplied?.preferredAssets) ? riskProfileApplied.preferredAssets : [],
  };

  return (
    <div className="mb-3">
      {/* Risk profile pills in a row */}
      <div className="flex flex-wrap gap-1.5 mb-2 text-xs">
        <Badge variant="outline" className="flex gap-1 items-center py-0 h-5">
          <ShieldAlertIcon size={12} />
          Risk: {safeRiskProfile.riskTolerance}/10
        </Badge>
        <Badge variant="outline" className="flex gap-1 items-center py-0 h-5">
          <ClockIcon size={12} />
          {safeRiskProfile.timeHorizon}
        </Badge>
        {safeRiskProfile.minAPY > 0 && (
          <Badge variant="outline" className="flex gap-1 items-center py-0 h-5">
            <TrendingUpIcon size={12} />
            Min: {formatPercent(safeRiskProfile.minAPY)}
          </Badge>
        )}
      </div>

      {/* Responsive Table */}
      <div className="border border-gray-700 rounded-md overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-8 bg-gray-800/50 text-xs font-medium text-gray-400 px-2 py-1.5">
          <div className="col-span-4 sm:col-span-3">Asset</div>
          <div className="col-span-2 sm:col-span-2 text-right">APY</div>
          <div className="hidden sm:block sm:col-span-2 text-right">Risk</div>
          <div className="col-span-2 sm:col-span-1 text-right"></div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-700/50">
          {validOpportunities.map((opportunity, index) => (
            <div
              key={index}
              className="grid grid-cols-8 items-center px-2 py-1.5 text-xs hover:bg-gray-800/40"
            >
              {/* Asset column */}
              <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5 min-w-0">
                {opportunity.asset.logoUrl && (
                  <img
                    src={opportunity.asset.logoUrl}
                    alt={opportunity.asset.symbol || 'Token'}
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="truncate">
                  <div className="font-medium">{opportunity.asset.symbol || 'Unknown'}</div>
                  <div className="text-[10px] text-gray-400 truncate max-w-[120px] sm:max-w-none">
                    {opportunity.asset.name || opportunity.asset.type || 'Unknown'}
                  </div>
                </div>
              </div>

              {/* APY column */}
              <div className="col-span-2 sm:col-span-2 text-right">
                <div className="text-blue-300 font-medium">{formatPercent(opportunity.depositAPY/100)}</div>
              </div>

              {/* Risk column - hidden on mobile */}
              <div className="hidden sm:block sm:col-span-2 text-right">
                <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-medium inline-block ${
                  opportunity.riskLevel === 'Low' ? 'bg-green-500/10 text-green-500' :
                  opportunity.riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-red-500/10 text-red-500'
                }`}>
                  {opportunity.riskLevel}
                </span>
              </div>

              {/* Action column */}
              <div className="col-span-2 sm:col-span-1 text-right">
                <button className="text-blue-400 hover:text-blue-300 p-1 rounded-full hover:bg-blue-500/10">
                  <ArrowRightIcon size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
