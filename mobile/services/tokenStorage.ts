/** Web uses Laravel's session cookie and never persists a Bearer token. */
export async function getAuthToken(): Promise<string | null> {
  return null;
}

export async function setAuthToken(_token: string): Promise<void> {
  throw new Error("Bearer tokens are not stored in the Web application.");
}

export async function removeAuthToken(): Promise<void> {
  // The Web session is cleared by Laravel's /logout endpoint.
}
