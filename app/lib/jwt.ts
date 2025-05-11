import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  role: 'USER' | 'ADMIN';
  [key: string]: unknown;  // Allow additional properties but with unknown type
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function signJwt(payload: JWTPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  
  return token;
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}