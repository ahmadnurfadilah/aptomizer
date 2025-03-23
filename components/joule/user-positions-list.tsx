import React from 'react';
import { formatNumber } from "@/lib/utils";
import { AlertTriangle, Check } from 'lucide-react';

export interface PositionSummary {
  positionId: string;
  poolId: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  supplied: number;
  suppliedUsd: number;
  borrowed: number;
  borrowedUsd: number;
  collateral: number;
  collateralUsd: number;
  health: number;
  healthStatus: 'Healthy' | 'Warning' | 'Danger';
}

interface JouleUserPositionsListProps {
  positions: PositionSummary[];
  onPositionSelect?: (positionId: string) => void;
}

export function JouleUserPositionsList({ positions, onPositionSelect }: JouleUserPositionsListProps) {
  if (!positions || positions.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-md border border-gray-700 p-4 text-center py-4 text-gray-400">
        You don&apos;t have any active positions on Joule Finance
      </div>
    );
  }

  const totalSupplied = positions.reduce((sum, pos) => sum + pos.suppliedUsd, 0);
  const totalBorrowed = positions.reduce((sum, pos) => sum + pos.borrowedUsd, 0);
  const totalCollateral = positions.reduce((sum, pos) => sum + pos.collateralUsd, 0);

  const handleRowClick = (positionId: string) => {
    if (onPositionSelect) {
      onPositionSelect(positionId);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-md border border-gray-700 overflow-hidden">
      {/* Summary stats at the top */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="text-sm font-medium mb-2">Your Joule Finance Positions</div>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          <div className="p-1.5 bg-gray-800/80 rounded-md">
            <p className="text-gray-400 mb-0.5">Supplied</p>
            <p className="font-medium">${formatNumber(totalSupplied, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-1.5 bg-gray-800/80 rounded-md">
            <p className="text-gray-400 mb-0.5">Borrowed</p>
            <p className="font-medium">${formatNumber(totalBorrowed, { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="p-1.5 bg-gray-800/80 rounded-md">
            <p className="text-gray-400 mb-0.5">Collateral</p>
            <p className="font-medium">${formatNumber(totalCollateral, { maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-3 text-gray-400 text-xs px-3 py-2 border-b border-gray-700/50 bg-gray-900/30">
        <div>Asset</div>
        <div className="text-right">Supplied</div>
        <div className="text-right">Borrowed</div>
      </div>

      {/* Position rows */}
      <div className="divide-y divide-gray-700/50">
        {positions.map((position) => {
          // Determine health status color and icon
          const healthStatusColor =
            position.healthStatus === 'Healthy' ? 'text-green-500' :
            position.healthStatus === 'Warning' ? 'text-amber-500' :
            'text-red-500';

          const healthStatusIcon =
            position.healthStatus === 'Healthy' ? <Check size={12} className="inline-block" /> :
            <AlertTriangle size={12} className="inline-block" />;

          return (
            <div
              key={position.positionId}
              className="grid grid-cols-3 text-xs px-3 py-2 hover:bg-gray-700/20 cursor-pointer"
              onClick={() => handleRowClick(position.positionId)}
            >
              <div className="flex items-center gap-1.5 pr-2">
                {position.tokenLogo ? (
                  <div className="size-5 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={position.tokenLogo} alt={position.tokenSymbol} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="size-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px] shrink-0">
                    {position.tokenSymbol?.[0] || "?"}
                  </div>
                )}
                <div className="truncate">
                  <div className="font-medium truncate">{position.tokenName}</div>
                  <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    {position.tokenSymbol}
                    <span className={`ml-1 ${healthStatusColor}`}>{healthStatusIcon}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                {position.supplied > 0 ? (
                  <>
                    <div>{formatNumber(position.supplied, { maximumFractionDigits: 4 })}</div>
                    <div className="text-[10px] text-gray-500">${formatNumber(position.suppliedUsd, { maximumFractionDigits: 2 })}</div>
                  </>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>

              <div className="text-right">
                {position.borrowed > 0 ? (
                  <>
                    <div className="text-amber-500">{formatNumber(position.borrowed, { maximumFractionDigits: 4 })}</div>
                    <div className="text-[10px] text-gray-500">${formatNumber(position.borrowedUsd, { maximumFractionDigits: 2 })}</div>
                  </>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
