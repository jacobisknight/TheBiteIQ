const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function baseUrl(): string {
  if (!DOMAIN) throw new Error("EXPO_PUBLIC_DOMAIN not set");
  return `https://${DOMAIN}/api`;
}

type TokenGetter = (
  opts?: { skipCache?: boolean },
) => Promise<string | null>;

export async function deleteAccountRequest(
  getToken: TokenGetter,
): Promise<void> {
  // Force a fresh token (skip the in-memory cache) so we never send a stale
  // token from a previously-expired session. If this returns null, the
  // session genuinely is gone and the user must re-auth.
  let token: string | null = null;
  try {
    token = await getToken({ skipCache: true });
  } catch {
    token = null;
  }
  if (!token) {
    throw new Error(
      "Your session expired. Please sign out and sign back in, then try again.",
    );
  }

  const res = await fetch(`${baseUrl()}/account`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    let message = `delete_account_failed_${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error === "unauthorized") {
        message =
          "Your session expired. Please sign out and sign back in, then try again.";
      } else if (body?.error) {
        message = body.error;
      }
    } catch {
      /* noop */
    }
    throw new Error(message);
  }
}
