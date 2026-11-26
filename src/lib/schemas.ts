import { z } from "zod";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Chandigarh", "Andaman & Nicobar", "Dadra & Nagar Haveli and Daman & Diu", "Lakshadweep",
] as const;
export const STATES = indianStates;

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  line1: z.string().trim().min(4, "Enter your street address").max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(indianStates, { message: "Choose your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Please enter your name").max(80),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const emailSchema = z.object({ email: z.string().trim().email("Enter a valid email") });
export type EmailInput = z.infer<typeof emailSchema>;

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  topic: z.enum(["Order help", "Product question", "Corporate orders", "Press & partnerships", "Something else"]),
  message: z.string().trim().min(10, "Tell us a little more (10+ characters)").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;
