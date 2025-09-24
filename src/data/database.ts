import { supabase } from '../supabaseClient';
import { getFromLocalStorage, saveToLocalStorage } from './localStorage';

// Interfaces
export interface Person {
  id: string;
  name: string;
  email: string;
  dob: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  address: string;
  position: string;
  image_url: string; // Changed from imageUrl to image_url
}

export interface Employee extends Person {
  status: 'Available' | 'Assigned';
  hotel: string | null;
  role: 'Admin' | 'Hotel Manager' | 'Reclutador' | 'QA Inspector' | 'Contador' | 'Trabajador';
  isBlacklisted: boolean;
  user_id: string | null; // Link to Supabase auth user
}

export interface Candidate extends Person {
  isBlacklisted: boolean;
}

export interface PersonnelRequest {
  id: number;
  hotelName: string;
  position: string;
  quantity: number;
  status: 'Pending' | 'Fulfilled';
}

export interface Hotel {
    id: number;
    name: string;
    imageUrl: string;
    status: 'Client' | 'Prospect';
    address?: string; // Make optional as we'll have granular fields
    street?: string;
    houseNumber?: string;
    postcode?: string;
    state?: string;
    country?: string;
    city: string;
    generalManager: string;
    contact: string;
    email: string;
    latitude?: number;
    longitude?: number;
    contract_url?: string | null; // Added for contract link
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  hotelName: string;
  position: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workHours: number | null;
  status: 'ok' | 'pending_review' | 'approved' | 'rejected';
  correctionRequest?: string;
  checkInSelfie?: string;
}

export interface QAInspection {
  id: number;
  hotelName: string;
  inspectorName: string;
  date: string;
  area: string;
  score: number;
  comments: string;
  employeeId?: number | null;
}


// localStorage keys
const INVENTORY_KEY = 'inventory';
const QA_INSPECTIONS_KEY = 'qaInspections';






