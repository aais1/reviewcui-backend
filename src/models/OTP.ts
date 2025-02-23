import mongoose, { Schema, Document } from "mongoose";

// User Info to Store Temporarily with OTP
const TempUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

export interface IOTP extends Document {
  email: string;
  otp: string;
  tempUser: {
    name: string;
    email: string;
    password: string;
  };
  expiresAt: Date;
}

const OTPSchema = new Schema<IOTP>({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  tempUser: { type: TempUserSchema, required: true },
  expiresAt: { type: Date, required: true },
});

export const OTP = mongoose.model<IOTP>("OTP", OTPSchema);
