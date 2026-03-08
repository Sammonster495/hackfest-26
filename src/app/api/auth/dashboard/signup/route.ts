import { NextResponse } from "next/server";
import { z } from "zod";
import * as dashboardUserData from "~/db/data/dashboard-users";
import { hashPassword } from "~/lib/auth/password";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 },
      );
    }

    const { username, email, password, name } = result.data;

    const existingUser =
      await dashboardUserData.findByUsernameOrEmail(username);
    const existingEmail = await dashboardUserData.findByUsernameOrEmail(email);

    if (existingUser || existingEmail) {
      return NextResponse.json(
        { message: "Username or email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    await dashboardUserData.createDashboardUser({
      username,
      email,
      passwordHash,
      name,
      isActive: false,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
