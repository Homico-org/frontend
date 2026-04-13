/**
 * Firebase Cloud Messaging — lazy loaded to avoid adding ~100KB to initial bundle.
 * Only loads Firebase SDK when actually requesting push permissions.
 */

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

/**
 * Lazily initialize Firebase and get messaging instance.
 */
async function getMessagingInstance() {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return null;

  const { initializeApp, getApps } = await import('firebase/app');
  const { getMessaging, isSupported } = await import('firebase/messaging');

  const supported = await isSupported();
  if (!supported) return null;

  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  return getMessaging(app);
}

/**
 * Request notification permission and get FCM token.
 */
export async function requestPushToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = await getMessagingInstance();
    if (!messaging || !VAPID_KEY) return null;

    const { getToken } = await import('firebase/messaging');
    return await getToken(messaging, { vapidKey: VAPID_KEY });
  } catch (err) {
    console.warn('Failed to get push token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages. Returns unsubscribe function.
 */
export async function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const { onMessage } = await import('firebase/messaging');
  return onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data,
    });
  });
}
