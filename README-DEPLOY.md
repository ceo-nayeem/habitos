# HabitOS: website + app + checkout (deploy guide)

## 1. Final GitHub structure
```
/                      (repo root = Vercel project root, Framework Preset: "Other", no build command)
  index.html           landing page            -> https://YOUR-DOMAIN/
  checkout.html        checkout (3 steps)      -> /checkout
  status.html          order status            -> /status
  privacy.html, terms.html
  assets/site.css, assets/site.js
  robots.txt, sitemap.xml
  sw.js                MIGRATION worker. Keep it at the root, do NOT delete (see 3)
  vercel.json
  firestore.rules      paste into Firebase (see 4)
  app/
    index.html         the HabitOS software (updated)  -> /app/
    manifest.webmanifest, sw.js, icons/    <- move YOUR existing files here
```

## 2. Move your existing files into app/
1. Copy your current `manifest.webmanifest`, `sw.js` and `icons/` into `app/`.
2. In `app/manifest.webmanifest` set `"start_url": "/app/"` and `"scope": "/app/"`.
3. In `app/sw.js` change any absolute paths (`'/index.html'`, `'/icons/…'`) to `'/app/index.html'`, `'/app/icons/…'`.

## 3. Why the root sw.js matters
Phones/laptops that installed the old app still have the OLD service worker registered for `/`. It would keep showing the old cached app instead of the new website. The provided root `sw.js` replaces it automatically: it clears the old cache, unregisters itself and reloads. Installed apps that open `/` are sent to `/app/` by the landing page.

## 4. Firebase rules (required)
Firebase Console > Firestore Database > Rules > replace everything with `firestore.rules` > Publish.
(Copy your old rules somewhere first.) No change to Authorized Domains: same domain.

## 5. Deploy
Push to GitHub, Vercel deploys. Test on the Vercel PREVIEW URL first, then promote.

## 6. First-time setup (2 minutes)
1. Open `/app/` > sign in as admin > Backend > **Payments**.
2. Scroll to *Pricing & payment numbers*: confirm prices, enter your **bKash / Nagad numbers**, Save.
   (Without a number the checkout tells customers it isn't available.)

## 7. How it works
1. Visitor picks a plan on `/#pricing`, fills name + Gmail + WhatsApp, then pays by bKash/Nagad and enters the TrxID.
2. An order is saved as **pending** (backend > Payments, with a badge count). Pro is NOT activated yet.
3. You see the money in your bKash/Nagad account > press **Approve**.
   - Has an account: Pro starts today (or extends after the current end date) + a notification in their bell.
   - No account yet: an invite is saved; Pro starts counting when they first sign in with Google using that same email.
4. The customer can follow the status on `/status` with the order reference.
5. Wrong email typed? Payments > **Edit email** before approving. Wrong TrxID? **Reject** with a reason (the TrxID is freed so they can resubmit).

## 8. Test checklist (before telling customers)
- [ ] `/` loads, plans and prices show, Log in opens `/app/`
- [ ] Checkout with a test Gmail + a made-up TrxID creates an order in Payments
- [ ] The same TrxID again is refused
- [ ] Approve it > sign in to `/app/` with that Gmail > Settings > Your plan shows Pro
- [ ] Approve twice does nothing the second time
- [ ] Installed phone app opens `/app/` (not the landing page)
- [ ] Existing users are still signed in at `/app/`

## 9. Rollback
Vercel > Deployments > previous deployment > **Promote to Production**. Data is untouched (only new collections were added).

## 10. Things to review / know
- **Policies**: `privacy.html` and `terms.html` are written from how the product actually works, not legally reviewed. Check the *refund* paragraph (terms.html#refunds) matches your real policy, and the contact email (hello@veynum.com).
- **Plan limits shown on the website come live from your Plan limits** (Backend > Plan limits), so the website and app never disagree. Leaderboard, PWA install and accent colors are NOT restricted for Free in the current app, so the website does not claim they are Pro-only.
- Veynum site (veynum.vercel.app) still lists "HABIT // OS $19 one-time". Update it so prices match.
- The product preview on the landing page is clearly labelled sample data. Add real screenshots later if you want.
- No automatic payment check: you verify manually. Spam protection = TrxID uniqueness, price check in the rules, honeypot. Add Firebase App Check later if you get junk orders.
