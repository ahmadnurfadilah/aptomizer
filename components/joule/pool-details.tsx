"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface PriceInfo {
  price: number;
  currency: string;
  tokenAddress: string;
  chain: string;
  timestamp: string;
  cached: boolean;
}

interface Asset {
  assetName: string;
  displayName: string;
  pythId: string;
  efficiencyMode: number;
  efficiencyLtv: number;
  ltv: number;
  icon: string;
  decimals: number;
  liquidationFactor: number;
  efficientLiquidationFactor: number;
  type: string;
  faAddress: string;
  isFungible: boolean;
  coingeckoId: string;
  provider: string;
}

interface ExtraAPY {
  depositAPY: string;
  borrowAPY: string;
  stakingAPY: string;
}

interface PoolDetail {
  asset: Asset;
  ltv: string;
  marketSize: string;
  totalBorrowed: string;
  depositApy: number;
  borrowApy: number;
  priceInfo: PriceInfo;
  extraAPY: ExtraAPY;
}

export type { PoolDetail };

interface JoulePoolDetailsProps {
  pool: PoolDetail;
}

export function JoulePoolDetails({ pool }: JoulePoolDetailsProps) {
  if (!pool || !pool.asset) {
    return (
      <Card className="w-full bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-400">
            No pool details available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate values from raw data
  const marketSize = parseFloat(pool.marketSize) || 0;
  const totalBorrowed = parseFloat(pool.totalBorrowed) || 0;

  // Calculated values
  const availableLiquidity = marketSize - totalBorrowed;
  const utilizationRate = marketSize > 0 ? totalBorrowed / marketSize : 0;
  const ltvValue = parseFloat(pool.ltv) / 100;

  // APY values
  const extraDepositApy = parseFloat(pool.extraAPY?.depositAPY || '0');
  const extraBorrowApy = parseFloat(pool.extraAPY?.borrowAPY || '0');
  const totalSupplyApy = pool.depositApy + extraDepositApy;
  const totalBorrowApy = pool.borrowApy + extraBorrowApy;

  return (
    <Card className="w-full bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {pool.asset?.icon ? (
            <div className="size-8 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
              <img src={pool.asset.icon} alt={pool.asset.displayName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="size-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">
              {pool.asset?.assetName?.[0] || "?"}
            </div>
          )}
          <span>{pool.asset?.displayName || pool.asset?.assetName}</span>
          {pool.priceInfo?.price && (
            <span className="text-sm font-normal text-gray-400">
              ${formatNumber(pool.priceInfo.price)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <ArrowUpRight size={16} />
              <span className="text-sm font-medium">Supply APY</span>
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(totalSupplyApy / 100, { style: 'percent', maximumFractionDigits: 2 })}
            </div>
            {extraDepositApy > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <TrendingUp size={12} />
                <span>+{formatNumber(extraDepositApy / 100, { style: 'percent', maximumFractionDigits: 2 })} in rewards</span>
              </div>
            )}
          </div>

          <div className="space-y-1 p-3 rounded-lg bg-gray-800/50">
            <div className="flex items-center gap-1.5 text-amber-500">
              <ArrowDownRight size={16} />
              <span className="text-sm font-medium">Borrow APY</span>
            </div>
            <div className="text-xl font-semibold">
              {formatNumber(totalBorrowApy / 100, { style: 'percent', maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <Separator className="bg-gray-800" />

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400">Pool Statistics</h3>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-gray-400">Market Size</div>
            <div className="text-right">
              {formatNumber(parseFloat(pool.marketSize))} {pool.asset?.assetName}
            </div>

            <div className="text-gray-400">Total Borrowed</div>
            <div className="text-right">
              {formatNumber(parseFloat(pool.totalBorrowed))} {pool.asset?.assetName}
            </div>

            <div className="text-gray-400">LTV</div>
            <div className="text-right">
              {formatNumber(parseFloat(pool.ltv) / 10000, { style: 'percent', maximumFractionDigits: 0 })}
            </div>

            <div className="text-gray-400">Liquidation Factor</div>
            <div className="text-right">
              {formatNumber(pool.asset?.liquidationFactor / 100, { style: 'percent', maximumFractionDigits: 0 })}
            </div>

            <div className="text-gray-400">Efficiency Mode</div>
            <div className="text-right">
              {pool.asset?.efficiencyMode ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
