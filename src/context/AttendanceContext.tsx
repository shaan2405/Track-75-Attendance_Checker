import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { UserData, DailyLog, Timetable, BaselineAttendance, INITIAL_TIMETABLE } from '../types';

interface AttendanceContextType {
  userData: UserData | null;
  dailyLogs: Record<string, DailyLog>;
  loading: boolean;
  updateTimetable: (timetable: Timetable) => Promise<void>;
  updateBaseline: (baseline: BaselineAttendance) => Promise<void>;
  saveDailyLog: (dateStr: string, log: DailyLog) => Promise<void>;
  completeSetup: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});
  const [loading, setLoading] = useState(true);

  // Track both snapshots resolving before marking loading=false
  const userReadyRef = useRef(false);
  const logsReadyRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setDailyLogs({});
      setLoading(false);
      userReadyRef.current = false;
      logsReadyRef.current = false;
      return;
    }

    setLoading(true);
    userReadyRef.current = false;
    logsReadyRef.current = false;

    const checkBothReady = () => {
      if (userReadyRef.current && logsReadyRef.current) {
        setLoading(false);
      }
    };

    // Fetch User Data
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      } else {
        // Initialize new user
        const initialData: UserData = {
          profile: { email: user.email || '', setupCompleted: false },
          timetable: INITIAL_TIMETABLE,
          baseline: { conducted: 0, attended: 0, isSet: false },
        };
        setDoc(userDocRef, initialData);
        setUserData(initialData);
      }
      userReadyRef.current = true;
      checkBothReady();
    });

    // Fetch Daily Logs
    const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
    const unsubscribeLogs = onSnapshot(logsRef, (querySnap) => {
      const logs: Record<string, DailyLog> = {};
      querySnap.forEach((doc) => {
        logs[doc.id] = doc.data() as DailyLog;
      });
      setDailyLogs(logs);
      logsReadyRef.current = true;
      checkBothReady();
    });

    return () => {
      unsubscribeUser();
      unsubscribeLogs();
    };
  }, [user]);

  const updateTimetable = async (timetable: Timetable) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { timetable }, { merge: true });
  };

  const updateBaseline = async (baseline: BaselineAttendance) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { baseline }, { merge: true });
  };

  const saveDailyLog = async (dateStr: string, log: DailyLog) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), {
      ...log,
      editedAt: Date.now(),
    });
  };

  const completeSetup = async () => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.uid), { 
      profile: { ...userData?.profile, setupCompleted: true } 
    }, { merge: true });
  };

  return (
    <AttendanceContext.Provider value={{ 
      userData, dailyLogs, loading, 
      updateTimetable, updateBaseline, saveDailyLog, completeSetup 
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error('useAttendance must be used within AttendanceProvider');
  return context;
};