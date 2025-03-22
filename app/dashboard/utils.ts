import { truncateAddress } from "@/lib/utils";

export { truncateAddress };

/**
 * Format number as currency
 */
export const formatCurrency = (
  value: number | null | undefined,
  decimals: number = 2,
  maxDecimals: number = 8
): string => {
  if (value === null || value === undefined) return '0.00';

  // Determine appropriate decimal places based on value magnitude
  let decimalPlaces = decimals;
  if (value < 0.01 && value > 0) {
    // For very small values, show more decimal places
    decimalPlaces = Math.min(6, maxDecimals);
  } else if (value < 0.0001 && value > 0) {
    decimalPlaces = Math.min(maxDecimals, 8);
  }

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
};

/**
 * Format percentage
 */
export const formatPercentage = (
  value: number | null | undefined,
  includeSymbol: boolean = false
): string => {
  if (value === null || value === undefined) return includeSymbol ? '0.0%' : '0.0';

  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  return includeSymbol ? `${formattedValue}%` : formattedValue;
};

/**
 * Get color class based on value sign
 */
export const getValueColorClass = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return "text-gray-500";
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-gray-500";
};

export const getTokenLogoFallback = (symbol: string): string => {
  // Convert symbol to uppercase for consistency
  const cleanSymbol = symbol.toUpperCase().trim();

  // Known token logos - this could be expanded with more tokens
  const knownLogos: Record<string, string> = {
    'APT': 'https://raw.githubusercontent.com/hippospace/aptos-coin-list/main/icons/APT.webp',
    'BTC': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    'ETH': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    'USDC': 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    'USDT': 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    'DAI': 'https://assets.coingecko.com/coins/images/9956/large/dai-multi-collateral-mcd.png'
  };

  return knownLogos[cleanSymbol] || '';
};

export const getCoinTypeFromResourceType = (resourceType: string): string => {
  // Extract the coin type from a resource type string like:
  // 0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
  const coinTypeMatch = resourceType.match(/<([^>]+)>/);
  if (coinTypeMatch && coinTypeMatch[1]) {
    return coinTypeMatch[1];
  }
  return '';
};

export const simplifyTokenName = (name: string): string => {
  // Remove common prefixes, namespaces, etc.
  // e.g., "0x1::aptos_coin::AptosCoin" -> "AptosCoin"
  const parts = name.split('::');
  if (parts.length > 0) {
    return parts[parts.length - 1];
  }
  return name;
};

export const getTokenSymbolFromCoinType = (coinType: string): string => {
  // Extract a symbol from a coin type
  // This is a simple implementation - in a real app you'd have a more complete mapping
  const knownTokens: Record<string, string> = {
    '0x1::aptos_coin::AptosCoin': 'APT',
    '0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T': 'USDC',
    '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT': 'USDT'
  };

  return knownTokens[coinType] || simplifyTokenName(coinType).toUpperCase();
};

/**
 * Format portfolio percentage
 */
export const formatPortfolioPercentage = (value: number, total: number): string => {
  if (total === 0) return '0.00%';
  return ((value / total) * 100).toFixed(2) + '%';
};
