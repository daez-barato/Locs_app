import { useAuthContext } from '@/hooks/use-auth-context'
import { supabase } from '@/lib/supabase'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { Platform } from 'react-native'

// Foreground notifications still need to surface, or a new-event/free-coins
// push would silently do nothing while the app is open. Set once at module
// scope, same as the rest of the native notification setup.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// Remembered outside React state so unregisterPushToken (called from
// settings, right before sign-out) can reach the token without the provider
// re-rendering or being mounted at all.
let lastRegisteredToken: string | undefined

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return
  // Must exist before requesting/reading the push token on Android, or the
  // token comes back without a channel to post to.
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
  })
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
}

async function fetchAndRegisterExpoToken() {
  const projectId = getProjectId()
  if (!projectId) {
    console.error('Missing EAS projectId, cannot fetch an Expo push token')
    return
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
    await registerToken(token)
  } catch (error) {
    console.error('Error getting Expo push token:', error)
  }
}

async function registerForPushNotifications() {
  if (!Device.isDevice) return

  await ensureAndroidChannel()

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let status = existingStatus
  if (status === 'undetermined') {
    const response = await Notifications.requestPermissionsAsync()
    status = response.status
  }
  if (status !== 'granted') return

  await fetchAndRegisterExpoToken()
}

async function registerToken(token: string) {
  const { error } = await supabase.rpc('register_push_token', {
    _token: token,
    _platform: Platform.OS,
  })
  if (error) {
    console.error('Error registering push token:', error)
    return
  }
  lastRegisteredToken = token
}

/** Called by settings right before sign-out, so a stale token doesn't keep receiving pushes meant for someone else. */
export async function unregisterPushToken(): Promise<void> {
  const token = lastRegisteredToken
  if (!token) return

  try {
    const { error } = await supabase.rpc('unregister_push_token', { _token: token })
    if (error) {
      console.error('Error unregistering push token:', error)
      return
    }
    lastRegisteredToken = undefined
  } catch (error) {
    console.error('Error unregistering push token:', error)
  }
}

/**
 * Registers the signed-in user's device for push notifications and routes
 * taps on them. Mounted inside AuthProvider so it can react to sign-in/out.
 */
export function NotificationsProvider({ children }: PropsWithChildren) {
  const { user, isInitializing, needsOnboarding } = useAuthContext()
  const userId = user?.id
  // The event and tab routes only mount once auth has settled and onboarding
  // is done; a cold-start tap handled earlier would push into nothing.
  const canNavigate = !!userId && !isInitializing && !needsOnboarding

  // Guards against handling the same tap twice: once from the cold-start
  // check and once from the listener firing right after mount.
  const handledResponseId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return

    registerForPushNotifications().catch((error) => {
      console.error('Error registering for push notifications:', error)
    })

    // The listener fires with the rotated native (APNs/FCM) device token, not
    // an Expo push token — re-derive the Expo token from it and re-register
    // right away, or pushes to the old one start failing.
    const tokenSub = Notifications.addPushTokenListener(() => {
      fetchAndRegisterExpoToken().catch((error) => {
        console.error('Error registering rotated push token:', error)
      })
    })

    return () => tokenSub.remove()
  }, [userId])

  useEffect(() => {
    // Push is native-only; the web build has no notification responses.
    if (!canNavigate || Platform.OS === 'web') return

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier
      if (handledResponseId.current === id) return
      handledResponseId.current = id

      const url = response.notification.request.content.data?.url
      if (typeof url === 'string' && url.startsWith('/')) {
        router.push(url as any)
      }
    }

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) handleResponse(response)
      })
      .catch((error) => {
        console.error('Error reading last notification response:', error)
      })

    const responseSub = Notifications.addNotificationResponseReceivedListener(handleResponse)
    return () => responseSub.remove()
  }, [canNavigate])

  return <>{children}</>
}
