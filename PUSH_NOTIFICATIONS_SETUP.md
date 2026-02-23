# Push Notifications Setup (Web + Android)

This project now contains app-side support for queue notifications:

- Customers receive notifications when they are close in queue (`2 ahead`, `1 ahead`, `next`, and `your turn`).
- Admin receives notifications about queue activity after logging in once.
- App stores push tokens on online queue entries (`expoPushToken`, `webPushToken`).

## What was added in code

- `src/services/notificationService.ts`:
  - Requests permissions.
  - Registers Expo push token on Android.
  - Registers Firebase web push token (when VAPID key is configured).
  - Shows local notifications.
- `src/components/QueueNotificationWatcher.tsx`:
  - Global queue watcher for customer/admin notification triggers.
- `src/services/deviceService.ts`:
  - Shared customer device ID generation.
- `src/services/adminSessionService.ts`:
  - Shares admin-login notification session state.
- `src/services/queueService.ts` and `src/types/index.ts`:
  - Queue entries now keep optional `expoPushToken` and `webPushToken`.
- `public/firebase-messaging-sw.js`:
  - Web background push service worker for Firebase Messaging.

## Step 1) Install new dependencies

Run:

```bash
npm install
```

(If already installed by lockfile update, this confirms everything is present.)

## Step 2) Add Firebase Web Push VAPID key

Set environment variable:

- `EXPO_PUBLIC_FIREBASE_WEB_VAPID_KEY=<your_public_vapid_key>`

You can place it in `.env`.

How to get it:

1. Firebase Console → Project Settings → Cloud Messaging.
2. In "Web configuration", generate/get the Web Push certificates key pair.
3. Copy the **public** key.

## Step 3) Android setup (for production builds)

1. Generate or use your existing Firebase `google-services.json` for Android app package.
2. In Expo/EAS project config, ensure Android credentials are set.
3. Build with EAS (Expo push token works in development build/production, not fully in Expo Go for all cases):
   - `eas build -p android`

## Step 4) Backend/API needed for real background push

The app now creates/stores tokens, but real push delivery when app is closed requires server-side sending.

Recommended: Firebase Cloud Function triggered on Realtime Database queue updates.

### API design (minimum)

- Trigger: `onWrite('/queue/{customerId}')`
- Read current queue snapshot.
- For each **online** customer with push tokens:
  - Compute `aheadCount`.
  - Send push when count reaches `2`, `1`, `0`, or status becomes `serving`.
- For admins:
  - Keep a token list under `adminTokens/{deviceId}`.
  - Send notification for new joins/status changes.

### Send endpoints

- Android (Expo token):
  - POST `https://exp.host/--/api/v2/push/send`
  - Body includes `to`, `title`, `body`.
- Web (FCM token):
  - Use Firebase Admin SDK `messaging().send({ token, notification })`.

## Step 5) Store admin push tokens (optional but recommended)

If you want admin push even when admin is not in active app view, store admin tokens separately in DB:

- `adminTokens/{tokenId}` with fields:
  - `expoPushToken` or `webPushToken`
  - `updatedAt`

Then backend sends to all admin tokens.

## Step 6) Run and test

1. Start app:
   - `npm run android`
   - `npm run web`
2. Join queue as customer and verify local notifications at `2`, `1`, `0`, `serving`.
3. Log in as admin once and confirm admin queue-event notifications.

## Notes

- Current app-side notifications work immediately while app/session is active.
- Background/closed-app delivery depends on completing Step 4 backend push sender.
- Web push requires HTTPS origin and service worker support.
