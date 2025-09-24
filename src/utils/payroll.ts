
import { Attendance } from '../data/attendance';
import { PayrollSettings } from '../components/PayrollSettingsDialog';

export interface WeeklyHours {
  total: number;
  regular: number;
  overtime: number;
  records: Attendance[];
}

const DAY_INDICES = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

export function getWeekStartDate(cutoffDay: keyof typeof DAY_INDICES, targetDate: Date): Date {
  const weekCutoffDayIndex = DAY_INDICES[cutoffDay];
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay(); // 0 for Sunday

  let daysSinceCutoff = dayOfWeek - weekCutoffDayIndex;
  if (daysSinceCutoff < 0) {
    daysSinceCutoff += 7;
  }

  const weekEndDate = new Date(date);
  weekEndDate.setDate(date.getDate() - daysSinceCutoff);

  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekEndDate.getDate() - 6);
  weekStartDate.setHours(0, 0, 0, 0);

  return weekStartDate;
}

/**
 * Calculates weekly hours including regular and overtime based on hotel settings.
 * @param allRecords - All attendance records for a single employee.
 * @param settings - The payroll settings for the hotel.
 * @param targetDate - A date within the week to be calculated.
 * @returns An object with total, regular, and overtime hours for the specified week.
 */
export function calculateWeeklyHours(
  allRecords: Attendance[],
  settings: PayrollSettings,
  targetDate: Date = new Date()
): WeeklyHours {
  const weekCutoffDayIndex = DAY_INDICES[settings.week_cutoff_day];

  // Calculate the start and end of the target week
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay(); // 0 for Sunday, 6 for Saturday

  // Adjust to find the most recent cutoff day
  let daysSinceCutoff = dayOfWeek - weekCutoffDayIndex;
  if (daysSinceCutoff < 0) {
    daysSinceCutoff += 7; // Week starts on the previous calendar week
  }
  
  const weekEndDate = new Date(date);
  weekEndDate.setDate(date.getDate() - daysSinceCutoff);
  
  const weekStartDate = new Date(weekEndDate);
  weekStartDate.setDate(weekEndDate.getDate() - 6);

  // Set time to beginning and end of the day for accurate filtering
  weekStartDate.setHours(0, 0, 0, 0);
  weekEndDate.setHours(23, 59, 59, 999);

  // Filter records that fall within the calculated week
  const weeklyRecords = allRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= weekStartDate && recordDate <= weekEndDate;
  });

  // Sum the work hours for the week
  const totalHours = weeklyRecords.reduce((acc, record) => acc + (record.workHours || 0), 0);

  let regularHours = totalHours;
  let overtimeHours = 0;

  // Calculate overtime if enabled
  if (settings.overtime_enabled && totalHours > 40) {
    regularHours = 40;
    overtimeHours = totalHours - 40;
  } else {
    // If overtime is disabled or total hours are not over 40, all hours are regular
    regularHours = totalHours;
    overtimeHours = 0;
  }

  return {
    total: totalHours,
    regular: regularHours,
    overtime: overtimeHours,
    records: weeklyRecords,
  };
}
