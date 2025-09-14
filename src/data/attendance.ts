import { getFromLocalStorage, saveToLocalStorage } from './localStorage';
import { Attendance } from './database';

const ATTENDANCE_KEY = 'attendance';

const getInitialAttendance = (): Attendance[] => [];

export const getAttendance = (): Attendance[] => getFromLocalStorage(ATTENDANCE_KEY, getInitialAttendance);

export const saveAttendance = (attendance: Attendance[]): void => {
    saveToLocalStorage(ATTENDANCE_KEY, attendance);
};

export const checkIn = (employeeId: number, employeeName: string, hotelName: string, position: string, selfie: string): number | null => {
    const attendance = getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (!existingEntry) {
        const newAttendance: Attendance = {
            id: Date.now(),
            employeeId,
            employeeName,
            hotelName,
            position,
            date: today,
            checkIn: new Date().toLocaleTimeString(),
            checkOut: null,
            workHours: null,
            status: 'ok',
            checkInSelfie: selfie,
        };
        saveAttendance([...attendance, newAttendance]);
        return newAttendance.id;
    }
    return null;
};

export const checkOut = (employeeId: number): void => {
    const attendance = getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const entry = attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (entry && entry.checkIn && !entry.checkOut) {
        const checkOutTime = new Date();
        entry.checkOut = checkOutTime.toLocaleTimeString();
        const checkInTime = new Date(`${entry.date}T${entry.checkIn}`);
        const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
        entry.workHours = parseFloat(workHours.toFixed(2));
        saveAttendance(attendance);
    }
};

export const requestCorrection = (attendanceId: number, message: string): void => {
    const attendance = getAttendance();
    const entry = attendance.find(a => a.id === attendanceId);

    if (entry) {
        entry.status = 'pending_review';
        entry.correctionRequest = message;
        saveAttendance(attendance);
    }
};