import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { conflict, unauthorized } from '../lib/errors';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 12;

function signToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign({ sub: userId, email }, secret, { expiresIn: '24h' });
}

export const authService = {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw conflict('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        passwordHash,
      },
    });

    const token = signToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  },

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw unauthorized('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw unauthorized('Invalid email or password');
    }

    const token = signToken(user.id, user.email);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  },
};
