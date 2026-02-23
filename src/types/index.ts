export type ServiceType = 'Hair' | 'Hair & Beard' | 'Organize/Trim';

export interface Customer {
  id: string;
  name: string;
  deviceId?: string;
  expoPushToken?: string;
  webPushToken?: string;
  service?: ServiceType;
  type: 'online' | 'walk-in';
  status: 'waiting' | 'serving' | 'done' | 'absent';
  joinedAt: number;
  completedAt?: number;
  amountPaid?: number;
}

export interface RevenueLog {
  id: string;
  amount: number;
  service?: ServiceType;
  timestamp: number;
}
