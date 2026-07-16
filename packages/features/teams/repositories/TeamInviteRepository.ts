import { randomBytes } from "node:crypto";
import { prisma } from "@calcom/prisma";
import type { PrismaClient } from "@calcom/prisma/client";

// Clean-room reimplementation of the team-invite token store. The upstream invite
// utilities lived under the commercial /ee tree; this is written from scratch
// against the (intact) VerificationToken model.

const INVITE_EXPIRY_DAYS = 7;

export class TeamInviteRepository {
  constructor(private readonly prismaClient: PrismaClient = prisma) {}

  async createToken({
    email,
    teamId,
    expiryDays = INVITE_EXPIRY_DAYS,
  }: {
    email: string;
    teamId: number;
    expiryDays?: number;
  }) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + expiryDays);

    return this.prismaClient.verificationToken.create({
      data: {
        identifier: email.toLowerCase(),
        token,
        expires,
        expiresInDays: expiryDays,
        teamId,
      },
      select: { token: true, identifier: true, teamId: true, expires: true },
    });
  }

  async findByToken({ token }: { token: string }) {
    return this.prismaClient.verificationToken.findUnique({
      where: { token },
      select: { id: true, identifier: true, teamId: true, expires: true },
    });
  }

  async deleteByToken({ token }: { token: string }) {
    return this.prismaClient.verificationToken.deleteMany({ where: { token } });
  }
}
