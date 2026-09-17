# CTG Secure RFQ Link Worker

Secure gateway for supplier RFQ invitations.

## Public route
`GET /r/{token}` validates the invitation against Airtable, requires an Active/unexpired link, Release Eligible = true, a linked supplier, and parent RFQ Status = Open, then redirects to CTG's Tally Supplier RFQ Response form.

The Tally redirect receives only opaque `secure_token` and `link_version` hidden/query values; it does not expose the Airtable record ID. BPF-04 must revalidate these values against Airtable when processing a submission, then mark the link Used.

## Admin routes (for Make)
All require `Authorization: Bearer <WORKER_ADMIN_SECRET>`.
- `POST /api/links/create` body `{ "rfqSupplierRecordId": "rec...", "ttlHours": 72 }`
- `POST /api/links/rotate` same body; replaces the old token, increments version and resend count.
- `POST /api/links/revoke` body `{ "rfqSupplierRecordId": "rec..." }`

Expiration is capped at the RFQ response deadline. TTL is limited to 168 hours.

## Secrets
Set `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`, and `WORKER_ADMIN_SECRET` as Cloudflare Worker secrets. Use a least-privilege Airtable PAT scoped to the CTG base and only the records this Worker needs.

## OTP
OTP is intentionally not exposed in v1. Add it later only after the WhatsApp authentication-template flow and storage/rate-limit design are implemented.
