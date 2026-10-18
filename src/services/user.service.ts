import { queryObjects } from "node:v8";
import User from "../models/User.model.js";
import { IUpdateUser } from "../types/user.types.js";
import AppError from "../utils/AppError.js";
import bcrypt from "bcrypt";
import { Space } from "../models/Space.model.js";
import { SpaceMember } from "../models/SpaceMember.model.js";
import Task from "../models/Task.model.js";
import Subtask from "../models/SubTask.model.js";
export async function getCurrentUser(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  return exists;
}
export async function getUserById(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  return exists;
}
export async function deleteUserById(userId: string) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("No such user exists", 404);
  }
  if (exists && exists.isDeleted) {
    throw new AppError("User is already deleted", 409);
  }
  const spaces = await Space.find({ ownerId: userId });
  for( const space of spaces) {
    if (space.spaceType === "Shared" ) {
      const members = await SpaceMember.find({
        spaceId: space._id,
        status: "ACTIVE",
      });
      if (members.length === 0) {
        await Space.deleteOne({ _id: space._id });
      } else {
        const randomIndex = Math.floor(Math.random() * members.length);
        const newOwner = members[randomIndex];
        space.ownerId = newOwner.userId;
        await space.save();
        await SpaceMember.deleteOne({
          spaceId: space._id,
          userId: newOwner.userId,
        });
      }
    } else{
      await Space.deleteOne({ _id: space._id });
    }
  };
  await User.updateOne({ _id: userId }, { isDeleted: true });
  return;
}
export async function updateUser(userId: string, updateData: IUpdateUser) {
  const exists = await User.findById(userId);
  if (!exists) {
    throw new AppError("User not found", 404);
  }
  const details: IUpdateUser = {};
  if (updateData.password) {
    const hashedPassword = await bcrypt.hash(updateData.password, 10);
    details["password"] = hashedPassword;
  }
  if (updateData.name) {
    details["name"] = updateData.name;
  }
  if (updateData.email) {
    const old = await User.findOne({
      email: updateData.email,
      _id: {
        $ne: userId,
      },
    });
    if (old) {
      throw new AppError("Email already exists", 409);
    }
    details["email"] = updateData.email;
  }
  if (Object.keys(details).length == 0) {
    throw new AppError("Their is no Change", 400);
  }
  return await User.findOneAndUpdate({ _id: userId }, details, {
    runValidators: true,
    new: true,
  });
}
