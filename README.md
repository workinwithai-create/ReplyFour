# ReplyFour

Four-bar live call-and-reply desk for bedroom producers and AI-music finishers.

Suno and loop DAWs print the hook as one line and loop it. Session players leave the phrase, then a different chair answers: trumpet a fifth up, violin a third under, upright walking, kit chatter, piano fill. Then the vocal can come back.

Live samples only — FluidR3 acoustic grand, upright bass, nylon guitar, trumpet, violin, and an acoustic kit from the PreEight sample CDN. No oscillators. Audio never leaves the tab.

## Distinct from the rest of the line

| Tool | Job |
| --- | --- |
| ThirdFour | Stack a third and a sixth on the same hook line |
| OrganFour | Put an organ chair under a stuck loop |
| BorrowFour | Borrow a chord so the loop can leave the key |
| StrumFour | Seat a nylon strum under the loop |
| BreathFour | Four bars of exhale between chorus and verse 2 |
| **ReplyFour** | Four bars of call, four bars of a different chair answering |

## License and checkout

Preview playback and the punch list stay free. The reply WAV bounce requires a Forge Pass.

- Live Hub checkout: `POST https://workinwithai.com/api/checkout` with `{ lookupKey: "forge-pass-monthly", returnTo }`.
- Live Hub identity: `GET https://workinwithai.com/api/entitlements/me`. Bounce unlocks only when `signedIn && hasBundle`.
- There is no ReplyFour lookup key and no live Lemon Squeezy product. The $19 one-time price in earlier copy is not connected. Do not treat a missing key as entitled.

## Production readiness (2026-10-02)

| Criterion | Status | Evidence |
| --- | --- | --- |
| Complete source on GitHub | Met | `workinwithai-create/ReplyFour` |
| Permanent live deployment works | Partial | Vercel project `replyfour` production deploy exists. SSO is `all_except_custom_domains`, so `*.vercel.app` is not a public permanent URL. Custom domain not verified. |
| Real checkout and license delivery connected | Met for Forge Pass | Hub checkout + entitlements. Fail-closed without `hasBundle`. No desk-specific SKU. |
| Core exports tested | Met | `tests/export-smoke.mjs` checks WAV header and that bounce is gated |
| Mobile onboarding verified | Partial | First-run dialog, 44px targets, in-app browser warning, safe-area dock. No physical iPhone sign-off. |

**Not shipped.**
