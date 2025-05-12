export function getCookie(name: string): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split("=");
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
}

export function hasAuthCookie(): boolean {
  return getCookie("authToken") !== null;
}

export function navigateWithCookies(url: string): void {
  window.location.href = url;
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
}
