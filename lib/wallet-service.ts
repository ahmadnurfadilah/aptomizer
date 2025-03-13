import { prisma } from './prisma';
import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import crypto from 'crypto';
import { AgentRuntime, LocalSigner } from 'move-agent-kit';

// Simple encryption/decryption functions
// In production, use a more secure method and store the key in a secure vault
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-encryption-key-must-be-32-bytes!!';
const IV_LENGTH = 16;

// Ensure the encryption key is exactly 32 bytes (256 bits) for AES-256-CBC
function getEncryptionKey(): Buffer {
  // If the key is shorter than 32 bytes, pad it
  // If longer, truncate it
  const key = Buffer.from(ENCRYPTION_KEY);
  if (key.length === 32) return key;

  const result = Buffer.alloc(32);
  key.copy(result, 0, 0, Math.min(key.length, 32));

  // If the key was shorter than 32 bytes, fill the rest with zeros
  if (key.length < 32) {
    for (let i = key.length; i < 32; i++) {
      result[i] = 0;
    }
  }

  return result;
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function checkUserHasAiWallet(walletAddress: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    include: { aiWallet: true },
  });

  return !!user?.aiWallet;
}

export async function getUserByWalletAddress(walletAddress: string) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
    include: {
      aiWallet: true,
      riskProfile: true,
      transactions: {
        take: 10,
        orderBy: {
          timestamp: 'desc'
        }
      }
    },
  });

  if (!user) return null;

  // Don't return the encrypted private key to the client
  if (user.aiWallet) {
    const { ...aiWalletWithoutPrivateKey } = user.aiWallet;
    return {
      ...user,
      aiWallet: {
        ...aiWalletWithoutPrivateKey,
        // Add default values for new fields until migration is applied
        status: "active",
        balance: 0,
        lastActivity: null,
        transactions: []
      }
    };
  }

  return user;
}

export async function updateUserProfile(walletAddress: string, profileData: { displayName?: string; email?: string; bio?: string }) {
  const user = await prisma.user.findUnique({
    where: { walletAddress },
  });

  if (!user) return null;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: profileData.displayName,
      email: profileData.email,
      bio: profileData.bio,
    },
    include: {
      aiWallet: true,
      riskProfile: true,
    },
  });

  // Don't return the encrypted private key to the client
  if (updatedUser.aiWallet) {
    const { ...aiWalletWithoutPrivateKey } = updatedUser.aiWallet;
    return {
      ...updatedUser,
      aiWallet: {
        ...aiWalletWithoutPrivateKey,
        // Add default values for new fields until migration is applied
        status: "active",
        balance: 0,
        lastActivity: null,
        transactions: []
      },
      transactions: []
    };
  }

  return {
    ...updatedUser,
    transactions: []
  };
}

export async function createUser(walletAddress: string) {
  return prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveRiskProfile(userId: string, riskProfileData: any) {
  // Ensure all required fields are present with default values if not provided
  const data = {
    riskTolerance: riskProfileData.riskTolerance || 5,
    investmentGoals: riskProfileData.investmentGoals || [],
    timeHorizon: riskProfileData.timeHorizon || 'Medium',
    experienceLevel: riskProfileData.experienceLevel || 'Beginner',
    preferredAssets: riskProfileData.preferredAssets || [],
    volatilityTolerance: riskProfileData.volatilityTolerance || 5,
    incomeRequirement: riskProfileData.incomeRequirement || false,
    rebalancingFrequency: riskProfileData.rebalancingFrequency || 'Monthly',
    maxDrawdown: riskProfileData.maxDrawdown || null,
    targetAPY: riskProfileData.targetAPY || null,
  };

  return prisma.riskProfile.upsert({
    where: { userId },
    update: data,
    create: {
      ...data,
      userId,
    },
  });
}

export async function generateAiWallet(userId: string) {
  // Generate a new Aptos account
  const account = Account.generate();

  // Get the private key, public key, and address
  const privateKey = account.privateKey;
  const publicKey = account.publicKey;

  // Convert address to string format
  const walletAddress = account.accountAddress.toString();

  // Convert private key to hex string before encrypting
  const privateKeyHex = privateKey.toString();

  // Convert public key to string
  const publicKeyString = publicKey.toString();

  // Encrypt the private key before storing
  const encryptedPrivateKey = encrypt(privateKeyHex);

  // Save the AI wallet to the database
  return prisma.aiWallet.create({
    data: {
      walletAddress,
      privateKey: encryptedPrivateKey,
      publicKey: publicKeyString,
      userId,
    },
  });
}

export async function getAiWallet(userId: string) {
  const aiWallet = await prisma.aiWallet.findUnique({
    where: { userId },
  });

  if (!aiWallet) return null;

  // Decrypt the private key
  const decryptedPrivateKey = decrypt(aiWallet.privateKey);

  return {
    ...aiWallet,
    privateKey: decryptedPrivateKey,
  };
}

export async function getAptosAgent(userId: string) {
  const aptosConfig = new AptosConfig({
    network: process.env.NETWORK === "mainnet" ? Network.MAINNET : Network.TESTNET,
  })
  const aptos = new Aptos(aptosConfig)

  const aiWallet = await getAiWallet(userId);
  const privateKey = new Ed25519PrivateKey(aiWallet!.privateKey)
  const account = Account.fromPrivateKey({ privateKey })
  const signer = new LocalSigner(account, process.env.NETWORK === "mainnet" ? Network.MAINNET : Network.TESTNET)
  const aptosAgent = new AgentRuntime(signer, aptos, {
    PANORA_API_KEY: process.env.PANORA_API_KEY,
  })

  return aptosAgent;
}
