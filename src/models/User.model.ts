import { Schema, model } from "mongoose";
import { randomUUID } from "crypto";

import { IUser } from "../types/user.types.js";

const userSchema = new Schema<IUser>(
  {
    _id: {
      type: String,
      default: () => "user_" + randomUUID(),
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>("User", userSchema);

export default User;