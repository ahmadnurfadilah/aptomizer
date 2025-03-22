"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
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

interface Pool {
  asset: Asset;
  ltv: string;
  marketSize: string;
  totalBorrowed: string;
  depositApy: number;
  borrowApy: number;
  priceInfo: PriceInfo;
  extraAPY: ExtraAPY;
}

export type { Pool };

interface JoulePoolsListProps {
  pools: Pool[];
}

export function JoulePoolsList({ pools }: JoulePoolsListProps) {
  if (!pools || pools.length === 0) {
    return (
      <Card className="w-full bg-gray-900/50 border-gray-800">
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-400">
            No pools available at the moment
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gray-900/50 border-gray-800 overflow-hidden">
      <CardContent className="p-0">
        <div className="rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-gray-800">
                <TableHead className="text-gray-400 font-medium">Asset</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Supply APY</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">Borrow APY</TableHead>
                <TableHead className="text-gray-400 font-medium text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>LTV</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={14} className="text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs w-48">
                            Loan-to-Value ratio determines how much you can borrow against your collateral
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="text-gray-400 font-medium text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>Utilization</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={14} className="text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs w-48">
                            Percentage of the pool currently being borrowed
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((pool, i) => {
                // Calculate utilization rate
                const marketSize = parseFloat(pool.marketSize) || 0;
                const totalBorrowed = parseFloat(pool.totalBorrowed) || 0;
                const utilizationRate = marketSize > 0 ? totalBorrowed / marketSize : 0;

                // Get total APY (base + extra rewards)
                const extraDepositApy = parseFloat(pool.extraAPY?.depositAPY || '0');
                const totalSupplyApy = pool.depositApy + extraDepositApy;

                // Parse LTV as percentage
                const ltv = parseFloat(pool.ltv) / 100;

                return (
                  <TableRow key={pool.asset?.type || i} className="hover:bg-gray-800/30 border-gray-800">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {pool.asset?.icon ? (
                          <div className="size-8 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img src={pool.asset.icon} alt={pool.asset.displayName} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="size-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                            {pool.asset?.assetName?.[0] || "?"}
                          </div>
                        )}
                        <div>
                          <div>{pool.asset?.displayName || pool.asset?.assetName}</div>
                          <div className="text-xs text-gray-500">{pool.asset?.provider}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {formatNumber(totalSupplyApy / 100, { style: 'percent', maximumFractionDigits: 2 })}
                      {extraDepositApy > 0 && (
                        <div className="text-xs text-emerald-400">
                          +{formatNumber(extraDepositApy / 100, { style: 'percent', maximumFractionDigits: 2 })} rewards
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-amber-500">
                      {formatNumber(pool.borrowApy / 100, { style: 'percent', maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(ltv/100, { style: 'percent', maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        <div className="w-16 bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${Math.min(utilizationRate * 100, 100)}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm">
                          {formatNumber(utilizationRate, { style: 'percent', maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
