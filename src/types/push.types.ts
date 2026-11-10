export interface IPushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface IPushSubscription {
  _id: string;
  userId: string;
  endpoint: string;
  keys: IPushSubscriptionKeys;
  userAgent?: string;
  lastSuccessAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscribePushBody {
  subscription: {
    endpoint: string;
    expirationTime?: number | null;
    keys: IPushSubscriptionKeys;
  };
  userAgent?: string;
}

export interface IUnsubscribePushBody {
  endpoint: string;
}

export interface IPushPayload {
  notificationId?: string;
  type: string;
  title: string;
  body: string;
  url: string;
  tag: string;
  unreadCount: number;
  icon?: string;
}
