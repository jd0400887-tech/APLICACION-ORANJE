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
const EMPLOYEES_KEY = 'employees';
const CANDIDATES_KEY = 'candidates';
const PERSONNEL_REQUESTS_KEY = 'personnelRequests';
const HOTELS_KEY = 'hotels';
const INVENTORY_KEY = 'inventory';
const QA_INSPECTIONS_KEY = 'qaInspections';


// Initial Data getters
const getInitialEmployees = (): Employee[] => [
    {
        id: 999, name: 'David Admin', position: 'Administrator', status: 'Available', hotel: null,
        email: 'davidadmin@gmail.com', dob: '1990-01-01', phone: '555-0199', country: 'Adminland', state: 'Adminstate', city: 'Admincity', zip: 'A1DMIN', address: '123 Admin Street',
        imageUrl: 'https://randomuser.me/api/portraits/men/99.jpg', role: 'Admin', isBlacklisted: false
      },
];

const getInitialCandidates = (): Candidate[] => [
    {
        id: 201, name: 'Laura Torres', position: 'Recepcionista', email: 'laura.t@example.com',
        dob: '1995-02-20', phone: '555-0201', country: 'España', state: 'Madrid', city: 'Madrid', zip: '28001',
        address: 'Calle de Alcalá, 20', imageUrl: 'https://randomuser.me/api/portraits/women/68.jpg', isBlacklisted: false
      },
];

const getInitialPersonnelRequests = (): PersonnelRequest[] => [
  { id: 1, hotelName: 'Grand Hyatt', position: 'Recepcionista', quantity: 1, status: 'Pending' },
];

const getInitialHotels = (): Hotel[] => [
    { id: 1, name: 'Grand Hyatt', imageUrl: 'https://picsum.photos/seed/grandhyatt/600/400', status: 'Client', address: '123 Luxury Ave', city: 'New York', generalManager: 'John Smith', contact: '111-222-3333', email: 'contact@hyatt.com' },
];

const getInitialInventory = (): InventoryItem[] => [
  { id: 1, name: 'Pantalones', quantity: 50 },
  { id: 2, name: 'Camisas', quantity: 70 },
];

const getInitialQAInspections = (): QAInspection[] => [
  { id: 1, hotelName: 'Grand Hyatt', inspectorName: 'David Admin', date: '2024-07-28', area: 'Lobby', score: 8, comments: 'El lobby estaba limpio y ordenado.' },
  { id: 2, hotelName: 'Grand Hyatt', inspectorName: 'David Admin', date: '2024-07-28', area: 'Piscina', score: 6, comments: 'El área de la piscina necesita más atención.', employeeId: 201 },
];

// Data access functions
export const getEmployees = (): Employee[] => getFromLocalStorage(EMPLOYEES_KEY, getInitialEmployees);
export const getCandidates = (): Candidate[] => getFromLocalStorage(CANDIDATES_KEY, getInitialCandidates);
export const getPersonnelRequests = (): PersonnelRequest[] => getFromLocalStorage(PERSONNEL_REQUESTS_KEY, getInitialPersonnelRequests);
export const getHotels = (): Hotel[] => getFromLocalStorage(HOTELS_KEY, getInitialHotels);
export const getInventory = (): InventoryItem[] => getFromLocalStorage(INVENTORY_KEY, getInitialInventory);
export const getQAInspections = (): QAInspection[] => getFromLocalStorage(QA_INSPECTIONS_KEY, getInitialQAInspections);

// Data modification functions
export const addPersonnelRequest = (newRequestData: Omit<PersonnelRequest, 'id' | 'status'>): void => {
  const requests = getPersonnelRequests();
  const newRequest: PersonnelRequest = { ...newRequestData, id: Date.now(), status: 'Pending' };
  saveToLocalStorage(PERSONNEL_REQUESTS_KEY, [...requests, newRequest]);
};

export const assignEmployeeToHotel = (employeeId: number, hotelName: string): void => {
  const employees = getEmployees();
  const updatedEmployees = employees.map(emp =>
    emp.id === employeeId ? { ...emp, status: 'Assigned', hotel: hotelName } : emp
  );
  saveToLocalStorage(EMPLOYEES_KEY, updatedEmployees);
};

