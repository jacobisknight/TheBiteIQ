# Verification: biteiq.tech live URLs (Task #4)

Run on: 2026-05-01T15:32:49Z

## HTTP status checks

```
PASS  https://biteiq.tech/  -> 200
PASS  https://biteiq.tech/privacy  -> 200
PASS  https://biteiq.tech/terms  -> 200
PASS  https://biteiq.tech/support  -> 200
PASS  https://biteiq.tech/delete-account  -> 200
FAIL  https://www.biteiq.tech/  -> 000  ()
```

## TLS certificate (biteiq.tech)

```
subject=CN = biteiq.tech
issuer=C = US, O = Let's Encrypt, CN = E7
notBefore=May  1 14:26:36 2026 GMT
notAfter=Jul 30 14:26:35 2026 GMT
X509v3 Subject Alternative Name: 
    DNS:biteiq.tech
```

## TLS certificate (www.biteiq.tech)

```
40D74A61F47F0000:error:10080002:BIO routines:BIO_lookup_ex:system lib:../crypto/bio/bio_addr.c:738:Name or service not known
connect:errno=0
```

## Page-content render check (server response includes correct HTML title)

```
/ -> <title>BiteIQ — Smart, simple nutrition tracking</title>
/privacy -> <title>BiteIQ — Smart, simple nutrition tracking</title>
/terms -> <title>BiteIQ — Smart, simple nutrition tracking</title>
/support -> <title>BiteIQ — Smart, simple nutrition tracking</title>
/delete-account -> <title>BiteIQ — Smart, simple nutrition tracking</title>
```

Note: all routes serve the same SPA shell HTML (single `<title>`) because
BiteIQ Web is a Vite React SPA — page-specific content is rendered client-side
by React Router. Visual rendering of /privacy and /delete-account was
additionally confirmed via screenshots saved to:

- `attached_assets/screenshots/biteiq_tech_privacy.png`
- `attached_assets/screenshots/biteiq_tech_delete-account.png`

## Results summary vs Task #4 acceptance criteria

| URL | Required | Observed | Status |
|---|---|---|---|
| https://biteiq.tech/ | 200 OK over HTTPS | 200, valid TLS | PASS |
| https://biteiq.tech/privacy | 200 OK over HTTPS | 200, valid TLS | PASS |
| https://biteiq.tech/terms | 200 OK over HTTPS | 200, valid TLS | PASS |
| https://biteiq.tech/support | 200 OK over HTTPS | 200, valid TLS | PASS |
| https://biteiq.tech/delete-account | 200 OK over HTTPS | 200, valid TLS | PASS |
| https://www.biteiq.tech/ | redirect or resolve | DNS lookup fails (NXDOMAIN); cert SAN list contains only `biteiq.tech` | FAIL — filed as follow-up #5 |

## www.biteiq.tech runbook (Task #5 — user action required)

