"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "active-mortgage-id";
const MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

export async function getActiveMortgageId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function setActiveMortgageId(id: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
