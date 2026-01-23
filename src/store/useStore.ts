'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Portfolio,
  PortfolioPlayer,
  Formation,
  Activity,
  Notification,
  Badge,
  Asset,
  FORMATIONS,
} from '@/types';
import { userStorage, portfolioStorage, activityStorage, notificationStorage, credentialStorage } from '@/lib/storage';
import { AuthResponse, UserCredentials } from '@/types';

interface AppState {
  // Auth state
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Data
  portfolios: Portfolio[];
  publicPortfolios: Portfolio[];
  activities: Activity[];
  notifications: Notification[];

  // Actions - Auth
  login: (identifier: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;

  // Actions - Portfolio
  createPortfolio: (name: string, description: string, formation: Formation) => Portfolio;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  assignAssetToPosition: (portfolioId: string, positionId: string, asset: Asset | null) => void;
  likePortfolio: (portfolioId: string) => void;
  clonePortfolio: (portfolioId: string) => Portfolio | null;

  // Actions - Social
  followUser: (targetUserId: string) => void;
  unfollowUser: (targetUserId: string) => void;

  // Actions - Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Actions - Data loading
  loadData: () => void;
  refreshPortfolios: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  portfolios: [],
  publicPortfolios: [],
  activities: [],
  notifications: [],

  // Auth actions
  login: async (identifier: string, password: string): Promise<AuthResponse> => {
    // Find user by username or email
    const normalizedIdentifier = identifier.toLowerCase().trim();
    let user = userStorage.getUserByUsername(normalizedIdentifier);
    if (!user) {
      user = userStorage.getUserByEmail(normalizedIdentifier);
    }

    if (!user) {
      return { success: false, error: 'Invalid username/email or password' };
    }

    // Get credentials for user
    const credentials = credentialStorage.getByUserId(user.id);
    if (!credentials) {
      return { success: false, error: 'Invalid username/email or password' };
    }

    // Call login API to verify password
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password,
          storedUser: user,
          storedCredentials: credentials,
        }),
      });

      const result: AuthResponse = await response.json();

      if (result.success && result.user) {
        userStorage.setCurrentUser(result.user);
        set({
          currentUser: result.user,
          isAuthenticated: true,
          portfolios: portfolioStorage.getByUserId(result.user.id),
          notifications: notificationStorage.getByUserId(result.user.id),
        });
      }

      return result;
    } catch {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  },

  register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
    // Check if username already exists
    if (userStorage.getUserByUsername(username)) {
      return { success: false, error: 'Username is already taken' };
    }

    // Check if email already exists
    if (userStorage.getUserByEmail(email)) {
      return { success: false, error: 'Email is already registered' };
    }

    // Call register API
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error };
      }

      const { user, credentials } = result as { user: User; credentials: UserCredentials };

      // Save user and credentials to localStorage
      userStorage.saveUser(user);
      credentialStorage.save(credentials);
      userStorage.setCurrentUser(user);

      // Add welcome activity
      const activity: Activity = {
        id: uuidv4(),
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        type: 'followed_user',
        targetId: user.id,
        targetName: 'Gamefi Invest',
        timestamp: new Date().toISOString(),
      };
      activityStorage.add(activity);

      set({
        currentUser: user,
        isAuthenticated: true,
        portfolios: [],
        notifications: [],
      });

      return { success: true, user };
    } catch {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  },

  logout: () => {
    userStorage.setCurrentUser(null);
    set({
      currentUser: null,
      isAuthenticated: false,
      portfolios: [],
      notifications: [],
    });
  },

  updateProfile: (updates: Partial<User>) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    userStorage.saveUser(updatedUser);
    userStorage.setCurrentUser(updatedUser);

    set({ currentUser: updatedUser });
  },

  // Portfolio actions
  createPortfolio: (name: string, description: string, formation: Formation) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('Must be logged in');

    const positions = FORMATIONS[formation];
    const players: PortfolioPlayer[] = positions.map((pos) => ({
      positionId: pos.id,
      asset: null,
      allocation: 100 / 11, // ~9.09% each
    }));

    const portfolio: Portfolio = {
      id: uuidv4(),
      userId: currentUser.id,
      name,
      description,
      formation,
      players,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true,
      likes: [],
      clonedFrom: null,
      cloneCount: 0,
      tags: [],
    };

    portfolioStorage.save(portfolio);

    // Update user's portfolio list
    const updatedUser = {
      ...currentUser,
      portfolios: [...currentUser.portfolios, portfolio.id],
      xp: currentUser.xp + 50,
    };
    userStorage.saveUser(updatedUser);
    userStorage.setCurrentUser(updatedUser);

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      type: 'created_portfolio',
      targetId: portfolio.id,
      targetName: portfolio.name,
      timestamp: new Date().toISOString(),
    };
    activityStorage.add(activity);

    set({
      currentUser: updatedUser,
      portfolios: [...get().portfolios, portfolio],
      publicPortfolios: portfolioStorage.getPublic(),
    });

    return portfolio;
  },

  updatePortfolio: (id: string, updates: Partial<Portfolio>) => {
    const portfolio = portfolioStorage.getById(id);
    if (!portfolio) return;

    const updated = {
      ...portfolio,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    portfolioStorage.save(updated);

    set({
      portfolios: get().portfolios.map((p) => (p.id === id ? updated : p)),
      publicPortfolios: portfolioStorage.getPublic(),
    });
  },

  deletePortfolio: (id: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    portfolioStorage.delete(id);

    const updatedUser = {
      ...currentUser,
      portfolios: currentUser.portfolios.filter((pid) => pid !== id),
    };
    userStorage.saveUser(updatedUser);
    userStorage.setCurrentUser(updatedUser);

    set({
      currentUser: updatedUser,
      portfolios: get().portfolios.filter((p) => p.id !== id),
      publicPortfolios: portfolioStorage.getPublic(),
    });
  },

  assignAssetToPosition: (portfolioId: string, positionId: string, asset: Asset | null) => {
    const portfolio = portfolioStorage.getById(portfolioId);
    if (!portfolio) return;

    const updatedPlayers = portfolio.players.map((player) =>
      player.positionId === positionId ? { ...player, asset } : player
    );

    const updated = {
      ...portfolio,
      players: updatedPlayers,
      updatedAt: new Date().toISOString(),
    };

    portfolioStorage.save(updated);

    set({
      portfolios: get().portfolios.map((p) => (p.id === portfolioId ? updated : p)),
    });
  },

  likePortfolio: (portfolioId: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const portfolio = portfolioStorage.getById(portfolioId);
    if (!portfolio) return;

    const hasLiked = portfolio.likes.includes(currentUser.id);
    const updatedLikes = hasLiked
      ? portfolio.likes.filter((id) => id !== currentUser.id)
      : [...portfolio.likes, currentUser.id];

    const updated = {
      ...portfolio,
      likes: updatedLikes,
    };

    portfolioStorage.save(updated);

    // Add activity if liking (not unliking)
    if (!hasLiked) {
      const activity: Activity = {
        id: uuidv4(),
        userId: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar,
        type: 'liked_portfolio',
        targetId: portfolio.id,
        targetName: portfolio.name,
        timestamp: new Date().toISOString(),
      };
      activityStorage.add(activity);

      // Notify portfolio owner
      if (portfolio.userId !== currentUser.id) {
        const notification: Notification = {
          id: uuidv4(),
          userId: portfolio.userId,
          type: 'portfolio_liked',
          message: `${currentUser.username} liked your portfolio "${portfolio.name}"`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        notificationStorage.add(notification);
      }
    }

    set({
      portfolios: get().portfolios.map((p) => (p.id === portfolioId ? updated : p)),
      publicPortfolios: portfolioStorage.getPublic(),
    });
  },

  clonePortfolio: (portfolioId: string) => {
    const { currentUser } = get();
    if (!currentUser) return null;

    const original = portfolioStorage.getById(portfolioId);
    if (!original) return null;

    const cloned: Portfolio = {
      ...original,
      id: uuidv4(),
      userId: currentUser.id,
      name: `${original.name} (Clone)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [],
      clonedFrom: original.id,
      cloneCount: 0,
    };

    portfolioStorage.save(cloned);

    // Update original's clone count
    const updatedOriginal = {
      ...original,
      cloneCount: original.cloneCount + 1,
    };
    portfolioStorage.save(updatedOriginal);

    // Update user
    const updatedUser = {
      ...currentUser,
      portfolios: [...currentUser.portfolios, cloned.id],
      xp: currentUser.xp + 25,
    };
    userStorage.saveUser(updatedUser);
    userStorage.setCurrentUser(updatedUser);

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      type: 'cloned_portfolio',
      targetId: cloned.id,
      targetName: original.name,
      timestamp: new Date().toISOString(),
    };
    activityStorage.add(activity);

    // Notify original owner
    if (original.userId !== currentUser.id) {
      const notification: Notification = {
        id: uuidv4(),
        userId: original.userId,
        type: 'portfolio_cloned',
        message: `${currentUser.username} cloned your portfolio "${original.name}"`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notificationStorage.add(notification);
    }

    set({
      currentUser: updatedUser,
      portfolios: [...get().portfolios, cloned],
      publicPortfolios: portfolioStorage.getPublic(),
    });

    return cloned;
  },

  // Social actions
  followUser: (targetUserId: string) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.id === targetUserId) return;

    const targetUser = userStorage.getUserById(targetUserId);
    if (!targetUser) return;

    // Update current user's following
    const updatedCurrentUser = {
      ...currentUser,
      following: [...currentUser.following, targetUserId],
    };
    userStorage.saveUser(updatedCurrentUser);
    userStorage.setCurrentUser(updatedCurrentUser);

    // Update target user's followers and award +100 XP
    const updatedTargetUser = {
      ...targetUser,
      followers: [...targetUser.followers, currentUser.id],
      xp: targetUser.xp + 100,
    };
    userStorage.saveUser(updatedTargetUser);

    // Add activity
    const activity: Activity = {
      id: uuidv4(),
      userId: currentUser.id,
      username: currentUser.username,
      avatar: currentUser.avatar,
      type: 'followed_user',
      targetId: targetUserId,
      targetName: targetUser.username,
      timestamp: new Date().toISOString(),
    };
    activityStorage.add(activity);

    // Notify target user
    const notification: Notification = {
      id: uuidv4(),
      userId: targetUserId,
      type: 'new_follower',
      message: `${currentUser.username} started following you (+100 XP!)`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notificationStorage.add(notification);

    set({ currentUser: updatedCurrentUser });
  },

  unfollowUser: (targetUserId: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const targetUser = userStorage.getUserById(targetUserId);
    if (!targetUser) return;

    // Update current user
    const updatedCurrentUser = {
      ...currentUser,
      following: currentUser.following.filter((id) => id !== targetUserId),
    };
    userStorage.saveUser(updatedCurrentUser);
    userStorage.setCurrentUser(updatedCurrentUser);

    // Update target user
    const updatedTargetUser = {
      ...targetUser,
      followers: targetUser.followers.filter((id) => id !== currentUser.id),
    };
    userStorage.saveUser(updatedTargetUser);

    set({ currentUser: updatedCurrentUser });
  },

  // Notification actions
  markNotificationRead: (id: string) => {
    notificationStorage.markAsRead(id);
    const { currentUser } = get();
    if (currentUser) {
      set({ notifications: notificationStorage.getByUserId(currentUser.id) });
    }
  },

  markAllNotificationsRead: () => {
    const { currentUser } = get();
    if (currentUser) {
      notificationStorage.markAllAsRead(currentUser.id);
      set({ notifications: notificationStorage.getByUserId(currentUser.id) });
    }
  },

  // Data loading
  loadData: () => {
    const currentUser = userStorage.getCurrentUser();

    set({
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading: false,
      portfolios: currentUser ? portfolioStorage.getByUserId(currentUser.id) : [],
      publicPortfolios: portfolioStorage.getPublic(),
      activities: activityStorage.getAll(),
      notifications: currentUser ? notificationStorage.getByUserId(currentUser.id) : [],
    });
  },

  refreshPortfolios: () => {
    const { currentUser } = get();
    set({
      portfolios: currentUser ? portfolioStorage.getByUserId(currentUser.id) : [],
      publicPortfolios: portfolioStorage.getPublic(),
    });
  },
}));