// Data access functions
export const getEmployees = async (): Promise<Employee[]> => {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      hoteles ( name )
    `);
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data.map((employee: any) => ({
    ...employee,
    hotel: employee.hoteles ? employee.hoteles.name : null,
  })) as Employee[];
};

export const getCandidates = async (): Promise<Candidate[]> => {
  const { data, error } = await supabase.from('candidate_submissions').select('*');
  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
  return data as Candidate[];
};

export const getPersonnelRequests = async (): Promise<PersonnelRequest[]> => {
  const { data, error } = await supabase
    .from('personnel_requests')
    .select(`
      id,
      position,
      quantity,
      status,
      hoteles ( name )
    `);

  if (error) {
    console.error('Error fetching personnel requests:', error);
    return [];
  }

  const formattedData = data.map(r => ({
    id: r.id,
    position: r.position,
    quantity: r.quantity,
    status: r.status,
    hotelName: r.hoteles.name
  }));

  return formattedData;
};

// Initial Data getters (These are now deprecated but kept for reference)
const getInitialInventory = (): InventoryItem[] => [
  { id: 1, name: 'Pantalones', quantity: 50 },
  { id: 2, name: 'Camisas', quantity: 70 },
];
const getInitialQAInspections = (): QAInspection[] => [];



// Data access functions
export const getInventory = (): InventoryItem[] => getFromLocalStorage(INVENTORY_KEY, getInitialInventory);
export const getQAInspections = (): QAInspection[] => getFromLocalStorage(QA_INSPECTIONS_KEY, getInitialQAInspections);

export const getHotels = async (): Promise<Hotel[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error('No user logged in');
    return [];
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError);
    return [];
  }

  let query = supabase.from('hoteles').select('*');

  if (profile && profile.role !== 'Admin') {
    // query = query.eq('user_id', user.id); // Removed as user_id column does not exist in hoteles table
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching hotels:', error);
    return [];
  }

  return data as Hotel[];
};

export const addHotel = async (newHotelData: Omit<Hotel, 'id'>): Promise<Hotel | null> => {
  const { data, error } = await supabase
    .from('hoteles')
    .insert([newHotelData])
    .select()
    .single();

  if (error) {
    console.error('Error adding hotel:', error);
    return null;
  }
  return data as Hotel;
};

export const addPersonnelRequest = async (newRequestData: { hotel_id: number; position: string; quantity: number; }): Promise<void> => {
  const { error } = await supabase
    .from('personnel_requests')
    .insert([newRequestData]);

  if (error) {
    console.error('Error adding personnel request:', error);
  }
};

export const assignEmployeeToHotel = async (employeeId: number, hotelName: string): Promise<void> => {
  const { data: hotel, error: hotelError } = await supabase
    .from('hoteles')
    .select('id')
    .eq('name', hotelName)
    .single();

  if (hotelError || !hotel) {
    console.error('Error finding hotel to assign:', hotelError);
    return;
  }

  const { error: employeeError } = await supabase
    .from('employees')
    .update({ status: 'Assigned', hotel_id: hotel.id })
    .eq('id', employeeId);

  if (employeeError) {
    console.error('Error assigning employee to hotel:', employeeError);
  }
};

export const fulfillRequest = async (requestId: number): Promise<void> => {
  const { error } = await supabase
    .from('personnel_requests')
    .update({ status: 'Fulfilled' })
    .eq('id', requestId);

  if (error) {
    console.error('Error fulfilling request:', error);
  }
};

export const addCandidate = async (newCandidateData: Omit<Candidate, 'id'>): Promise<Candidate | null> => {
  const { data, error } = await supabase
    .from('candidates')
    .insert([newCandidateData])
    .select()
    .single();

  if (error) {
    console.error('Error adding candidate:', error);
    return null;
  }
  return data as Candidate;
};

export const promoteCandidateToEmployee = async (candidateId: number): Promise<void> => {
  // This function is now deprecated and replaced by promoteCandidateAndCreateUser
  console.warn('promoteCandidateToEmployee is deprecated. Use promoteCandidateAndCreateUser instead.');
};

export const promoteCandidateAndCreateUser = async (
  candidateId: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Fetch candidate data to get email and phone
    const { data: candidate, error: fetchError } = await supabase
      .from('candidate_submissions')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (fetchError || !candidate) {
      console.error('Error fetching candidate to promote:', fetchError);
      return { success: false, error: fetchError?.message || 'Candidate not found.' };
    }

    if (candidate.is_blacklisted) {
      console.error('Cannot promote a blacklisted candidate.');
      return { success: false, error: 'Cannot promote a blacklisted candidate.' };
    }

    const email = candidate.email;
    const phoneNumber = candidate.phone;
    const generatedPassword = phoneNumber ? phoneNumber.slice(0, -2) : 'defaultpassword'; // Derive password

    if (!email || !generatedPassword) {
      return { success: false, error: 'Email or phone number missing for candidate.' };
    }

    // 2. Create Supabase user
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email,
      password: generatedPassword,
      options: {
        emailRedirectTo: window.location.origin, // Redirects to the current app origin, but doesn't auto-login
      },
    });

    if (authError) {
      if (authError.message === 'User already registered') {
        return { success: false, error: 'El usuario ya está registrado. Por favor, utiliza las credenciales existentes o restablece la contraseña manualmente.' };
      } else {
        console.error('Error creating Supabase user:', authError);
        return { success: false, error: authError.message };
      }
    }

    if (!userData.user) {
      return { success: false, error: 'User data not returned after signup.' };
    }

    console.log(`Simulating email confirmation to ${email} with username: ${email} and password: ${generatedPassword}`);
    // In a real application, you would integrate with an email service here

    // 3. Promote candidate to employee
    const { id, created_at, ...candidateData } = candidate;
    const newEmployeeData = {
      ...candidateData,
      status: 'Available',
      hotel_id: null,
      role: 'Trabajador',
      user_id: userData.user.id, // Link Supabase user ID to employee
    };

    const { error: insertError } = await supabase
      .from('employees')
      .insert([newEmployeeData]);

    if (insertError) {
      console.error('Error inserting new employee:', insertError);
      return { success: false, error: insertError.message };
    }

    // 4. Delete promoted candidate
    const { error: deleteError } = await supabase
      .from('candidate_submissions')
      .delete()
      .eq('id', candidateId);

    if (deleteError) {
      console.error('Error deleting promoted candidate:', deleteError);
      // This error is not critical enough to fail the entire operation if employee creation was successful
    }

    return { success: true, email: email, password: generatedPassword };
  } catch (error: any) {
    console.error('Unexpected error during candidate promotion and user creation:', error);
    return { success: false, error: error.message || 'An unexpected error occurred.' };
  }
};

export const updateHotelStatus = async (hotelId: number, status: 'Client' | 'Prospect'): Promise<Hotel | null> => {
  const { data, error } = await supabase
    .from('hoteles')
    .update({ status })
    .eq('id', hotelId)
    .select()
    .single();

  if (error) {
    console.error('Error updating hotel status:', error);
    return null;
  }
  return data as Hotel;
};

export const updateHotel = async (updatedHotel: Hotel): Promise<Hotel | null> => {
  const { id, ...otherFields } = updatedHotel;

  const { data, error } = await supabase
    .from('hoteles')
    .update(otherFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating hotel:', error);
    return null;
  }
  return data as Hotel;
};

export const updateEmployee = async (updatedEmployeeData: any): Promise<void> => {
  // Destructure properties that are not part of the 'employees' table schema to avoid errors
  const { hotel, hoteles, ...rest } = updatedEmployeeData;

  // Defensively delete the incorrect 'imageUrl' property if it exists.
  if ('imageUrl' in rest) {
    delete rest.imageUrl;
  }

  const { error } = await supabase
    .from('employees')
    .update(rest) // The 'rest' object now only contains valid fields.
    .eq('id', updatedEmployeeData.id);

  if (error) {
    console.error('Error updating employee:', error);
  }
};

export const saveEmployees = (employees: Employee[]): void => {
    // This function is deprecated
};

export const deleteEmployee = async (employeeId: number): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', employeeId);

  if (error) {
    console.error('Error deleting employee:', error);
  }
};

export const deleteHotel = async (hotelId: number): Promise<void> => {
  const { error } = await supabase
    .from('hoteles')
    .delete()
    .eq('id', hotelId);

  if (error) {
    console.error('Error deleting hotel:', error);
  }
};

// --- Storage Functions ---

export const uploadContract = async (file: File): Promise<string | null> => {
  const filePath = `public/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('contracts')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading contract:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('contracts')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const updateHotelContractUrl = async (hotelId: number, contractUrl: string): Promise<void> => {
  const { error } = await supabase
    .from('hoteles')
    .update({ contract_url: contractUrl })
    .eq('id', hotelId);

  if (error) {
    console.error('Error updating hotel with contract URL:', error);
  }
};

export const uploadProfilePicture = async (file: File): Promise<string | null> => {
  const filePath = `selfies/${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from('employee-selfies')
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (error) {
    console.error('Error uploading profile picture:', error);
    return null;
  }

  const { data } = supabase.storage
    .from('employee-selfies')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// --- Unmigrated Functions ---

export const updateInventory = (itemId: number, newQuantity: number): void => {
  const inventory = getInventory();
  const updatedInventory = inventory.map(item =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  );
  saveToLocalStorage(INVENTORY_KEY, updatedInventory);
};

export const assignUniformToEmployee = (employeeId: number, itemType: 'Pantalones' | 'Camisas'): { success: boolean; message: string } => {
  // This function is broken because getEmployees is now async
  // It needs to be migrated to use async/await and Supabase
  console.error('assignUniformToEmployee is not fully migrated and will not work correctly.');
  return { success: false, message: 'Function not migrated.' };
  /*
  const employees = getEmployees(); 
  const inventory = getInventory();

  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return { success: false, message: 'Empleado no encontrado.' };

  const inventoryItem = inventory.find(i => i.name === itemType);
  if (!inventoryItem) return { success: false, message: 'Ítem de inventario no encontrado.' };

  if (inventoryItem.quantity <= 0) return { success: false, message: `No hay ${itemType} en stock.` };

  const updatedInventory = inventory.map(i => 
    i.id === inventoryItem.id ? { ...i, quantity: i.quantity - 1 } : i
  );
  saveToLocalStorage(INVENTORY_KEY, updatedInventory);

  return { success: true, message: `Se asignó ${itemType} a ${employee.name}.` };
  */
};

export const addQAInspection = (inspectionData: Omit<QAInspection, 'id'>): void => {
  const inspections = getQAInspections();
  const newInspection: QAInspection = {
    ...inspectionData,
    id: Date.now(),
  };
  saveToLocalStorage(QA_INSPECTIONS_KEY, [...inspections, newInspection]);
};

export const updateQAInspection = (updatedInspection: QAInspection): void => {
  const inspections = getQAInspections();
  const updatedInspections = inspections.map(insp =>
    insp.id === updatedInspection.id ? updatedInspection : insp
  );
  saveToLocalStorage(QA_INSPECTIONS_KEY, updatedInspections);
};

export const deleteQAInspection = (inspectionId: number): void => {
  const inspections = getQAInspections();
  const updatedInspections = inspections.filter(insp => insp.id !== inspectionId);
  saveToLocalStorage(QA_INSPECTIONS_KEY, updatedInspections);
};

