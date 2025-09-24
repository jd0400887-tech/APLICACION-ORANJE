
import { supabase } from '../supabaseClient';

export interface WeeklyApproval {
  id?: number;
  hotel_id: number;
  employee_id: number;
  week_start_date: string;
  status: 'pending' | 'approved';
}

/**
 * Fetches the approval status for a specific week for an employee.
 * @param employeeId The ID of the employee.
 * @param weekStartDate The start date of the week (ISO string).
 * @returns The weekly approval record or null if not found.
 */
export const getWeeklyApproval = async (employeeId: number, weekStartDate: string): Promise<WeeklyApproval | null> => {
  const { data, error } = await supabase
    .from('weekly_approvals')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('week_start_date', weekStartDate)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: no rows found
    console.error('Error fetching weekly approval:', error);
    return null;
  }

  return data;
};

export const getAllWeeklyApprovals = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('weekly_approvals')
    .select(`
      *,
      hoteles ( name ),
      employees ( name )
    `);

  if (error) {
    console.error('Error fetching all weekly approvals:', error);
    return [];
  }
  return data;
};

/**
 * Approves a week for a specific employee.
 * This will insert or update an approval record.
 * @param hotelId The ID of the hotel.
 * @param employeeId The ID of the employee.
 * @param weekStartDate The start date of the week (ISO string).
 * @returns The updated weekly approval record.
 */
export const approveWeek = async (hotelId: number, employeeId: number, weekStartDate: string): Promise<WeeklyApproval | null> => {
  const { data, error } = await supabase
    .from('weekly_approvals')
    .upsert({
      hotel_id: hotelId,
      employee_id: employeeId,
      week_start_date: weekStartDate,
      status: 'approved'
    }, {
      onConflict: 'employee_id,week_start_date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error approving week:', error);
    return null;
  }

  return data;
};
