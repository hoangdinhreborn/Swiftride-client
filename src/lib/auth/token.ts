export interface DecodedToken {
  sub: string;
  role: "Rider" | "Driver" | "Admin";
  iss?: string;
  aud?: string;
  exp?: number;
}

export function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return {
      sub: parsed.sub || parsed.nameid || "",
      role: parsed.role || "Rider",
      iss: parsed.iss,
      aud: parsed.aud,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
