
export interface ModulePermission {
  id: string;
  name: string;
  enabled: boolean;
}

export interface RolePermissions {
  [role: string]: ModulePermission[];
}

const allModules = [
  { id: 'Dashboard', name: 'Dashboard' },
  { id: 'Business Developer', name: 'Business Developer' },
  { id: 'Coordinador', name: 'Coordinador' },
  { id: 'Soporte Técnico', name: 'Soporte Técnico' },
  { id: 'Hotel Mg', name: 'Hotel Mg' },
  { id: 'Reclutamiento', name: 'Reclutamiento' },
  { id: 'Candidatos', name: 'Candidatos' },
  { id: 'Colaboradores', name: 'Colaboradores' },
  { id: 'QA Inspectores', name: 'QA Inspectores' },
  { id: 'Inventarios', name: 'Inventarios' },
  { id: 'Nómina', name: 'Nómina' },
  { id: 'Empleado', name: 'Empleado' },
  { id: 'Permissions', name: 'Permissions' },
];

const defaultPermissions: RolePermissions = {
  'Admin': allModules.map(m => ({ ...m, enabled: true })),
  'Hotel Manager': allModules.map(m => ({ ...m, enabled: ['Dashboard', 'Hotel Mg', 'Colaboradores', 'Inventarios'].includes(m.id) })),
  'Reclutador': allModules.map(m => ({ ...m, enabled: ['Reclutamiento', 'Candidatos'].includes(m.id) })),
  'QA Inspector': allModules.map(m => ({ ...m, enabled: ['QA Inspectores'].includes(m.id) })),
  'Contador': allModules.map(m => ({ ...m, enabled: ['Dashboard', 'Nómina'].includes(m.id) })),
  'Trabajador': allModules.map(m => ({ ...m, enabled: m.id === 'Empleado' })),
};

export const getPermissions = (): RolePermissions => {
  const storedPermissions = localStorage.getItem('rolePermissions');
  if (storedPermissions) {
    return JSON.parse(storedPermissions);
  }
  return defaultPermissions;
};

export const savePermissions = (permissions: RolePermissions) => {
  localStorage.setItem('rolePermissions', JSON.stringify(permissions));
};

export const getRoles = (): string[] => {
    return ['Admin', 'Hotel Manager', 'Reclutador', 'QA Inspector', 'Contador', 'Trabajador'];
}

export const getAllModules = () => {
    return allModules;
}
