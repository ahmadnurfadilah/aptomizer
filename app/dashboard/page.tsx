"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useCallback } from "react";
import { ArrowUpRight, ArrowDownRight, Zap, PieChart, RefreshCw, Search, Grid, List, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "motion/react";
import { formatCurrency, formatPercentage, getValueColorClass, truncateAddress, formatPortfolioPercentage } from "./utils";
import { toast } from "sonner";
import EmptyState from "./components/empty-state";

interface Asset {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  priceUsd: number;
  change24h: number;
  apy: number | null;
  logoUrl: string;
}

interface Strategy {
  name: string;
  protocol: string;
  balance: number;
  value: number;
  apy: number;
  timeLeft: string | null;
  health: string;
}

interface PortfolioData {
  aiWalletAddress: string;
  totalValue: number;
  change24h: number;
  change7d: number;
  change30d: number;
  riskScore: number;
  assets: Asset[];
  strategies: Strategy[];
}

// Add a search component for assets
const AssetSearch = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  }, [onSearch]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-4 h-4 text-gray-500" />
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-sm focus:ring-1 focus:ring-white/20 focus:border-gray-600 outline-none"
        placeholder="Search assets..."
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
};

// Create a chart component for asset allocation
const AssetAllocationChart = ({ assets }: { assets: Asset[] }) => {
  if (!assets || assets.length === 0) return null;

  // Calculate total value
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  // Sort assets by value
  const sortedAssets = [...assets].sort((a, b) => b.value - a.value);

  // Take top 5 assets, group the rest as "Other"
  const chartData = sortedAssets.slice(0, 5);
  const otherAssets = sortedAssets.slice(5);

  if (otherAssets.length > 0) {
    const otherValue = otherAssets.reduce((sum, asset) => sum + asset.value, 0);
    if (otherValue > 0) {
      chartData.push({
        name: "Other",
        symbol: "OTHER",
        balance: 0,
        value: otherValue,
        priceUsd: 0,
        change24h: 0,
        apy: null,
        logoUrl: ""
      });
    }
  }

  // Calculate percentages and assign colors
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6b7280"];

  let previousEndAngle = 0;
  const segments = chartData.map((asset, index) => {
    const percentage = (asset.value / totalValue) * 100;
    const startAngle = previousEndAngle;
    const endAngle = startAngle + (percentage / 100) * 360;
    previousEndAngle = endAngle;

    return {
      asset,
      percentage,
      startAngle,
      endAngle,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((segment, i) => {
            // SVG arc path
            const x1 = 50 + 45 * Math.cos((segment.startAngle * Math.PI) / 180);
            const y1 = 50 + 45 * Math.sin((segment.startAngle * Math.PI) / 180);
            const x2 = 50 + 45 * Math.cos((segment.endAngle * Math.PI) / 180);
            const y2 = 50 + 45 * Math.sin((segment.endAngle * Math.PI) / 180);

            // Determine if the arc should be drawn the long way around
            const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;

            return (
              <path
                key={i}
                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={segment.color}
              />
            );
          })}
          <circle cx="50" cy="50" r="30" fill="#000" />
        </svg>
      </div>

      <div className="mt-4 w-full grid grid-cols-2 gap-2">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
            <div className="flex-1 truncate">{segment.asset.symbol}</div>
            <div className="font-medium">{segment.percentage.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add a view toggle component for assets
const ViewToggle = ({
  currentView,
  onViewChange
}: {
  currentView: 'table' | 'grid',
  onViewChange: (view: 'table' | 'grid') => void
}) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 rounded-md p-1">
      <button
        className={cn(
          "p-1.5 rounded-md transition-colors",
          currentView === 'table' ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
        )}
        onClick={() => onViewChange('table')}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        className={cn(
          "p-1.5 rounded-md transition-colors",
          currentView === 'grid' ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
        )}
        onClick={() => onViewChange('grid')}
      >
        <Grid className="w-4 h-4" />
      </button>
    </div>
  );
};

// Add a component for copyable wallet address
const CopyableAddress = ({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 group">
      <span>{truncateAddress(address)}</span>
      <button
        onClick={copyToClipboard}
        className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
};

// Define sort options type
type SortOption = {
  label: string;
  value: 'percentage' | 'value' | 'symbol';
  direction: 'asc' | 'desc';
};

// Add a sort dropdown component
const AssetSortDropdown = ({
  onSortChange
}: {
  onSortChange: (option: SortOption) => void
}) => {
  const sortOptions: SortOption[] = [
    { label: 'Highest %', value: 'percentage', direction: 'desc' },
    { label: 'Lowest %', value: 'percentage', direction: 'asc' },
    { label: 'Highest Value', value: 'value', direction: 'desc' },
    { label: 'Lowest Value', value: 'value', direction: 'asc' },
    { label: 'Symbol (A-Z)', value: 'symbol', direction: 'asc' },
    { label: 'Symbol (Z-A)', value: 'symbol', direction: 'desc' },
  ];

  return (
    <select
      className="bg-gray-800/50 border border-gray-700 rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-white/20 focus:border-gray-600 outline-none"
      onChange={(e) => {
        const index = parseInt(e.target.value);
        onSortChange(sortOptions[index]);
      }}
      defaultValue={0}
    >
      {sortOptions.map((option, index) => (
        <option key={index} value={index}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

// Inside the Dashboard component, add this utility function to calculate the total optimization potential
const calculateTotalOptimizationPotential = (opportunities: { potentialGain: string }[]): string => {
  if (!opportunities || opportunities.length === 0) return "0.00";

  // Sum up all potential gains
  const totalPotential = opportunities.reduce((sum, opportunity) => {
    // Extract the number from potentialGain string (e.g., "+$32.40/year" -> 32.40)
    const gainValue = parseFloat(opportunity.potentialGain.replace('+$', '').replace('/year', ''));
    return sum + gainValue;
  }, 0);

  return totalPotential.toFixed(2);
};

export default function Dashboard() {
  const { account, connected } = useWallet();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetView, setAssetView] = useState<'table' | 'grid'>('table');
  const [sortOption, setSortOption] = useState<SortOption>({
    label: 'Highest %',
    value: 'percentage',
    direction: 'desc'
  });
  const [aiWalletAddress, setAiWalletAddress] = useState<string | null>(null);
  const [hasAiWallet, setHasAiWallet] = useState<boolean>(true);
  const [optimizationOpportunities, setOptimizationOpportunities] = useState<{
    title: string;
    description: string;
    potentialGain: string;
    risk: string;
    apy?: number;
    protocol?: string;
  }[]>([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);

  // Filter and sort assets based on search query and sort option
  useEffect(() => {
    if (!portfolioData?.assets) {
      setFilteredAssets([]);
      return;
    }

    // First filter by search query
    let assets = [...portfolioData.assets];
    if (assetSearchQuery) {
      const query = assetSearchQuery.toLowerCase();
      assets = assets.filter(
        asset => asset.symbol.toLowerCase().includes(query) ||
                 asset.name.toLowerCase().includes(query)
      );
    }

    // Then sort based on sort option
    assets.sort((a, b) => {
      switch (sortOption.value) {
        case 'percentage':
          const percentA = a.value / (portfolioData?.totalValue || 1);
          const percentB = b.value / (portfolioData?.totalValue || 1);
          return sortOption.direction === 'asc'
            ? percentA - percentB
            : percentB - percentA;
        case 'value':
          return sortOption.direction === 'asc'
            ? a.value - b.value
            : b.value - a.value;
        case 'symbol':
          return sortOption.direction === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        default:
          return 0;
      }
    });

    setFilteredAssets(assets);
  }, [portfolioData?.assets, portfolioData?.totalValue, assetSearchQuery, sortOption]);

  const fetchOptimizationOpportunities = async () => {
    if (!connected || !account?.address) {
      return;
    }

    setIsLoadingOpportunities(true);
    try {
      const response = await fetch('/api/user/optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: account.address.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch optimization opportunities');
      }

      const data = await response.json();
      setOptimizationOpportunities(data);
    } catch (error) {
      console.error('Error fetching optimization opportunities:', error);
      // Fall back to an empty array, or provide default opportunities if needed
      setOptimizationOpportunities([]);
    } finally {
      setIsLoadingOpportunities(false);
    }
  };

  const fetchPortfolioData = async () => {
    if (!connected || !account?.address) {
      setIsLoadingData(false);
      setHasAiWallet(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const response = await fetch('/api/user/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: account.address.toString() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404 && errorData.error === "AI wallet not found") {
          setHasAiWallet(false);
        }
        throw new Error(errorData.error || 'Failed to fetch portfolio data');
      }

      const data = await response.json();
      setPortfolioData(data);
      setAiWalletAddress(data.aiWalletAddress);
      setHasAiWallet(true);

      // After getting portfolio data, fetch optimization opportunities
      await fetchOptimizationOpportunities();
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      if (error instanceof Error && error.message !== "AI wallet not found") {
        toast.error('Failed to fetch portfolio data');
      }
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [connected, account]);

  if (!connected) {
    return (
      <div
        className="h-full w-full min-h-screen rounded-md bg-gray-950 relative overflow-hidden pt-16"
        style={{
          backgroundColor: `#030712`,
          opacity: 1,
          backgroundImage: `radial-gradient(#0f172a 1.25px, #030712 1.25px)`,
          backgroundSize: `24px 24px`,
        }}
      >
        <Spotlight />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Connect Wallet</h2>
            <p className="text-gray-400 max-w-md">
              Connect your wallet to view your AptoMizer dashboard and portfolio information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full min-h-screen rounded-md bg-gray-950 relative overflow-hidden pt-20 pb-12"
      style={{
        backgroundColor: `#030712`,
        opacity: 1,
        backgroundImage: `radial-gradient(#0f172a 1.25px, #030712 1.25px)`,
        backgroundSize: `24px 24px`,
      }}
    >
      <Spotlight />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {isLoadingData ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-pulse flex space-x-2">
              <div className="rounded-full bg-gray-700 h-3 w-3"></div>
              <div className="rounded-full bg-gray-700 h-3 w-3"></div>
              <div className="rounded-full bg-gray-700 h-3 w-3"></div>
            </div>
          </div>
        ) : !hasAiWallet ? (
          <EmptyState />
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-8"
          >
            <div className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold">Portfolio Overview</h1>
                  <div className="flex flex-col gap-1 text-gray-400">
                    <p className="flex items-center gap-1">User: {account?.address ? <CopyableAddress address={account.address.toString()} /> : '-'}</p>
                    {aiWalletAddress && (
                      <p className="flex items-center gap-1">AI Wallet: <CopyableAddress address={aiWalletAddress} /></p>
                    )}
                  </div>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <button
                    onClick={fetchPortfolioData}
                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
                    disabled={isLoadingData}
                  >
                    <RefreshCw className={`size-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                  </button>
                  <div className="inline-flex items-center bg-gray-800 px-3 py-1 rounded-lg">
                    <PieChart className="size-4 text-gray-400 mr-2" />
                    <div className="text-sm">
                      Risk Score: <span className="font-medium">{portfolioData?.riskScore || 0}/100</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-3xl font-bold">${formatCurrency(portfolioData?.totalValue || 0)}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {portfolioData?.change24h !== null && (
                    <span className={cn("flex items-center text-sm", getValueColorClass(portfolioData?.change24h || 0))}>
                      {(portfolioData?.change24h || 0) >= 0 ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                      {formatPercentage(portfolioData?.change24h || 0)} (24h)
                    </span>
                  )}
                  {portfolioData?.change7d !== null && (
                    <span className={cn("flex items-center text-sm", getValueColorClass(portfolioData?.change7d || 0))}>
                      {(portfolioData?.change7d || 0) >= 0 ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                      {formatPercentage(portfolioData?.change7d || 0)} (7d)
                    </span>
                  )}
                  {portfolioData?.change30d !== null && (
                    <span className={cn("flex items-center text-sm", getValueColorClass(portfolioData?.change30d || 0))}>
                      {(portfolioData?.change30d || 0) >= 0 ? <ArrowUpRight className="size-3 mr-1" /> : <ArrowDownRight className="size-3 mr-1" />}
                      {formatPercentage(portfolioData?.change30d || 0)} (30d)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-black/40 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Assets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioData?.assets?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Active Strategies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioData?.strategies?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Avg. APY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {portfolioData?.strategies && portfolioData.strategies.length > 0
                        ? formatPercentage(
                            portfolioData.strategies.reduce((sum, s) => sum + s.apy, 0) / portfolioData.strategies.length
                          )
                        : "0.0%"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-black/40 border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Optimization Potential</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOpportunities ? (
                      <div className="animate-pulse h-8 bg-gray-800 rounded w-3/4"></div>
                    ) : (
                      <div className="text-2xl font-bold">+${calculateTotalOptimizationPotential(optimizationOpportunities)}/yr</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Tabs defaultValue="assets" className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Portfolio Breakdown</h2>
                    <TabsList className="bg-gray-900 border border-gray-800">
                      <TabsTrigger value="assets">Assets</TabsTrigger>
                      <TabsTrigger value="strategies">Strategies</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="assets" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Asset Overview Cards */}
                      <Card className="bg-black/20 backdrop-blur-sm border border-white/10 md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Asset Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                              <div className="space-y-2">
                                {portfolioData?.assets.slice(0, 3).map((asset, index) => (
                                  <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {asset.logoUrl ? (
                                        <img src={asset.logoUrl} alt={asset.symbol} className="w-5 h-5 rounded-full" />
                                      ) : (
                                        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                                          {asset.symbol.charAt(0)}
                                        </div>
                                      )}
                                      <span className="font-medium">{asset.symbol}</span>
                                    </div>
                                    <div className="flex items-center justify-end">
                                      <div className="text-right">
                                        {formatPortfolioPercentage(asset.value, portfolioData?.totalValue || 1)}
                                      </div>
                                      <div className="w-16 bg-gray-800 h-1.5 ml-2 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${(asset.value / (portfolioData?.totalValue || 1)) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {portfolioData?.assets && portfolioData.assets.length > 3 && (
                                  <div className="flex items-center justify-between text-gray-500 text-sm">
                                    <span>Other assets ({portfolioData.assets.length - 3})</span>
                                    <div>
                                      {formatPortfolioPercentage(portfolioData.assets.slice(3).reduce((sum, asset) => sum + asset.value, 0), portfolioData?.totalValue || 1)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Allocation Chart */}
                            <div className="hidden md:block">
                              {portfolioData?.assets && <AssetAllocationChart assets={portfolioData.assets} />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm text-gray-400">Total Assets</div>
                              <div className="text-2xl font-bold">{portfolioData?.assets?.length || 0}</div>
                            </div>

                            <div>
                              <div className="text-sm text-gray-400">Total Value</div>
                              <div className="text-2xl font-bold">${formatCurrency(portfolioData?.totalValue || 0)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-xs text-gray-400">Best Performer</div>
                                {portfolioData?.assets && portfolioData.assets.length > 0 ? (
                                  <div className="font-medium">
                                    {(() => {
                                      // Filter assets with non-null change24h
                                      const assetsWithChange = portfolioData.assets.filter(a => a.change24h !== null);
                                      if (assetsWithChange.length === 0) {
                                        return "N/A";
                                      }
                                      return assetsWithChange.reduce((best, asset) =>
                                        ((asset.change24h || 0) > (best.change24h || 0)) ? asset : best
                                      ).symbol;
                                    })()}
                                  </div>
                                ) : (
                                  <div>-</div>
                                )}
                              </div>

                              <div>
                                <div className="text-xs text-gray-400">Worst Performer</div>
                                {portfolioData?.assets && portfolioData.assets.length > 0 ? (
                                  <div className="font-medium">
                                    {(() => {
                                      // Filter assets with non-null change24h
                                      const assetsWithChange = portfolioData.assets.filter(a => a.change24h !== null);
                                      if (assetsWithChange.length === 0) {
                                        return "N/A";
                                      }
                                      return assetsWithChange.reduce((worst, asset) =>
                                        ((asset.change24h || 0) < (worst.change24h || 0)) ? asset : worst
                                      ).symbol;
                                    })()}
                                  </div>
                                ) : (
                                  <div>-</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                      <CardContent className="py-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-2">
                          <div className="flex flex-1 items-center justify-between w-full">
                            <AssetSearch onSearch={setAssetSearchQuery} />
                            <div className="text-sm text-gray-400 hidden md:block">
                              {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} found
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-400 md:hidden">
                              {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
                            </div>
                            <div className="flex items-center gap-2">
                              <AssetSortDropdown onSortChange={setSortOption} />
                              <ViewToggle currentView={assetView} onViewChange={setAssetView} />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardContent className="p-0">
                        {filteredAssets.length > 0 ? (
                          assetView === 'table' ? (
                            <div className="divide-y divide-gray-800">
                              <div className="grid grid-cols-6 px-6 py-3 text-xs font-medium text-gray-400">
                                <div className="col-span-2">Asset</div>
                                <div className="text-right">Balance</div>
                                <div className="text-right">Price</div>
                                <div className="text-right">Value</div>
                                <div className="text-right">% of Portfolio</div>
                              </div>
                              {filteredAssets.map((asset, index) => (
                                <div key={index} className="grid grid-cols-6 px-6 py-4 text-sm">
                                  <div className="font-medium flex items-center gap-2 col-span-2">
                                    {asset.logoUrl ? (
                                      <img src={asset.logoUrl} alt={asset.symbol} className="w-6 h-6 rounded-full" />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-xs">
                                        {asset.symbol.charAt(0)}
                                      </div>
                                    )}
                                    <div>
                                      <div>{asset.symbol}</div>
                                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{asset.name}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">{formatCurrency(asset.balance, 6, 8)}</div>
                                  <div className="text-right">${formatCurrency(asset.priceUsd, 2, 6)}</div>
                                  <div className="text-right">${formatCurrency(asset.value)}</div>
                                  <div className="text-right text-blue-400 flex items-center justify-end">
                                    {formatPortfolioPercentage(asset.value, portfolioData?.totalValue || 1)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3">
                              {filteredAssets.map((asset, index) => (
                                <div key={index} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-lg overflow-hidden">
                                  <div className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        {asset.logoUrl ? (
                                          <img src={asset.logoUrl} alt={asset.symbol} className="w-8 h-8 rounded-full" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm">
                                            {asset.symbol.charAt(0)}
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-bold">{asset.symbol}</div>
                                          <div className="text-xs text-gray-400 truncate max-w-[120px]">{asset.name}</div>
                                        </div>
                                      </div>
                                      <div className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                                        {formatPortfolioPercentage(asset.value, portfolioData?.totalValue || 1)}
                                      </div>
                                    </div>

                                    {/* Add progress bar for portfolio percentage */}
                                    <div className="mb-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${(asset.value / (portfolioData?.totalValue || 1)) * 100}%` }}
                                      ></div>
                                    </div>

                                    <div className="mt-3 space-y-1">
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-400">Balance</div>
                                        <div className="font-medium">{formatCurrency(asset.balance, 6, 8)}</div>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-400">Price</div>
                                        <div className="font-medium">${formatCurrency(asset.priceUsd, 2, 6)}</div>
                                      </div>

                                      {asset.change24h !== null && (
                                        <div className="flex justify-between items-center">
                                          <div className="text-sm text-gray-400">24h Change</div>
                                          <div className={cn("font-medium", getValueColorClass(asset.change24h))}>
                                            {formatPercentage(asset.change24h)}
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                                        <div className="text-sm text-gray-400">Value</div>
                                        <div className="font-bold">${formatCurrency(asset.value)}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        ) : (
                          <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-400">
                              {assetSearchQuery
                                ? 'No assets match your search'
                                : 'No assets found in your AI wallet'}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="strategies" className="mt-0">
                    <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                      <CardContent className="p-0">
                        {portfolioData?.strategies && portfolioData.strategies.length > 0 ? (
                          <div className="divide-y divide-gray-800">
                            <div className="grid grid-cols-5 px-6 py-3 text-xs font-medium text-gray-400">
                              <div>Strategy</div>
                              <div>Protocol</div>
                              <div className="text-right">Value (USD)</div>
                              <div className="text-right">APY</div>
                              <div className="text-right">Health</div>
                            </div>
                            {portfolioData.strategies.map((strategy, index) => (
                              <div key={index} className="grid grid-cols-5 px-6 py-4 text-sm">
                                <div className="font-medium">{strategy.name}</div>
                                <div className="text-gray-400">{strategy.protocol}</div>
                                <div className="text-right">${formatCurrency(strategy.value)}</div>
                                <div className="text-right text-green-500">{strategy.apy}%</div>
                                <div className="text-right">
                                  <span className={cn("px-2 py-1 rounded-full text-xs",
                                    strategy.health === "Excellent" ? "bg-green-500/20 text-green-400" :
                                    strategy.health === "Good" ? "bg-blue-500/20 text-blue-400" :
                                    "bg-yellow-500/20 text-yellow-400")}>
                                    {strategy.health}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-400">No active strategies found</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-4">Optimization Opportunities</h2>
                <div className="space-y-4">
                  {isLoadingOpportunities ? (
                    // Loading state for opportunities
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Card key={i} className="bg-black/20 backdrop-blur-sm border border-white/10">
                          <CardHeader className="pb-2">
                            <div className="animate-pulse h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="animate-pulse h-4 bg-gray-700 rounded w-full"></div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <div className="animate-pulse h-3 bg-gray-700 rounded w-1/3"></div>
                              <div className="animate-pulse h-8 bg-gray-700 rounded-full w-24"></div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : optimizationOpportunities.length > 0 ? (
                    // Real optimization opportunities
                    optimizationOpportunities.map((opportunity, index) => (
                      <Card key={index} className="bg-black/20 backdrop-blur-sm border border-white/10">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base font-bold">
                              <span className="flex items-center">
                                <Zap className="size-4 text-yellow-500 mr-2" />
                                {opportunity.title}
                              </span>
                            </CardTitle>
                            <span className="text-green-500 text-sm font-medium">{opportunity.potentialGain}</span>
                          </div>
                          <CardDescription className="mt-2">{opportunity.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-400">
                              Risk: <span className={cn(
                                opportunity.risk === "Low" ? "text-green-400" :
                                opportunity.risk === "Low-Medium" ? "text-blue-400" :
                                opportunity.risk === "Medium" ? "text-yellow-400" :
                                opportunity.risk === "Medium-High" ? "text-orange-400" :
                                "text-red-400"
                              )}>{opportunity.risk}</span>
                              {opportunity.apy && (
                                <span className="ml-2">• APY: <span className="text-green-400">{opportunity.apy}%</span></span>
                              )}
                            </div>
                            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs transition">
                              Apply Strategy
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    // No opportunities found
                    <Card className="bg-black/20 backdrop-blur-sm border border-white/10">
                      <CardContent className="p-6 text-center">
                        <p className="text-gray-400">No optimization opportunities found for your current portfolio.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
