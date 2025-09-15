import { supabase } from '../supabaseClient';
import { getFromLocalStorage, saveToLocalStorage } from './localStorage';

// Interfaces
export interface Person {
  id: number;
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
  imageUrl: string;
}

export interface Employee extends Person {
  status: 'Available' | 'Assigned';
  hotel: string | null;
  role: 'Admin' | 'Hotel Manager' | 'Reclutador' | 'QA Inspector' | 'Contador' | 'Trabajador';
  isBlacklisted: boolean;
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
    address: string;
    city: string;
    generalManager: string;
    contact: string;
    email: string;
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
  const { data, error } = await supabase.from('candidates').select('*');
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
    query = query.eq('user_id', user.id);
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

export const promoteCandidateToEmployee = async (candidateId: number): Promise<void> => {
  const { data: candidate, error: fetchError } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', candidateId)
    .single();

  if (fetchError || !candidate) {
    console.error('Error fetching candidate to promote:', fetchError);
    return;
  }

  if (candidate.is_blacklisted) {
    console.error('Cannot promote a blacklisted candidate.');
    return;
  }

  const { id, created_at, ...candidateData } = candidate;
  const newEmployeeData = {
    ...candidateData,
    status: 'Available',
    hotel_id: null,
    role: 'Trabajador'
  };

  const { error: insertError } = await supabase
    .from('employees')
    .insert([newEmployeeData]);

  if (insertError) {
    console.error('Error inserting new employee:', insertError);
    return;
  }

  const { error: deleteError } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId);

  if (deleteError) {
    console.error('Error deleting promoted candidate:', deleteError);
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

export const updateEmployee = async (updatedEmployeeData: Employee): Promise<void> => {
  const { error } = await supabase
    .from('employees')
    .update(updatedEmployeeData)
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
