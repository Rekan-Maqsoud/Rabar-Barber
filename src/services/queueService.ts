import { ref, push, set, update, remove, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '../config/firebase';
import { Customer, ServiceType, RevenueLog } from '../types';

const QUEUE_REF = 'queue';
const REVENUE_REF = 'revenue';

const BLOCKED_NAME_PARTS = [
  'admin',
  'test',
  'unknown',
  'anonymous',
  'null',
  'undefined',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'sex',
  'xxx',
  'aaa',
  'zzz',
];

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s/g, '');

const validateAndSanitizeName = (name: string) => {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  const nameKey = normalizeName(trimmed);

  if (!trimmed) throw new Error('name_required');
  if (trimmed.length < 2) throw new Error('name_too_short');
  if (trimmed.length > 24) throw new Error('name_too_long');
  if (!nameKey || /^\d+$/.test(nameKey)) throw new Error('name_invalid');

  if (BLOCKED_NAME_PARTS.some((bad) => nameKey.includes(bad))) {
    throw new Error('name_blocked');
  }

  return { cleanedName: trimmed, nameKey };
};

// Join the queue
export const joinQueue = async (
  name: string,
  service?: ServiceType,
  type: 'online' | 'walk-in' = 'online',
  deviceId?: string,
  pushTokens?: { expoPushToken?: string; webPushToken?: string },
) => {
  const { cleanedName, nameKey } = validateAndSanitizeName(name);
  const queueRef = ref(db, QUEUE_REF);

  const snapshot = await get(queueRef);
  const existing = snapshot.val();
  if (existing) {
    const alreadyActive = Object.values(existing as Record<string, any>).some((customer) => {
      const active = customer.status === 'waiting' || customer.status === 'serving';
      if (!active) return false;
      const existingKey = customer.nameKey || normalizeName(customer.name || '');
      return existingKey === nameKey;
    });

    if (alreadyActive) {
      throw new Error('name_already_in_queue');
    }

    if (type === 'online' && deviceId) {
      const deviceAlreadyActive = Object.values(existing as Record<string, any>).some((customer) => {
        const active = customer.status === 'waiting' || customer.status === 'serving';
        return active && customer.type === 'online' && customer.deviceId === deviceId;
      });

      if (deviceAlreadyActive) {
        throw new Error('device_already_in_queue');
      }
    }
  }

  const newCustomerRef = push(queueRef);
  const customerBase = {
    name: cleanedName,
    nameKey,
    deviceId: type === 'online' ? deviceId : undefined,
    expoPushToken: type === 'online' ? pushTokens?.expoPushToken : undefined,
    webPushToken: type === 'online' ? pushTokens?.webPushToken : undefined,
    type,
    status: 'waiting',
    joinedAt: Date.now(),
  };
  const customer = service ? { ...customerBase, service } : customerBase;
  await set(newCustomerRef, customer);
  return newCustomerRef.key;
};

// Listen to live queue
export const subscribeToQueue = (callback: (queue: Customer[]) => void) => {
  const queueRef = ref(db, QUEUE_REF);
  const q = query(queueRef, orderByChild('joinedAt'));
  
  return onValue(q, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const queueList: Customer[] = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })).filter(c => c.status === 'waiting' || c.status === 'serving')
        .sort((a, b) => a.joinedAt - b.joinedAt);
      callback(queueList);
    } else {
      callback([]);
    }
  });
};

// Mark as serving
export const markAsServing = async (customerId: string) => {
  const customerRef = ref(db, `${QUEUE_REF}/${customerId}`);
  await update(customerRef, { status: 'serving' });
};

// Mark as done and log revenue
export const markAsDone = async (customer: Customer, amountPaid: number) => {
  const customerRef = ref(db, `${QUEUE_REF}/${customer.id}`);
  const now = Date.now();
  
  // Update customer status
  await update(customerRef, { 
    status: 'done', 
    completedAt: now,
    amountPaid 
  });

  // Log revenue
  const revenueRef = ref(db, REVENUE_REF);
  const newRevenueRef = push(revenueRef);
  const revenueLogBase = {
    amount: amountPaid,
    timestamp: now,
  };
  const revenueLog = customer.service ? { ...revenueLogBase, service: customer.service } : revenueLogBase;
  await set(newRevenueRef, revenueLog);
};

// Remove or mark absent
export const removeCustomer = async (customerId: string) => {
  const customerRef = ref(db, `${QUEUE_REF}/${customerId}`);
  await update(customerRef, { status: 'absent' });
};

// Move down / Delay (by updating joinedAt to be slightly later)
export const moveDown = async (customerId: string, currentQueue: Customer[]) => {
  const currentIndex = currentQueue.findIndex(c => c.id === customerId);
  if (currentIndex === -1 || currentIndex === currentQueue.length - 1) return; // Already last or not found
  
  const nextCustomer = currentQueue[currentIndex + 1];
  const customerRef = ref(db, `${QUEUE_REF}/${customerId}`);
  
  // Set joinedAt to just after the next customer to swap places
  await update(customerRef, { joinedAt: nextCustomer.joinedAt + 1 });
};

