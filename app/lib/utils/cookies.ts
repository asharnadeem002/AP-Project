/**
 * Utility functions for handling cookies in the browser
 */

/**
 * Get a cookie by name
 * @param name The name of the cookie
 * @returns The value of the cookie or null if not found
 */
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

/**
 * Check if the auth cookie exists
 */
export function hasAuthCookie(): boolean {
  return getCookie("authToken") !== null;
}

/**
 * Navigate to a URL with a hard refresh to ensure cookies are properly sent
 * @param url The URL to navigate to
 */
export function navigateWithCookies(url: string): void {
  window.location.href = url;
}

/**
 * Set a cookie in the browser
 * @param name The name of the cookie
 * @param value The value of the cookie
 * @param days Number of days until the cookie expires
 */
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
