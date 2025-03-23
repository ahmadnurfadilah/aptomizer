/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, Check, ChevronsUp, DollarSign } from "lucide-react";

export interface UserPosition {
  positionId: string;
  owner: string;
  poolId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  borrowed: number;
  collateral: number;
  supplied: number;
  borrowedUsd: number;
  collateralUsd: number;
  suppliedUsd: number;
  health: number;
  liquidationThreshold: number;
  maxLtv: number;
  healthStatus: 'Healthy' | 'Warning' | 'Danger';
  borrowLimit: number;
  borrowLimitUsed: number;
}

interface JouleUserPositionProps {
  position: UserPosition;
}

export function JouleUserPosition({ position }: JouleUserPositionProps) {
  if (!position) {
    return (
      <div className="bg-gray-800/50 rounded-md border border-gray-700 text-center py-4 text-gray-400">
        No position details available
      </div>
    );
  }

  // Determine health status color and icon
  const healthStatusColor =
    position.healthStatus === 'Healthy' ? 'text-green-500' :
    position.healthStatus === 'Warning' ? 'text-amber-500' :
    'text-red-500';

  const healthStatusIcon =
    position.healthStatus === 'Healthy' ? <Check size={16} /> :
    position.healthStatus === 'Warning' ? <AlertTriangle size={16} /> :
    <AlertTriangle size={16} />;

  return (
    <div className="bg-gray-800/50 rounded-md border border-gray-700 overflow-hidden">
      {/* Header with position info */}
      <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700 flex items-center gap-2">
        {position.tokenLogo ? (
          <div className="size-6 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
            <img src={position.tokenLogo} alt={position.tokenSymbol} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="size-6 rounded-full bg-gray-800 flex items-center justify-center text-xs">
            {position.tokenSymbol?.[0] || "?"}
          </div>
        )}
        <span className="font-medium">{position.tokenName || position.tokenSymbol}</span>

        <div className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${healthStatusColor} bg-opacity-20 flex items-center gap-1 ${
          position.healthStatus === 'Healthy' ? 'bg-green-500/10' :
          position.healthStatus === 'Warning' ? 'bg-amber-500/10' :
          'bg-red-500/10'
        }`}>
          {healthStatusIcon}
          {position.healthStatus}
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-xs flex items-center gap-1 mb-1">
                <DollarSign size={12} />
                Position Value
              </p>
              <p className="text-base font-medium">
                ${formatNumber(position.suppliedUsd + position.collateralUsd, { maximumFractionDigits: 2 })}
              </p>
            </div>

            {position.supplied > 0 && (
              <div>
                <p className="text-gray-400 text-xs flex items-center gap-1 mb-1">
                  <ChevronsUp size={12} />
                  Supplied
                </p>
                <p className="text-sm">
                  {formatNumber(position.supplied, { maximumFractionDigits: 6 })} {position.tokenSymbol}
                  <span className="text-xs text-gray-400 ml-1">
                    (${formatNumber(position.suppliedUsd, { maximumFractionDigits: 2 })})
                  </span>
                </p>
              </div>
            )}

            {position.collateral > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Collateral</p>
                <p className="text-sm">
                  {formatNumber(position.collateral, { maximumFractionDigits: 6 })} {position.tokenSymbol}
                  <span className="text-xs text-gray-400 ml-1">
                    (${formatNumber(position.collateralUsd, { maximumFractionDigits: 2 })})
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {position.borrowed > 0 && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Borrowed</p>
                <p className="text-sm text-amber-500">
                  {formatNumber(position.borrowed, { maximumFractionDigits: 6 })} {position.tokenSymbol}
                  <span className="text-xs text-gray-400 ml-1">
                    (${formatNumber(position.borrowedUsd, { maximumFractionDigits: 2 })})
                  </span>
                </p>
              </div>
            )}

            <div>
              <p className="text-gray-400 text-xs mb-1">Borrow Limit</p>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      position.borrowLimitUsed < 60 ? 'bg-green-500' :
                      position.borrowLimitUsed < 80 ? 'bg-amber-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(position.borrowLimitUsed, 100)}%` }}
                  />
                </div>
                <span className="text-xs">
                  {formatNumber(position.borrowLimitUsed/100, { style: 'percent', maximumFractionDigits: 0 })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Max: ${formatNumber(position.borrowLimit, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
