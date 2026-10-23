import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { logSecurityAudit } from '../services/encryption';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  signup: (userData: { name: string; email: string; role: UserRole; department: string; licenseNumber: string }) => Promise<boolean>;
  switchDemoRole: (role: UserRole) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const DEMO_USERS: Record<UserRole, User> = {
  doctor: {
    id: 'usr_doc_01',
    name: 'Dr. Evelyn Vance, MD',
    email: 'evelyn.vance@pulseward.health',
    role: 'doctor',
    title: 'Lead Attending Cardiologist',
    department: 'Cardiology & Critical Care',
    licenseNumber: 'MD-849201-NY',
    avatarInitials: 'EV',
  },
  nurse: {
    id: 'usr_nur_01',
    name: 'Marcus Reed, RN, BSN',
    email: 'marcus.reed@pulseward.health',
    role: 'nurse',
    title: 'Charge Nurse - ICU Ward',
    department: 'Intensive Care Unit (ICU)',
    licenseNumber: 'RN-552093-NY',
    avatarInitials: 'MR',
  },
  admin: {
    id: 'usr_adm_01',
    name: 'Sarah Jenkins, MHA',
    email: 'sarah.jenkins@pulseward.health',
    role: 'admin',
    title: 'Chief Operating Officer & Bed Admin',
    department: 'Hospital Administration & Billing',
    licenseNumber: 'ADM-901844-NY',
    avatarInitials: 'SJ',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pulseward_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEMO_USERS.doctor;
      }
    }
    // Default logged in as Lead Cardiologist for immediate comprehensive inspection
    return DEMO_USERS.doctor;
  });

  const role: UserRole = currentUser?.role || 'doctor';
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pulseward_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pulseward_current_user');
    }
  }, [currentUser]);

  const login = async (email: string, targetRole?: UserRole): Promise<boolean> => {
    // Check demo accounts first
    const matchedRole = targetRole || (Object.keys(DEMO_USERS).find(
      r => DEMO_USERS[r as UserRole].email.toLowerCase() === email.toLowerCase()
    ) as UserRole) || 'doctor';

    const userToSet: User = {
      ...DEMO_USERS[matchedRole],
      email: email || DEMO_USERS[matchedRole].email,
    };

    setCurrentUser(userToSet);
    await logSecurityAudit(userToSet.id, userToSet.name, userToSet.role, 'VIEW_RECORD', 'SYSTEM', 'Authenticated via Role Portal');
    return true;
  };

  const signup = async (userData: { name: string; email: string; role: UserRole; department: string; licenseNumber: string }): Promise<boolean> => {
    const initials = userData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      title: userData.role === 'doctor' ? 'Attending Physician' : userData.role === 'nurse' ? 'Staff Nurse' : 'Hospital Coordinator',
      department: userData.department || 'Clinical Operations',
      licenseNumber: userData.licenseNumber || `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
      avatarInitials: initials || 'MD',
    };

    setCurrentUser(newUser);
    await logSecurityAudit(newUser.id, newUser.name, newUser.role, 'VIEW_RECORD', 'SYSTEM', 'New account registered & logged in');
    return true;
  };

  const switchDemoRole = (newRole: UserRole) => {
    const user = DEMO_USERS[newRole];
    setCurrentUser(user);
    logSecurityAudit(user.id, user.name, user.role, 'VIEW_RECORD', 'SYSTEM', `Switched active role to ${newRole.toUpperCase()}`);
  };

  const logout = () => {
    if (currentUser) {
      logSecurityAudit(currentUser.id, currentUser.name, currentUser.role, 'VIEW_RECORD', 'SYSTEM', 'User signed out');
    }
    setCurrentUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    switch (permission) {
      case 'approve_discharge':
        return currentUser.role === 'doctor' || currentUser.role === 'admin';
      case 'prescribe_meds':
        return currentUser.role === 'doctor';
      case 'record_vitals':
        return currentUser.role === 'nurse' || currentUser.role === 'doctor';
      case 'manage_staff':
        return currentUser.role === 'admin';
      case 'edit_billing':
        return currentUser.role === 'admin';
      case 'view_full_history':
        return true;
      case 'consultation_slides':
        return currentUser.role === 'doctor' || currentUser.role === 'nurse';
      default:
        return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        login,
        signup,
        switchDemoRole,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