export const fulfillRequest = (requestId: number): void => {
    const requests = getPersonnelRequests();
    const updatedRequests = requests.map(req =>
        req.id === requestId ? { ...req, status: 'Fulfilled' } : req
    );
    saveToLocalStorage(PERSONNEL_REQUESTS_KEY, updatedRequests);
};

export const promoteCandidateToEmployee = (candidateId: number): void => {
  const candidates = getCandidates();
  const employees = getEmployees();
  const candidate = candidates.find(c => c.id === candidateId);
  if (!candidate || candidate.isBlacklisted) return;

  const newEmployee: Employee = { ...candidate, status: 'Available', hotel: null, role: 'Trabajador' };
  const newCandidates = candidates.filter(c => c.id !== candidateId);
  const newEmployees = [...employees, newEmployee];

  saveToLocalStorage(CANDIDATES_KEY, newCandidates);
  saveToLocalStorage(EMPLOYEES_KEY, newEmployees);
};

export const addHotel = (newHotelData: Omit<Hotel, 'id'>): void => {
  const hotels = getHotels();
  const newHotel: Hotel = { ...newHotelData, id: Date.now() };
  saveToLocalStorage(HOTELS_KEY, [...hotels, newHotel]);
};

export const updateHotelStatus = (hotelId: number): void => {
  const hotels = getHotels();
  const updatedHotels = hotels.map(hotel =>
    hotel.id === hotelId ? { ...hotel, status: 'Client' } : hotel
  );
  saveToLocalStorage(HOTELS_KEY, updatedHotels);
};

export const updateHotel = (updatedHotel: Hotel): void => {
  const hotels = getHotels();
  const updatedHotels = hotels.map(hotel =>
    hotel.id === updatedHotel.id ? updatedHotel : hotel
  );
  saveToLocalStorage(HOTELS_KEY, updatedHotels);
};

export const updateEmployee = (updatedEmployeeData: Employee): void => {
  const employees = getEmployees();
  const updatedEmployees = employees.map(emp =>
    emp.id === updatedEmployeeData.id ? { ...updatedEmployeeData } : emp
  );
  saveToLocalStorage(EMPLOYEES_KEY, updatedEmployees);
};

export const saveEmployees = (employees: Employee[]): void => {
    saveToLocalStorage(EMPLOYEES_KEY, employees);
};

export const deleteEmployee = (employeeId: number): void => {
  const employees = getEmployees();
  const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
  saveToLocalStorage(EMPLOYEES_KEY, updatedEmployees);
};

export const deleteHotel = (hotelId: number): void => {
  const hotels = getHotels();
  const updatedHotels = hotels.filter(hotel => hotel.id !== hotelId);
  saveToLocalStorage(HOTELS_KEY, updatedHotels);
};

export const updateInventory = (itemId: number, newQuantity: number): void => {
  const inventory = getInventory();
  const updatedInventory = inventory.map(item =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  );
  saveToLocalStorage(INVENTORY_KEY, updatedInventory);
};

export const assignUniformToEmployee = (employeeId: number, itemType: 'Pantalones' | 'Camisas'): { success: boolean; message: string } => {
  const employees = getEmployees();
  const inventory = getInventory();

  const employee = employees.find(e => e.id === employeeId);
  if (!employee) return { success: false, message: 'Empleado no encontrado.' };

  const inventoryItem = inventory.find(i => i.name === itemType);
  if (!inventoryItem) return { success: false, message: 'Ítem de inventario no encontrado.' };

  if (inventoryItem.quantity <= 0) return { success: false, message: `No hay ${itemType} en stock.` };

  // Decrement inventory
  const updatedInventory = inventory.map(i => 
    i.id === inventoryItem.id ? { ...i, quantity: i.quantity - 1 } : i
  );
  saveToLocalStorage(INVENTORY_KEY, updatedInventory);

  // Increment employee uniform count
  const updatedEmployees = employees.map(e => {
    if (e.id === employeeId) {
      const newUniforms = { ...e.uniforms };
      if (itemType === 'Pantalones') {
        newUniforms.pants = (newUniforms.pants || 0) + 1;
      } else {
        newUniforms.shirts = (newUniforms.shirts || 0) + 1;
      }
      return { ...e, uniforms: newUniforms };
    }
    return e;
  });
  saveToLocalStorage(EMPLOYEES_KEY, updatedEmployees);

  return { success: true, message: `Se asignó ${itemType} a ${employee.name}.` };
};

// QA Inspections CRUD
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
