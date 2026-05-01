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

## App Store Connect updates (user action required)

I cannot log into App Store Connect on the user's behalf (requires Apple ID + 2FA). The user must paste the following exact URLs into the next build's metadata in App Store Connect:

- **Privacy Policy URL** (App Information): `https://biteiq.tech/privacy`
- **Support URL** (Version → General App Information): `https://biteiq.tech/support`
- **Marketing URL** (optional, Version → General App Information): `https://biteiq.tech/`

Confirmation that the next build submission picks up these URLs is pending and must be done by the user in App Store Connect.
