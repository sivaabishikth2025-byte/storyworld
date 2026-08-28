export const SESSION_COOKIE = "storyworld_session"

export function sessionCookieOptions(maxAge = 60 * 60 * 24 * 14) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
