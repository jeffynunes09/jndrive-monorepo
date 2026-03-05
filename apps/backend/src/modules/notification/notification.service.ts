// Expo Push Notification service
export async function sendPushNotification(params: {
  pushTokens: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}): Promise<void> {
  const { pushTokens, title, body, data } = params

  const valid = pushTokens.filter(t => t?.startsWith('ExponentPushToken'))
  if (valid.length === 0) return

  const messages = valid.map(to => ({
    to,
    title,
    body,
    data,
    sound: 'default',
  }))

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(messages),
    })
  } catch (err: any) {
    console.error('[Push] Erro ao enviar notificação Expo:', err.message)
  }
}
