/**
 * Utilitários de criptografia para tokens e dados sensíveis
 *
 * Usa AES-256-GCM para criptografia simétrica
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Deriva uma chave de criptografia a partir da chave mestra
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, "sha512");
}

/**
 * Criptografa uma string usando AES-256-GCM
 *
 * @param text - Texto a ser criptografado
 * @param masterKey - Chave mestra (deve ser env TOKEN_ENCRYPT_KEY)
 * @returns String no formato: salt:iv:tag:encrypted (hex)
 */
export function encrypt(text: string, masterKey?: string): string {
  const key = masterKey || process.env.TOKEN_ENCRYPT_KEY;

  if (!key) {
    throw new Error("TOKEN_ENCRYPT_KEY não configurada");
  }

  if (key.length < 32) {
    throw new Error("TOKEN_ENCRYPT_KEY deve ter no mínimo 32 caracteres");
  }

  // Gerar salt e IV aleatórios
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derivar chave a partir do salt
  const derivedKey = deriveKey(key, salt);

  // Criar cipher
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

  // Criptografar
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Obter tag de autenticação
  const tag = cipher.getAuthTag();

  // Retornar no formato: salt:iv:tag:encrypted
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted,
  ].join(":");
}

/**
 * Descriptografa uma string criptografada com encrypt()
 *
 * @param encrypted - String no formato salt:iv:tag:encrypted
 * @param masterKey - Chave mestra (deve ser env TOKEN_ENCRYPT_KEY)
 * @returns Texto descriptografado
 */
export function decrypt(encrypted: string, masterKey?: string): string {
  const key = masterKey || process.env.TOKEN_ENCRYPT_KEY;

  if (!key) {
    throw new Error("TOKEN_ENCRYPT_KEY não configurada");
  }

  // Parse do formato
  const parts = encrypted.split(":");

  if (parts.length !== 4) {
    throw new Error("Formato de criptografia inválido");
  }

  const [saltHex, ivHex, tagHex, encryptedHex] = parts;

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  // Derivar chave
  const derivedKey = deriveKey(key, salt);

  // Criar decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(tag);

  // Descriptografar
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Hash de senha com bcrypt (para admin passwords)
 * Nota: bcrypt deve ser instalado: npm install bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt");
  return bcrypt.hash(password, 10);
}

/**
 * Verifica uma senha contra um hash bcrypt
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import("bcrypt");
  return bcrypt.compare(password, hash);
}

/**
 * Gera um token Haxball aleatório
 */
export function generateHaxballToken(): string {
  // Formato: thr1.AAAAXXXXXXXXXXXXXXXXXX.YYYYYYYYYYYYYYYY
  const part1 = "thr1";
  const part2 = crypto
    .randomBytes(12)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .substring(0, 22);
  const part3 = crypto
    .randomBytes(10)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .substring(0, 16);

  return `${part1}.${part2}.${part3}`;
}