Adding a second custom domain to a Replit deployment is a Publishing-UI
action plus a DNS change at the domain registrar. Neither can be done from
code (there is no `customDomains` field in `artifact.toml`, and DNS lives
at the user's registrar), so the steps below must be performed by the
user. After they are done, re-run the verification snippet at the bottom
of this section.

### 1. Add the domain in Replit

1. Open the published deployment for the `BiteIQ Web` artifact in
   Replit (Publishing tool → the `biteiq-web` deployment).
2. Go to **Settings → Custom Domains**.
3. Click **Link a domain** and enter `www.biteiq.tech`.
4. Replit will show a DNS target value (either a CNAME hostname like
   `xxxxx.replit.app` or an A/AAAA record). Copy that value — it is the
   target for the DNS record in step 2.

### 2. Add the DNS record at the registrar for biteiq.tech

At the DNS provider that hosts `biteiq.tech`, add **one** new record:

- **Type:** `CNAME`
- **Name / Host:** `www`
- **Value / Target:** the hostname Replit displayed in step 1 (typically
  the same `*.replit.app` host that the apex `biteiq.tech` A record
  already points to, or the exact value Replit shows in the
  Custom Domains UI).
- **TTL:** default (e.g. 300s or "Auto") is fine.

Do not delete or change the existing apex `biteiq.tech` record — leave
it as-is. This new record only adds the `www` subdomain.

### 3. Wait for propagation + cert issuance

- DNS propagation: typically a few minutes, occasionally up to ~1 hour.
- TLS cert issuance: Replit auto-issues a Let's Encrypt cert covering
  `www.biteiq.tech` once DNS resolves. This is usually within a few
  minutes of DNS being live.
- The Custom Domains UI in Replit will show a green/verified state once
  both DNS and the cert are ready.

### 4. Re-verify

Run this from any shell once the Custom Domains UI shows verified:

```bash
# Should both print 200
curl -sS -o /dev/null -w "apex / : %{http_code}\n" https://biteiq.tech/
curl -sS -o /dev/null -w "www  / : %{http_code}\n" https://www.biteiq.tech/

# /privacy on www must also be 200 (Task #5 acceptance criterion)
curl -sS -o /dev/null -w "www /privacy : %{http_code}\n" \
  https://www.biteiq.tech/privacy

# Cert SAN list should now contain BOTH names
echo | openssl s_client -servername www.biteiq.tech \
  -connect www.biteiq.tech:443 2>/dev/null \
  | openssl x509 -noout -ext subjectAltName
```

Acceptance (from Task #5):

- `https://www.biteiq.tech/` either serves the same site as the apex
  **or** returns a 301/308 redirect to `https://biteiq.tech/`.
- TLS cert covers both `biteiq.tech` and `www.biteiq.tech` (or each has
  its own valid cert).
- `curl https://www.biteiq.tech/privacy` returns `200 OK`.

## Re-verification (Task #5 follow-up)

Run on: 2026-05-01T16:18:15Z

### Captured output

```
=== HTTP status checks ===
apex / : 200
curl: (6) Could not resolve host: www.biteiq.tech
www  / : 000
curl: (6) Could not resolve host: www.biteiq.tech
www /privacy : 000

=== Cert SAN (www.biteiq.tech) ===
Could not read certificate from <stdin>
Unable to load certificate

=== Cert SAN (biteiq.tech) ===
X509v3 Subject Alternative Name:
    DNS:biteiq.tech
```

### DNS lookup against public resolvers

`dig`/`nslookup` are not available in this environment, so DNS was queried
via DNS-over-HTTPS (Google `dns.google` and Cloudflare `1.1.1.1`):

```
=== Google DoH: www.biteiq.tech (A)     -> Status 3 (NXDOMAIN)
=== Google DoH: www.biteiq.tech (CNAME) -> Status 3 (NXDOMAIN)
=== Google DoH: biteiq.tech    (A)      -> 34.111.179.208 (OK)
=== Cloudflare DoH: www.biteiq.tech (A) -> Status 3 (NXDOMAIN)
```

Authoritative SOA returned in the NXDOMAIN responses points to
`ns1.dreamhost.com.` — i.e. DreamHost is the DNS provider for
`biteiq.tech`, and no `www` record exists there yet.

### Results vs Task #5 acceptance

| URL / check | Required | Observed | Status |
|---|---|---|---|
| https://www.biteiq.tech/ | 200 OK or 301/308 redirect to apex | DNS NXDOMAIN, connection cannot be established | FAIL |
| https://www.biteiq.tech/privacy | 200 OK | DNS NXDOMAIN, connection cannot be established | FAIL |
| TLS cert SAN for `www.biteiq.tech` | covers both `biteiq.tech` and `www.biteiq.tech` (or each has its own valid cert) | Apex cert SAN still lists only `DNS:biteiq.tech`; no cert reachable for `www` because DNS does not resolve | FAIL |
| https://biteiq.tech/ (control) | 200 OK | 200 OK, valid TLS | PASS |

### Diagnosis — what's still missing

The `www` subdomain has not been added at the DNS provider yet, so neither
Replit's edge nor Let's Encrypt can serve `www.biteiq.tech`. Specifically:

1. **DNS record not added at the registrar.** Public resolvers
   (Google + Cloudflare) both return NXDOMAIN for `www.biteiq.tech`,
   while the apex `biteiq.tech` correctly resolves to `34.111.179.208`.
   The authoritative nameserver is `ns1.dreamhost.com`, so the missing
   `www` CNAME (or A) record needs to be added in DreamHost's DNS
   panel for the `biteiq.tech` zone, per step 2 of the runbook above.
2. **Replit Custom Domains link likely not added either.** Without DNS
   resolving, Replit cannot validate domain ownership, and no Let's
   Encrypt cert covering `www.biteiq.tech` will be issued. Step 1 of
   the runbook (Publishing tool → Settings → Custom Domains → Link a
   domain → `www.biteiq.tech`) must also be completed so Replit knows
   to route this hostname to the `biteiq-web` deployment and request
   a cert for it.

### What the user needs to do next

Re-run steps 1 and 2 of the "www.biteiq.tech runbook" section above:

- In Replit Publishing → BiteIQ Web deployment → Settings → Custom
  Domains, add `www.biteiq.tech` and copy the DNS target Replit shows.
- In DreamHost's DNS panel for `biteiq.tech`, add a `CNAME` record with
  Name `www` pointing at that target (TTL default / Auto is fine).
- Wait a few minutes for DNS propagation and Replit's automatic cert
  issuance, then ask the agent to re-run the verification snippet
  again. Once `www.biteiq.tech` resolves, the cert SAN should include
  both names automatically.

## App Store Connect updates (user action required)

I cannot log into App Store Connect on the user's behalf (requires Apple ID + 2FA). The user must paste the following exact URLs into the next build's metadata in App Store Connect:

- **Privacy Policy URL** (App Information): `https://biteiq.tech/privacy`
- **Support URL** (Version → General App Information): `https://biteiq.tech/support`
- **Marketing URL** (optional, Version → General App Information): `https://biteiq.tech/`

Confirmation that the next build submission picks up these URLs is pending and must be done by the user in App Store Connect.
