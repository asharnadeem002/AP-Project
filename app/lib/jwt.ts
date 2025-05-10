import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret =
  process.env.JWT_SECRET || "your-super-secret-jwt-key-goes-here";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export function signJwt(payload: { userId: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}
