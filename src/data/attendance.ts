import { supabase } from '../supabaseClient';
import { Attendance } from './database';

// Note: The local storage functions are now deprecated.

export const getAttendance = async (): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      check_in,
      check_out,
      lodge_in,
      lodge_out,
      status,
      correction_request,
      check_in_selfie_url,
      employee_id,
      employees ( id, name, position ),
      hoteles ( id, name )
    `);

  if (error) {
    console.error('Error fetching attendance:', error.message);
    console.error('Supabase error details:', error.details);
    return [];
  }

  // Map the data to the flat Attendance interface used by the frontend
  const formattedData = data.map(r => ({
    id: r.id,
    employeeId: r.employees.id,
    employeeName: r.employees.name,
    hotelName: r.hoteles.name,
    position: r.employees.position,
    date: new Date(r.check_in).toISOString().split('T')[0], // Extract date from check_in
    checkIn: new Date(r.check_in).toLocaleTimeString(),
        checkOut: r.check_out ? new Date(r.check_out).toLocaleTimeString() : null,
    workHours: r.check_out ? (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 3600000 : null,
    status: r.status as Attendance['status'],
    correctionRequest: r.correction_request,
    checkInSelfie: r.check_in_selfie_url,
  }));

  return formattedData;
};

export const checkIn = async (employeeId: number, hotelId: number, selfieUrl: string): Promise<number | null> => {
  // Check for an existing check-in today for this employee that is not checked out
  const today = new Date().toISOString().split('T')[0];
  const { data: existing, error: existingError } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employeeId)
    .gte('check_in', `${today}T00:00:00Z`)
    .lte('check_in', `${today}T23:59:59Z`)
    .is('check_out', null);

  if (existingError) {
    console.error('Error checking for existing check-in:', existingError);
    return null;
  }

  if (existing && existing.length > 0) {
    console.warn('User has an open check-in for today already.');
    return null; // Already checked in and not out
  }

  const { data, error } = await supabase
    .from('attendance')
    .insert({
      check_in: new Date().toISOString(),
      employee_id: employeeId,
      hotel_id: hotelId,
      check_in_selfie_url: selfieUrl,
      status: 'ok',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error during check-in:', error);
    return null;
  }

  return data.id;
};

export const checkOut = async (employeeId: number): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];

  // Find the open check-in for today
  const { data: entry, error: findError } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employeeId)
    .gte('check_in', `${today}T00:00:00Z`)
    .lte('check_in', `${today}T23:59:59Z`)
    .is('check_out', null)
    .single();

  if (findError || !entry) {
    console.error('Could not find an open check-in to check out from.', findError);
    return;
  }

  // Update the entry with the check-out time
  const { error: updateError } = await supabase
    .from('attendance')
    .update({ check_out: new Date().toISOString() })
    .eq('id', entry.id);

  if (updateError) {
    console.error('Error during check-out:', updateError);
  }
};

export const requestCorrection = async (attendanceId: number, message: string): Promise<void> => {
  const { error } = await supabase
    .from('attendance')
    .update({ 
      status: 'pending_review', 
      correction_request: message 
    })
    .eq('id', attendanceId);

  if (error) {
    console.error('Error requesting correction:', error);
  }
};

export const getAttendanceForHotel = async (hotelId: number): Promise<Attendance[]> => {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      check_in,
      check_out,
      lodge_in,
      lodge_out,
      status,
      correction_request,
      check_in_selfie_url,
      employee_id,
      employees ( id, name, position ),
      hoteles ( id, name )
    `)
    .eq('hotel_id', hotelId);

  if (error) {
    console.error('Error fetching attendance for hotel:', error.message);
    return [];
  }

  const formattedData = data.map(r => ({
    id: r.id,
    employeeId: r.employees.id,
    employeeName: r.employees.name,
    hotelName: r.hoteles.name,
    position: r.employees.position,
    date: new Date(r.check_in).toISOString().split('T')[0],
    checkIn: new Date(r.check_in).toLocaleTimeString(),
    checkOut: r.check_out ? new Date(r.check_out).toLocaleTimeString() : null,
    workHours: r.check_out ? (new Date(r.check_out).getTime() - new Date(r.check_in).getTime()) / 3600000 : null,
    status: r.status as Attendance['status'],
    correctionRequest: r.correction_request,
    checkInSelfie: r.check_in_selfie_url,
  }));

  return formattedData;
};

export const updateAttendanceRecord = async (attendanceId: number, updates: { check_in: string; check_out: string; }) => {
  const { data, error } = await supabase
    .from('attendance')
    .update(updates)
    .eq('id', attendanceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating attendance record:', error);
    return null;
  }
  return data;
};

export const uploadSelfie = async (imageDataUrl: string): Promise<string | null> => {
  const base64Response = await fetch(imageDataUrl);
  const blob = await base64Response.blob();
  const filePath = `selfies/${Date.now()}.jpeg`; // Unique filename

  const { data, error } = await supabase.storage
    .from('employee-selfies') // Assuming a bucket named 'selfies' exists
    .upload(filePath, blob, { contentType: 'image/jpeg' });

  if (error) {
    console.error('Error uploading selfie:', error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from('employee-selfies')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