// Get revenue stats
export const getRevenueStats = async () => {
  const revenueRef = ref(db, REVENUE_REF);
  const snapshot = await get(revenueRef);
  const data = snapshot.val();
  
  if (!data) {
    return {
      today: 0,
      weekly: 0,
      monthly: 0,
      totalRevenue: 0,
      totalCustomersToday: 0,
      totalCustomersAllTime: 0,
      averageTicket: 0,
      dailyAverageThisMonth: 0,
      popularService: 'None',
      monthlyHistory: [],
      serviceBreakdown: [],
      recentDays: [],
      dailyRevenueByMonth: [],
    };
  }

  const logs: RevenueLog[] = Object.keys(data).map(key => ({
    id: key,
    ...data[key]
  }));

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeekDate = new Date(now);
  startOfWeekDate.setDate(now.getDate() - now.getDay());
  startOfWeekDate.setHours(0, 0, 0, 0);
  const startOfWeek = startOfWeekDate.getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let today = 0;
  let weekly = 0;
  let monthly = 0;
  let totalRevenue = 0;
  let totalCustomersToday = 0;
  const serviceCounts: Record<string, number> = {};
  const serviceRevenue: Record<string, number> = {};
  const monthMap: Record<string, { monthStart: number; revenue: number; customers: number }> = {};
  const dayMap: Record<string, { dayStart: number; revenue: number; customers: number }> = {};
  const monthDayMap: Record<string, Record<string, { dayStart: number; revenue: number; customers: number }>> = {};

  logs.forEach(log => {
    totalRevenue += log.amount;

    if (log.timestamp >= startOfToday) {
      today += log.amount;
      totalCustomersToday++;
    }
    if (log.timestamp >= startOfWeek) {
      weekly += log.amount;
    }
    if (log.timestamp >= startOfMonth) {
      monthly += log.amount;
    }

    const logDate = new Date(log.timestamp);
    const monthStart = new Date(logDate.getFullYear(), logDate.getMonth(), 1).getTime();
    const monthKey = String(monthStart);
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { monthStart, revenue: 0, customers: 0 };
    }
    monthMap[monthKey].revenue += log.amount;
    monthMap[monthKey].customers += 1;

    const dayStart = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate()).getTime();
    const dayKey = String(dayStart);
    if (!dayMap[dayKey]) {
      dayMap[dayKey] = { dayStart, revenue: 0, customers: 0 };
    }
    dayMap[dayKey].revenue += log.amount;
    dayMap[dayKey].customers += 1;

    if (!monthDayMap[monthKey]) {
      monthDayMap[monthKey] = {};
    }
    if (!monthDayMap[monthKey][dayKey]) {
      monthDayMap[monthKey][dayKey] = { dayStart, revenue: 0, customers: 0 };
    }
    monthDayMap[monthKey][dayKey].revenue += log.amount;
    monthDayMap[monthKey][dayKey].customers += 1;
    
    if (log.service) {
      serviceCounts[log.service] = (serviceCounts[log.service] || 0) + 1;
      serviceRevenue[log.service] = (serviceRevenue[log.service] || 0) + log.amount;
    }
  });

  let popularService = 'None';
  let maxCount = 0;
  for (const [service, count] of Object.entries(serviceCounts)) {
    if (count > maxCount) {
      maxCount = count;
      popularService = service;
    }
  }

  const monthlyHistory = Object.values(monthMap)
    .sort((a, b) => a.monthStart - b.monthStart)
    .map((item) => ({
      ...item,
      averageTicket: item.customers > 0 ? item.revenue / item.customers : 0,
    }));

  const serviceBreakdown = Object.keys(serviceCounts)
    .map((service) => ({
      service,
      count: serviceCounts[service],
      revenue: serviceRevenue[service] || 0,
    }))
    .sort((a, b) => b.count - a.count);

  const recentDays = Array.from({ length: 14 }, (_, index) => {
    const offset = 13 - index;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
    const dayStart = d.getTime();
    const found = dayMap[String(dayStart)];
    return {
      dayStart,
      revenue: found?.revenue || 0,
      customers: found?.customers || 0,
    };
  });

  const dailyRevenueByMonth = Object.keys(monthDayMap)
    .map((monthKey) => ({
      monthStart: Number(monthKey),
      days: Object.values(monthDayMap[monthKey]).sort((a, b) => a.dayStart - b.dayStart),
    }))
    .sort((a, b) => a.monthStart - b.monthStart);

  const daysPassedThisMonth = now.getDate();
  const totalCustomersAllTime = logs.length;
  const averageTicket = totalCustomersAllTime > 0 ? totalRevenue / totalCustomersAllTime : 0;
  const dailyAverageThisMonth = daysPassedThisMonth > 0 ? monthly / daysPassedThisMonth : 0;

  return {
    today,
    weekly,
    monthly,
    totalRevenue,
    totalCustomersToday,
    totalCustomersAllTime,
    averageTicket,
    dailyAverageThisMonth,
    popularService,
    monthlyHistory,
    serviceBreakdown,
    recentDays,
    dailyRevenueByMonth,
  };
};
