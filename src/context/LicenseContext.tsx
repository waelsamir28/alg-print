import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ACTIVATION_KEY,
  TRIAL_DAYS,
  activateSerial,
  clearActivation,
  daysLeft,
  getMachineFingerprint,
  loadActivation,
  loadTrial,
  machineShortCode,
  saveActivation,
  touchTrial,
  trialProgress,
  type LicenseStatus,
  type StoredActivation,
  type ActivationOutcome,
} from '../utils/license';

interface LicenseContextValue {
  status: LicenseStatus;
  machineCode: string;
  shortCode: string;
  daysRemaining: number;
  trialPercent: number;
  firstRunAt: number;
  activation: StoredActivation | null;
  activate: (serial: string) => Promise<ActivationOutcome>;
  deactivate: () => void;
  /** يُفتح تلقائياً عند انتهاء التجربة */
  isLocked: boolean;
  setLocked: (v: boolean) => void;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activation, setActivationState] = useState<StoredActivation | null>(() => loadActivation());
  const [trial, setTrial] = useState(() => loadTrial());
  const [isLocked, setLocked] = useState(false);

  const machineCode = useMemo(() => getMachineFingerprint(), []);
  const shortCode = useMemo(() => machineShortCode(machineCode), [machineCode]);

  // تحديث آخر تشغيل
  useEffect(() => {
    touchTrial(trial);
  }, [trial]);

  const remaining = daysLeft(trial.firstRunAt);
  const percent = trialProgress(trial.firstRunAt);

  const status: LicenseStatus = useMemo(() => {
    if (activation) {
      if (activation.expiresAt && activation.expiresAt < Date.now()) return 'expired';
      return 'activated';
    }
    return remaining > 0 ? 'trial' : 'trial-expired';
  }, [activation, remaining]);

  // إعادة قراءة الحالة عند تغيير التخزين في تبويب آخر
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVATION_KEY) setActivationState(loadActivation());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const activate = useCallback(async (serial: string) => {
    const outcome = await activateSerial(serial);
    if (outcome.ok && outcome.activation) {
      setActivationState(outcome.activation);
      saveActivation(outcome.activation);
      setLocked(false);
    }
    return outcome;
  }, []);

  const deactivate = useCallback(() => {
    clearActivation();
    setActivationState(null);
    setTrial(loadTrial());
  }, []);

  const value: LicenseContextValue = {
    status,
    machineCode,
    shortCode,
    daysRemaining: remaining,
    trialPercent: percent,
    firstRunAt: trial.firstRunAt,
    activation,
    activate,
    deactivate,
    isLocked: isLocked || status === 'trial-expired' || status === 'expired',
    setLocked,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
};

export function useLicense(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error('useLicense must be used inside LicenseProvider');
  return ctx;
}

export { TRIAL_DAYS };
