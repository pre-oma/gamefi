import { User, Portfolio, Activity, Notification, Reward, UserCredentials } from '@/types';

const KEYS = {
  CURRENT_USER: 'gamefi-current-user',
  USERS: 'gamefi-users',
  PORTFOLIOS: 'gamefi-portfolios',
  ACTIVITIES: 'gamefi-activities',
  NOTIFICATIONS: 'gamefi-notifications',
  REWARDS: 'gamefi-rewards',
  CREDENTIALS: 'gamefi-credentials',
};

// Generic storage helpers
const getItem = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
};

// User storage
export const userStorage = {
  getCurrentUser: (): User | null => getItem<User | null>(KEYS.CURRENT_USER, null),

  setCurrentUser: (user: User | null): void => setItem(KEYS.CURRENT_USER, user),

  getAllUsers: (): User[] => getItem<User[]>(KEYS.USERS, []),

  saveUser: (user: User): void => {
    const users = userStorage.getAllUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setItem(KEYS.USERS, users);
  },

  getUserById: (id: string): User | undefined => {
    return userStorage.getAllUsers().find((u) => u.id === id);
  },

  getUserByUsername: (username: string): User | undefined => {
    return userStorage.getAllUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserByEmail: (email: string): User | undefined => {
    return userStorage.getAllUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  deleteUser: (id: string): void => {
    const users = userStorage.getAllUsers().filter((u) => u.id !== id);
    setItem(KEYS.USERS, users);
  },
};

// Portfolio storage
export const portfolioStorage = {
  getAll: (): Portfolio[] => getItem<Portfolio[]>(KEYS.PORTFOLIOS, []),

  save: (portfolio: Portfolio): void => {
    const portfolios = portfolioStorage.getAll();
    const index = portfolios.findIndex((p) => p.id === portfolio.id);
    if (index >= 0) {
      portfolios[index] = portfolio;
    } else {
      portfolios.push(portfolio);
    }
    setItem(KEYS.PORTFOLIOS, portfolios);
  },

  delete: (id: string): void => {
    const portfolios = portfolioStorage.getAll().filter((p) => p.id !== id);
    setItem(KEYS.PORTFOLIOS, portfolios);
  },

  getById: (id: string): Portfolio | undefined => {
    return portfolioStorage.getAll().find((p) => p.id === id);
  },

  getByUserId: (userId: string): Portfolio[] => {
    return portfolioStorage.getAll().filter((p) => p.userId === userId);
  },

  getPublic: (): Portfolio[] => {
    return portfolioStorage.getAll().filter((p) => p.isPublic);
  },
};

// Activity storage
export const activityStorage = {
  getAll: (): Activity[] => getItem<Activity[]>(KEYS.ACTIVITIES, []),

  add: (activity: Activity): void => {
    const activities = [activity, ...activityStorage.getAll()].slice(0, 100);
    setItem(KEYS.ACTIVITIES, activities);
  },

  getByUserId: (userId: string): Activity[] => {
    return activityStorage.getAll().filter((a) => a.userId === userId);
  },

  getFeed: (followingIds: string[]): Activity[] => {
    return activityStorage.getAll().filter((a) => followingIds.includes(a.userId));
  },
};

// Notification storage
export const notificationStorage = {
  getByUserId: (userId: string): Notification[] => {
    return getItem<Notification[]>(KEYS.NOTIFICATIONS, []).filter((n) => n.userId === userId);
  },

  add: (notification: Notification): void => {
    const notifications = [notification, ...getItem<Notification[]>(KEYS.NOTIFICATIONS, [])];
    setItem(KEYS.NOTIFICATIONS, notifications);
  },

  markAsRead: (id: string): void => {
    const notifications = getItem<Notification[]>(KEYS.NOTIFICATIONS, []).map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    setItem(KEYS.NOTIFICATIONS, notifications);
  },

  markAllAsRead: (userId: string): void => {
    const notifications = getItem<Notification[]>(KEYS.NOTIFICATIONS, []).map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
    setItem(KEYS.NOTIFICATIONS, notifications);
  },
};

// Reward storage
export const rewardStorage = {
  getByUserId: (userId: string): Reward[] => {
    return getItem<Reward[]>(KEYS.REWARDS, []).filter((r) => r.id.startsWith(userId));
  },

  add: (userId: string, reward: Reward): void => {
    const rewards = [...getItem<Reward[]>(KEYS.REWARDS, []), { ...reward, id: `${userId}-${reward.id}` }];
    setItem(KEYS.REWARDS, rewards);
  },
};

// Credential storage
export const credentialStorage = {
  getAll: (): UserCredentials[] => getItem<UserCredentials[]>(KEYS.CREDENTIALS, []),

  save: (credentials: UserCredentials): void => {
    const all = credentialStorage.getAll();
    const index = all.findIndex((c) => c.id === credentials.id);
    if (index >= 0) {
      all[index] = credentials;
    } else {
      all.push(credentials);
    }
    setItem(KEYS.CREDENTIALS, all);
  },

  getByUserId: (userId: string): UserCredentials | undefined => {
    return credentialStorage.getAll().find((c) => c.userId === userId);
  },

  deleteByUserId: (userId: string): void => {
    const all = credentialStorage.getAll().filter((c) => c.userId !== userId);
    setItem(KEYS.CREDENTIALS, all);
  },
};

// Clear all data (for testing)
export const clearAllData = (): void => {
  Object.values(KEYS).forEach((key) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  });
};
