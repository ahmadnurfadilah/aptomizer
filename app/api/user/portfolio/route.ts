import { NextRequest, NextResponse } from "next/server";
import { getAiWallet, getAptosAgent, getUserByWalletAddress } from "@/lib/wallet-service";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import axios from "axios";
import { getTokenLogoFallback, getCoinTypeFromResourceType, simplifyTokenName, getTokenSymbolFromCoinType } from "@/app/dashboard/utils";

interface TokenInfo {
  chainId: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl: string;
  panoraSymbol?: string;
  panoraTags?: string[];
}

interface Asset {
  name: string;
  symbol: string;
  balance: number;
  value: number;
  priceUsd: number;
  change24h: number | null;
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
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
  riskScore: number;
  assets: Asset[];
  strategies: Strategy[];
}

// Add interface for resource data
interface CoinStoreResource {
  coin: {
    value: string;
  };
  frozen: boolean;
  deposit_events: {
    counter: string;
    guid: {
      id: {
        addr: string;
        creation_num: string;
      }
    }
  };
  withdraw_events: {
    counter: string;
    guid: {
      id: {
        addr: string;
        creation_num: string;
      }
    }
  };
}

// Define interface for Joule market data
interface JouleMarketData {
  priceInfo?: {
    tokenAddress: string;
    price: number;
  };
  asset?: {
    type: string;
    name: string;
    symbol: string;
  };
  depositApy: number;
  borrowApy: number;
  extraAPY?: {
    depositAPY: string;
    borrowAPY: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const user = await getUserByWalletAddress(walletAddress);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get AI wallet
    const aiWallet = await getAiWallet(user.id);
    if (!aiWallet) {
      return NextResponse.json(
        { error: "AI wallet not found" },
        { status: 404 }
      );
    }

    // Initialize Aptos client
    const aptosConfig = new AptosConfig({
      network: process.env.NETWORK === "mainnet" ? Network.MAINNET : Network.TESTNET,
    });
    const aptos = new Aptos(aptosConfig);

    // Get token list from GitHub
    let tokenList: TokenInfo[] = [];
    try {
      const tokenListResponse = await axios.get(
        "https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/refs/heads/main/token-list.json"
      );
      tokenList = tokenListResponse.data;
    } catch (error) {
      console.error("Error fetching token list:", error);
      // Continue with empty token list
    }

    // Get agent for token price
    const agent = await getAptosAgent(user.id);

    // Prepare assets array and calculate total value
    const assets: Asset[] = [];
    let totalValue = 0;

    // Fetch APT balance
    let aptBalanceInAptos = 0;
    try {
      const aptosBalance = await aptos.getAccountAPTAmount({ accountAddress: aiWallet.walletAddress });
      aptBalanceInAptos = Number(aptosBalance) / 10**8; // Convert from octas to APT

      // Get APT price
      let aptPrice = 0;
      try {
        const aptPriceResult = await agent.getTokenPrice("APT");
        aptPrice = Number(aptPriceResult.length > 0 ? aptPriceResult[0].price : 0);
      } catch (error) {
        console.error("Error fetching APT price:", error);
      }

      // Calculate APT value
      const aptValue = aptBalanceInAptos * aptPrice;
      totalValue += aptValue;

      // Add APT to assets
      if (aptBalanceInAptos > 0) {
        const aptLogoUrl = tokenList.find(t => t.symbol === "APT")?.logoUrl || getTokenLogoFallback("APT");

        assets.push({
          name: "Aptos Coin",
          symbol: "APT",
          balance: aptBalanceInAptos,
          value: aptValue,
          priceUsd: aptPrice,
          change24h: null, // Set to null instead of mock data
          apy: null,
          logoUrl: aptLogoUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching APT balance:", error);
    }

    // Fetch account resources to get all tokens
    try {
      const resources = await aptos.getAccountResources({
        accountAddress: aiWallet.walletAddress,
      });

      // Look for coin resources
      for (const resource of resources) {
        // Check if it's a coin store resource
        if (resource.type.startsWith("0x1::coin::CoinStore<")) {
          // Extract the coin type from the resource type
          const coinType = getCoinTypeFromResourceType(resource.type);

          if (!coinType) continue;

          // Skip APT as we already handled it
          if (coinType === "0x1::aptos_coin::AptosCoin") {
            continue;
          }

          // Find token info from the token list
          const tokenInfo = tokenList.find(t => t.tokenAddress === coinType);

          // Get coin balance
          const data = resource.data as CoinStoreResource;
          if (data && data.coin && data.coin.value) {
            // Determine token details (with fallbacks if not in token list)
            const tokenSymbol = tokenInfo?.symbol || getTokenSymbolFromCoinType(coinType);
            const tokenName = tokenInfo?.name || simplifyTokenName(coinType);
            const tokenDecimals = tokenInfo?.decimals || 8; // Default to 8 decimals if unknown
            const balance = Number(data.coin.value) / 10**tokenDecimals;

            // Skip if balance is 0
            if (balance <= 0) {
              continue;
            }

            // Get token price if possible
            let price = 0;
            try {
              const priceResult = await agent.getTokenPrice(tokenSymbol);
              price = Number(priceResult.length > 0 ? priceResult[0].price : 0);
            } catch (error) {
              console.error(`Error fetching price for ${tokenSymbol}:`, error);
            }

            // Calculate value
            const value = balance * price;
            totalValue += value;

            // Get logo URL with fallback
            const logoUrl = tokenInfo?.logoUrl || getTokenLogoFallback(tokenSymbol);

            // Add to assets
            assets.push({
              name: tokenName,
              symbol: tokenSymbol,
              balance: balance,
              value: value,
              priceUsd: price,
              change24h: null, // Set to null instead of random mock data
              apy: null,
              logoUrl: logoUrl,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching account resources:", error);
    }

    // Create portfolio data object
    const portfolioData: PortfolioData = {
      aiWalletAddress: aiWallet.walletAddress,
      totalValue,
      change24h: null,
      change7d: null,
      change30d: null,
      riskScore: user.riskProfile?.riskTolerance ? user.riskProfile.riskTolerance * 10 : 50,
      assets,
      strategies: []
    };

    // Fetch market data from Joule Finance to get real APY values
    let marketData: JouleMarketData[] = [];
    try {
      const marketResponse = await axios.get("https://price-api.joule.finance/api/market");
      if (marketResponse.data?.data && Array.isArray(marketResponse.data.data)) {
        marketData = marketResponse.data.data as JouleMarketData[];
      }
    } catch (error) {
      console.error("Error fetching Joule market data:", error);
      // Continue without market data, we'll use fallbacks
    }

    // Helper function to find APY data for a specific token
    const findApyData = (tokenAddress: string) => {
      const pool = marketData.find(item =>
        item.priceInfo?.tokenAddress === tokenAddress ||
        item.asset?.type === tokenAddress
      );

      return {
        depositApy: pool?.depositApy || 0,
        borrowApy: pool?.borrowApy || 0,
        extraDepositApy: pool?.extraAPY?.depositAPY ? parseFloat(pool.extraAPY.depositAPY) : 0
      };
    };

    // Fetch user positions from Joule Finance
    try {
      // Use agent to fetch user positions from Joule Finance
      // The agent already has the account address properly configured when it was created
      // so we can use the agent's account address directly
      const joulePositions = await agent.getUserAllPositions(agent.account.getAddress());

      if (joulePositions && joulePositions.length > 0 && joulePositions[0].positions_map?.data) {
        // Process each position and add as a strategy
        for (const positionEntry of joulePositions[0].positions_map.data) {
          // We don't need positionId but we keep the line for clarity
          const positionDetails = positionEntry.value;
          const positionName = positionDetails.position_name || 'Joule Position';

          // Process lend positions
          if (positionDetails.lend_positions?.data && positionDetails.lend_positions.data.length > 0) {
            for (const lendPosition of positionDetails.lend_positions.data) {
              const tokenAddress = lendPosition.key;
              const amount = lendPosition.value;

              // Find token info
              const tokenInfo = tokenList.find(t => t.tokenAddress === tokenAddress);
              const tokenSymbol = tokenInfo?.symbol || getTokenSymbolFromCoinType(tokenAddress);
              const tokenDecimals = tokenInfo?.decimals || 8;

              // Calculate values
              const balance = Number(amount) / Math.pow(10, tokenDecimals);

              // Skip if balance is 0
              if (balance <= 0) continue;

              // Get token price if possible
              let price = 0;
              try {
                const priceResult = await agent.getTokenPrice(tokenSymbol);
                price = Number(priceResult.length > 0 ? priceResult[0].price : 0);
              } catch (error) {
                console.error(`Error fetching price for ${tokenSymbol}:`, error);
              }

              // Calculate value
              const value = balance * price;

              // Get APY data for this token
              const apyData = findApyData(tokenAddress);
              const totalApy = apyData.depositApy + apyData.extraDepositApy;

              // Add as a strategy
              portfolioData.strategies.push({
                name: `${positionName} (Lend)`,
                protocol: "Joule Finance",
                balance: balance,
                value: value,
                apy: totalApy > 0 ? totalApy : 0.5, // Use real APY with fallback
                timeLeft: null,
                health: totalApy > 0 ? "Healthy" : "Neutral"
              });
            }
          }

          // Process borrow positions
          if (positionDetails.borrow_positions?.data && positionDetails.borrow_positions.data.length > 0) {
            for (const borrowPosition of positionDetails.borrow_positions.data) {
              const tokenAddress = borrowPosition.key;
              const amount = borrowPosition.value;

              // Find token info
              const tokenInfo = tokenList.find(t => t.tokenAddress === tokenAddress);
              const tokenSymbol = tokenInfo?.symbol || getTokenSymbolFromCoinType(tokenAddress);
              const tokenDecimals = tokenInfo?.decimals || 8;

              // Calculate values
              const balance = Number(amount) / Math.pow(10, tokenDecimals);

              // Skip if balance is 0
              if (balance <= 0) continue;

              // Get token price if possible
              let price = 0;
              try {
                const priceResult = await agent.getTokenPrice(tokenSymbol);
                price = Number(priceResult.length > 0 ? priceResult[0].price : 0);
              } catch (error) {
                console.error(`Error fetching price for ${tokenSymbol}:`, error);
              }

              // Calculate value
              const value = balance * price;

              // Get APY data for this token
              const apyData = findApyData(tokenAddress);

              // Add as a strategy with "Borrow" and with a status of "Warning" since it's a debt
              portfolioData.strategies.push({
                name: `${positionName} (Borrow)`,
                protocol: "Joule Finance",
                balance: balance,
                value: value,
                apy: apyData.borrowApy > 0 ? -apyData.borrowApy : -1.5, // Negative APY to indicate cost of borrowing
                timeLeft: null,
                health: "Warning"
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching Joule positions:", error);
      // If there's an error, we continue without adding strategies
    }

    // Sort assets by value (highest first)
    portfolioData.assets.sort((a, b) => b.value - a.value);

    return NextResponse.json(portfolioData);
  } catch (error) {
    console.error("Error fetching portfolio data:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio data" },
      { status: 500 }
    );
  }
}
