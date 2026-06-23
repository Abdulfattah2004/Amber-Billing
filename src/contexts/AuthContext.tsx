import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'employee';

interface AuthUser {
  username: string;
  role: UserRole;
}

interface StoredUser {
  username: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  users: StoredUser[];
  addUser: (username: string, password: string, role?: UserRole) => boolean;
  removeUser: (username: string) => boolean;
  isAdmin: boolean;
}

const DEFAULT_USERS: StoredUser[] = [{ username: 'admin', password: 'admin123', role: 'admin' }];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Migrate old users without role
const migrateUsers = (users: any[]): StoredUser[] => {
  return users.map(u => ({
    ...u,
    role: u.role || 'admin',
  }));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('amber_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<StoredUser[]>(() => {
    const saved = localStorage.getItem('amber_users');
    return saved ? migrateUsers(JSON.parse(saved)) : DEFAULT_USERS;
  });

  useEffect(() => {
    localStorage.setItem('amber_users', JSON.stringify(users));
  }, [users]);

  const login = (username: string, password: string): boolean => {
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      const session: AuthUser = { username: found.username, role: found.role };
      setUser(session);
      localStorage.setItem('amber_session', JSON.stringify(session));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('amber_session');
  };

  const addUser = (username: string, password: string, role: UserRole = 'employee'): boolean => {
    if (users.find(u => u.username === username)) return false;
    setUsers(prev => [...prev, { username, password, role }]);
    return true;
  };

  const removeUser = (username: string): boolean => {
    if (users.length <= 1) return false;
    setUsers(prev => prev.filter(u => u.username !== username));
    return true;
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, users, addUser, removeUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
