import { prisma } from './prisma';
import { Account } from '@aptos-labs/ts-sdk';
import crypto from 'crypto';

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

export async function createUser(walletAddress: string) {
  return prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: { walletAddress },
  });
}

export async function saveRiskProfile(userId: string, riskProfileData: any) {
  return prisma.riskProfile.upsert({
    where: { userId },
    update: riskProfileData,
    create: {
      ...riskProfileData,
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
