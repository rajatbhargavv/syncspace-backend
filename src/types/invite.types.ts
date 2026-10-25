export interface ISpaceInvite {
  _id: string;
  token: string;
  spaceId: string;
  inviterId: string;
  expiresAt?: Date;
  maxUses?: number;
  uses: number;
  status: "ACTIVE" | "REVOKED";
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateInvite {
  spaceId: string;
  inviterId: string;
  expiresInHours?: number;
  expiresAt?: Date;
  maxUses?: number;
}

