const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;

function baseUrl(): string {
  if (!DOMAIN) throw new Error("EXPO_PUBLIC_DOMAIN not set");
  return `https://${DOMAIN}/api`;
}

type TokenGetter = () => Promise<string | null>;

export async function deleteAccountRequest(getToken: TokenGetter): Promise<void> {
  const token = await getToken();
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`${baseUrl()}/account`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    let message = `delete_account_failed_${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }
}
