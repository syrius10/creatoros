import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { createClient } from '@/lib/client'; // Use your existing client

class PushNotificationService {
  private readonly supabase;

  constructor() {
    this.supabase = createClient();
    this.configure();
  }

  configure() {
    PushNotification.configure({
      onRegister: async (token) => {
        console.log('PushNotification onRegister:', token);
        await this.savePushToken(token);
      },
      onNotification: (notification) => {
        console.log('PushNotification onNotification:', notification);
        if (notification.userInteraction) {
          this.handleNotificationTap(notification);
        }
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
  }

  async savePushToken(token: any) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return;

    const deviceId = await this.getDeviceId();
    
    await this.supabase
      .from('push_subscriptions')
      .upsert([{
        user_id: user.id,
        device_id: deviceId,
        platform: Platform.OS,
        token: token.token
      }]);
  }

  async getDeviceId(): Promise<string> {
    // Implement device ID retrieval (you might use a library like react-native-device-info)
    return 'unique-device-id';
  }

  handleNotificationTap(notification: any) {
    console.log('Notification tapped:', notification);
    // Navigate to relevant screen based on notification data
  }

  scheduleLocalNotification(title: string, message: string, date: Date, data: any = {}) {
    PushNotification.localNotificationSchedule({
      title,
      message,
      date,
      userInfo: data, // Use userInfo for custom data payload
    });
  }
}

export const pushNotificationService = new PushNotificationService();