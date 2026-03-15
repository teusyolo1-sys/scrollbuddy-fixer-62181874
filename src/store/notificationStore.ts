import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon: "check" | "move" | "add" | "delete" | "info";
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

let _id = 0;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: String(++_id), timestamp: new Date(), read: false },
        ...s.notifications,
      ].slice(0, 50),
    })),
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  clearAll: () => set({ notifications: [] }),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
