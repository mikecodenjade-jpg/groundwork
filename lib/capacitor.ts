/**
 * Capacitor native bridge utilities
 *
 * Detects if the app is running inside the Capacitor native shell
 * and provides safe wrappers around native APIs.
 */

export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return 'web';
  return cap.getPlatform?.() || 'web';
}

/** Request push notification permission (iOS native only) */
export async function requestPushPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Listen for push notification token (to send to Supabase) */
export async function onPushToken(callback: (token: string) => void): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    PushNotifications.addListener('registration', (token) => {
      callback(token.value);
    });
  } catch {
    // Not in native context
  }
}

/** Trigger haptic feedback */
export async function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {
    // Not available
  }
}

/** Hide splash screen (called after app is ready) */
export async function hideSplash(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch {
    // Not available
  }
}

/** Set status bar style for dark theme */
export async function setupStatusBar(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
  } catch {
    // Not available
  }
}
