import { format } from 'date-fns';

export type DayStatus = 'NORMAL' | 'HOLIDAY' | 'CANCELLED' | 'PRESENT_ALL';
export type PeriodStatus = 'PRESENT' | 'ABSENT' | 'CANCELLED';

export interface TimetableDay {
  periods: boolean[]; // true if class, false if free
}

export interface Timetable {
  monday: boolean[];
  tuesday: boolean[];
  wednesday: boolean[];
  thursday: boolean[];
  friday: boolean[];
  saturday: boolean[];
}

export interface BaselineAttendance {
  conducted: number;
  attended: number;
  isSet: boolean;
}

export interface DailyLog {
  dayStatus: DayStatus;
  periods: Record<number, PeriodStatus>; // period index -> status
  editedAt: number;
}

export interface UserData {
  profile: {
    email: string;
    setupCompleted: boolean;
  };
  timetable: Timetable;
  baseline: BaselineAttendance;
}

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export const INITIAL_TIMETABLE: Timetable = {
  monday: Array(8).fill(true),
  tuesday: Array(8).fill(true),
  wednesday: Array(8).fill(true),
  thursday: Array(8).fill(true),
  friday: Array(8).fill(true),
  saturday: Array(7).fill(true),
};

export const getDayName = (date: Date): string => {
  return format(date, 'eeee').toLowerCase();
};