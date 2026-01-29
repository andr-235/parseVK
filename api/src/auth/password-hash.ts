import argon2 from 'argon2';
import * as bcrypt from 'bcryptjs';

export interface VerifyAndMaybeRehashResult {
  ok: boolean;
  newHash?: string;
}

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

function isBcryptHash(hash: string): boolean {
  return (
    hash.startsWith('$2a$') ||
    hash.startsWith('$2b$') ||
    hash.startsWith('$2y$')
  );
}

function isArgon2Hash(hash: string): boolean {
  return hash.startsWith('$argon2');
}

export async function hashSecret(secret: string): Promise<string> {
  return argon2.hash(secret, ARGON2_OPTIONS);
}

export async function verifyAndMaybeRehash(
  secret: string,
  storedHash: string,
): Promise<VerifyAndMaybeRehashResult> {
  if (isArgon2Hash(storedHash)) {
    const ok = await argon2.verify(storedHash, secret);
    return { ok };
  }

  if (isBcryptHash(storedHash)) {
    const ok = await bcrypt.compare(secret, storedHash);
    if (!ok) {
      return { ok: false };
    }
    const newHash = await hashSecret(secret);
    return { ok: true, newHash };
  }

  return { ok: false };
}
