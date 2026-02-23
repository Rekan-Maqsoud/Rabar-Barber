const listeners = new Set<(enabled: boolean) => void>();
let adminNotificationEnabled = false;

export const setAdminNotificationSession = (enabled: boolean) => {
  adminNotificationEnabled = enabled;
  listeners.forEach((listener) => listener(enabled));
};

export const getAdminNotificationSession = () => adminNotificationEnabled;

export const subscribeAdminNotificationSession = (listener: (enabled: boolean) => void) => {
  listeners.add(listener);
  listener(adminNotificationEnabled);

  return () => {
    listeners.delete(listener);
  };
};
