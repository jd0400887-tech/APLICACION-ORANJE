import React, { useState, useEffect } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { useThemeContext } from '../context/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {
  AppBar as MuiAppBar, Toolbar, Typography, Drawer as MuiDrawer, List, ListItem, ListItemIcon, ListItemText, Box, CssBaseline, IconButton, Menu, MenuItem, ListItemButton, Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import HotelIcon from '@mui/icons-material/HotelOutlined';
import PersonAddIcon from '@mui/icons-material/PersonAddOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InventoryIcon from '@mui/icons-material/InventoryOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoneyOutlined';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import PeopleIcon from '@mui/icons-material/People';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import HotelManagement from './HotelManagement';
import HotelDashboard from './HotelDashboard';
import RecruitmentDashboard from './RecruitmentDashboard';
import CandidatesDashboard from './CandidatesDashboard';
import CollaboratorsDashboard from './CollaboratorsDashboard';
import DashboardContent from './DashboardContent';
import EmpleadoDashboard from './EmpleadoDashboard';
import UserProfile from './UserProfile';
import PermissionsDashboard from './PermissionsDashboard';
import NominaDashboard from './NominaDashboard';
import InventoryDashboard from './InventoryDashboard';
import QADashboard from './QADashboard';
import ProspectDashboard from './ProspectDashboard';
import ChangePasswordForm from './ChangePasswordForm';
import BusinessDeveloper from '../pages/BusinessDeveloper';
import Coordinator from '../pages/Coordinator';
import TechnicalSupport from '../pages/TechnicalSupport';
import AnimatedBackground from './AnimatedBackground'; // Import the new component
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { QAProvider } from '../context/QAContext';
import {
  getHotels, getEmployees, getCandidates, getPersonnelRequests,
  addHotel as dbAddHotel, addPersonnelRequest as dbAddPersonnelRequest,
  assignEmployeeToHotel as dbAssignEmployeeToHotel, fulfillRequest as dbFulfillRequest,
  promoteCandidateToEmployee as dbPromoteCandidate, updateHotelStatus as dbUpdateHotelStatus,
  updateEmployee as dbUpdateEmployee,   deleteEmployee as dbDeleteEmployee, PersonnelRequest, Employee, Candidate, Hotel,
  QAInspection, getQAInspections, addQAInspection, updateQAInspection, deleteQAInspection, deleteHotel, promoteCandidateAndCreateUser,
} from '../data/database';
import { getPermissions } from '../data/permissions';
import { getDisplayImage } from '../utils/imageUtils';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isEmployeeOnly' })<{open?: boolean; isEmployeeOnly: boolean;}>
(({ theme, open, isEmployeeOnly }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: 'none',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && !isEmployeeOnly && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(isEmployeeOnly && {
    width: '100%',
    marginLeft: 0,
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isEmployeeOnly' })<{open?: boolean; isEmployeeOnly: boolean;}>
(({ theme, open, isEmployeeOnly }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  height: '100vh',
  overflow: 'auto',
  position: 'relative', // Keep this for positioning the background
  backgroundColor: theme.palette.background.default, // Use theme background color
  ...(open && !isEmployeeOnly && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  ...(isEmployeeOnly && {
    marginLeft: 0,
  }),
}));

const AuthenticatedAppContent: React.FC = () => {
  const { currentUser, logout, refreshCurrentUser } = useAuth();
  const { showNotification } = useNotification();
  const { toggleColorMode, mode } = useThemeContext();
  const theme = useTheme();

  const [selectedModule, setSelectedModule] = useState('Dashboard');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>([]); // Initialize as empty, fetch in useEffect
  const [personnelRequests, setPersonnelRequests] = useState<PersonnelRequest[]>([]); // Initialize as empty, fetch in useEffect
  const [candidates, setCandidates] = useState<Candidate[]>([]); // Initialize as empty, fetch in useEffect
  const [hotels, setHotels] = useState<Hotel[]>([]); // Initialize as empty, fetch in useEffect

  useEffect(() => {
    const fetchData = async () => {
      const hotelsData = await getHotels();
      setHotels(hotelsData);
      const employeesData = await getEmployees();
      setEmployees(employeesData);
      const candidatesData = await getCandidates();
      setCandidates(candidatesData);
      const requestsData = await getPersonnelRequests();
      setPersonnelRequests(requestsData);
    };
    fetchData();
  }, []);
  const [qaInspections, setQaInspections] = useState<QAInspection[]>(getQAInspections());

  const handleUserMenu = (event: any) => setUserMenuAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchorEl(null);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };
  
  const handleProfile = () => {
    setSelectedModule('Profile');
    handleUserMenuClose();
  };

  const handleChangePassword = () => {
    setSelectedModule('ChangePassword');
    handleUserMenuClose();
  };

  const handlePermissions = () => {
    setSelectedModule('Permissions');
    handleUserMenuClose();
  };

  // ... (data handling functions remain the same)
  const handleAddNewRequest = async (newRequestData: { hotel_id: number; position: string; quantity: number; }) => {
    await dbAddPersonnelRequest(newRequestData);
    const updatedRequests = await getPersonnelRequests();
    setPersonnelRequests(updatedRequests);
    showNotification('Solicitud de personal creada con éxito', 'success');
  };

  const handleAssignEmployee = async (employeeId: number, hotelName: string) => {
    await dbAssignEmployeeToHotel(employeeId, hotelName);
    const updatedEmployees = await getEmployees();
    setEmployees(updatedEmployees);
    showNotification('Empleado asignado correctamente', 'success');
  };

  const handleFulfillRequest = async (requestId: number) => {
    await dbFulfillRequest(requestId);
    const updatedRequests = await getPersonnelRequests();
    setPersonnelRequests(updatedRequests);
    showNotification('Solicitud completada', 'success');
  };

  const handlePromoteCandidate = async (candidateId: number) => {
    const result = await promoteCandidateAndCreateUser(candidateId);
    if (result.success) {
      const updatedCandidates = await getCandidates();
      setCandidates(updatedCandidates);
      const updatedEmployees = await getEmployees();
      setEmployees(updatedEmployees);
      showNotification(`Candidato promovido a empleado y usuario creado. Usuario: ${result.email}, Contraseña: ${result.password}`, 'success');
    } else {
      showNotification(`Error al promover candidato: ${result.error}`, 'error');
    }
  };

  const handleAddNewHotel = async (newHotelData: Omit<Hotel, 'id' | 'user_id'>) => {
    await dbAddHotel(newHotelData);
    const updatedHotels = await getHotels();
    setHotels(updatedHotels);
    showNotification('Hotel añadido con éxito', 'success');
  };

  const handleUpdateHotelStatus = async (hotelId: number, status: 'Client' | 'Prospect') => {
    await dbUpdateHotelStatus(hotelId, status);
    const updatedHotels = await getHotels();
    setHotels(updatedHotels);
    showNotification('El estado del hotel ha sido actualizado', 'success');
  };

  const handleDeleteHotel = async (hotelId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este hotel?')) {
      await deleteHotel(hotelId);
      const updatedHotels = await getHotels();
      setHotels(updatedHotels);
      showNotification('Hotel eliminado con éxito', 'success');
    }
  };

  const handleHotelUpdated = async (updatedHotel: Hotel) => {
    const updatedHotels = await getHotels();
    setHotels(updatedHotels);
    const refreshedHotel = updatedHotels.find(h => h.id === updatedHotel.id) || null;
    setSelectedHotel(refreshedHotel);
    showNotification('Hotel actualizado con éxito', 'success');
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    await dbUpdateEmployee(updatedEmployee);
    const updatedEmployees = await getEmployees();
    setEmployees(updatedEmployees);
    showNotification('Empleado actualizado con éxito', 'success');
    await refreshCurrentUser(); // Refresh the user in the auth context
  };

  const handleDeleteEmployee = async (employeeId: number) => {
    await dbDeleteEmployee(employeeId);
    const updatedEmployees = await getEmployees();
    setEmployees(updatedEmployees);
    showNotification('Empleado eliminado con éxito', 'success');
  };

  const handleRefreshEmployees = async () => {
    const updatedEmployees = await getEmployees();
    setEmployees(updatedEmployees);
  };

  const handleAddInspection = (data: Omit<QAInspection, 'id'>) => {
    addQAInspection(data);
    setQaInspections(getQAInspections());
    showNotification('Inspección añadida con éxito', 'success');
  };

  const handleUpdateInspection = (data: QAInspection) => {
    updateQAInspection(data);
    setQaInspections(getQAInspections());
    showNotification('Inspección actualizada con éxito', 'success');
  };

  const handleDeleteInspection = (id: number) => {
    deleteQAInspection(id);
    setQaInspections(getQAInspections());
    showNotification('Inspección eliminada con éxito', 'success');
  };

  const getMenuItems = (role: string) => {
    const permissions = getPermissions();
    const rolePermissions = permissions[role] || [];
    const allMenuItems = [
        { id: 'Dashboard', text: 'Dashboard', icon: <DashboardIcon /> },
        { id: 'Business Developer', text: 'Business Developer', icon: <BusinessCenterIcon /> },
        { id: 'Coordinador', text: 'Coordinador', icon: <PeopleIcon /> },
        { id: 'Soporte Técnico', text: 'Soporte Técnico', icon: <SupportAgentIcon /> },
        { id: 'Hotel Mg', text: 'Hotel Mg', icon: <HotelIcon /> },
        { id: 'Reclutamiento', text: 'Reclutamiento', icon: <PersonAddIcon /> },
        { id: 'Candidatos', text: 'Candidatos', icon: <GroupIcon /> },
        { id: 'Colaboradores', text: 'Colaboradores', icon: <GroupIcon /> },
        { id: 'QA Inspectores', text: 'QA Inspectores', icon: <CheckCircleOutlineIcon /> },
        { id: 'Inventarios', text: 'Inventarios', icon: <InventoryIcon /> },
        { id: 'Nómina', text: 'Nómina', icon: <AttachMoneyIcon /> },
        { id: 'Empleado', text: 'Empleado', icon: <DashboardIcon /> },
    ];

    return allMenuItems.filter(item => {
        const permission = rolePermissions.find(p => p.id === item.id);
        return permission && permission.enabled;
    });
  };

  const menuItems = getMenuItems(currentUser.role);
  const isEmployeeOnly = menuItems.length === 1 && menuItems[0].id === 'Empleado';

  // Nuevo useEffect para manejar el caso isEmployeeOnly
  useEffect(() => {
    if (isEmployeeOnly && selectedModule !== 'Empleado') {
      setSelectedModule('Empleado');
    } else if (!isEmployeeOnly && selectedModule === 'Empleado' && menuItems.length > 0) {
      // Si ya no es solo empleado y el módulo seleccionado es 'Empleado',
      // pero hay otros módulos disponibles, redirigir al primer módulo disponible
      setSelectedModule(menuItems[0].id);
    } else if (!isEmployeeOnly && selectedModule === 'Empleado' && menuItems.length === 0) {
      // Si no hay módulos disponibles (ej. logout o error de permisos)
      setSelectedModule('Dashboard'); // O alguna otra página por defecto
    }
  }, [isEmployeeOnly, selectedModule, menuItems, currentUser]); // Dependencias

  const renderContent = () => {
    switch (selectedModule) {
      case 'Business Developer':
        return <BusinessDeveloper />;
      case 'Coordinador':
        return <Coordinator />;
      case 'Soporte Técnico':
        return <TechnicalSupport />;
      case 'Hotel Mg':
        if (selectedHotel) {
          return selectedHotel.status === 'Client' ? (
            <HotelDashboard hotel={selectedHotel} onBack={() => setSelectedHotel(null)} employees={employees} onAddNewRequest={handleAddNewRequest} onHotelUpdated={handleHotelUpdated} />
          ) : (
            <ProspectDashboard hotel={selectedHotel} onBack={() => setSelectedHotel(null)} onDeleteHotel={handleDeleteHotel} />
          );
        } else {
          return <HotelManagement hotels={hotels} onSelectHotel={setSelectedHotel} onAddNewHotel={handleAddNewHotel} onDeleteHotel={handleDeleteHotel} onUpdateStatus={handleUpdateHotelStatus} />;
        }
      case 'Reclutamiento':
        return <RecruitmentDashboard requests={personnelRequests} employees={employees} onAssignEmployee={handleAssignEmployee} onFulfillRequest={handleFulfillRequest} onEmployeeListRefresh={() => setEmployees(getEmployees())} />;
      case 'Candidatos':
        return <CandidatesDashboard candidates={candidates} onPromoteCandidateWithCredentials={handlePromoteCandidate} />; 
      case 'Colaboradores':
        return <CollaboratorsDashboard employees={employees} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} onRefreshEmployees={handleRefreshEmployees} />;
      case 'QA Inspectores':
        return (
          <QAProvider>
            <QADashboard inspections={qaInspections} employees={employees} hotels={hotels} currentUser={currentUser} onAddInspection={handleAddInspection} onUpdateInspection={handleUpdateInspection} onDeleteInspection={handleDeleteInspection} />
          </QAProvider>
        );
      case 'Empleado':
        return <EmpleadoDashboard />;
      case 'Profile':
        return <UserProfile onUpdateEmployee={handleUpdateEmployee} />;
      case 'ChangePassword':
        return <ChangePasswordForm />;
      case 'Permissions':
        return <PermissionsDashboard />;
      case 'Nómina':
        return <NominaDashboard currentUser={currentUser} hotels={hotels} />;
      case 'Inventarios':
        return <InventoryDashboard />;
      default:
        return <DashboardContent hotels={hotels} employees={employees} personnelRequests={personnelRequests} candidates={candidates} />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" open={drawerOpen && !isEmployeeOnly} isEmployeeOnly={isEmployeeOnly}>
          <Toolbar sx={{ minHeight: '56px' }}>
            {!isEmployeeOnly && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2, ...(drawerOpen && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} /> {/* This empty box will push the following items to the right */}
          <IconButton color="inherit" onClick={toggleColorMode}> {/* ADD THIS BUTTON */}
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton color="inherit" onClick={handleUserMenu}>
            <Avatar src={getDisplayImage(currentUser.image_url, 'person')} sx={{ width: 32, height: 32 }}/>
          </IconButton>
            <Menu
              anchorEl={userMenuAnchorEl}
              open={Boolean(userMenuAnchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
              <MenuItem onClick={handleChangePassword}>Cambiar Contraseña</MenuItem>
              {currentUser.role === 'Admin' && (
                <MenuItem onClick={handlePermissions}>Permissions</MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        {!isEmployeeOnly && (
        <MuiDrawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              background: `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.action.hover})`,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: `1px 0px 8px -1px ${theme.palette.primary.main}`,
            },
          }}
          variant="persistent"
          anchor="left"
          open={drawerOpen}
        >
          <DrawerHeader sx={{ justifyContent: 'space-between', pl: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecordIcon sx={{ color: 'primary.main', fontSize: '1.6rem', filter: `drop-shadow(0 0 6px ${theme.palette.primary.main})`, mr: 0.5 }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: '2.5px' }}>
                RANJ
              </Typography>
              <Typography variant="h5" sx={{ color: 'primary.main', filter: `drop-shadow(0 0 5px ${theme.palette.primary.main})`, letterSpacing: '2.5px' }}>
                E
              </Typography>
            </Box>
            <IconButton onClick={handleDrawerToggle}>
               <MenuIcon />
            </IconButton>
          </DrawerHeader>
          <Box sx={{
            overflow: 'auto',
            p: 1,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255, 140, 0, 0.5)',
              borderRadius: '3px',
              transition: 'background-color 0.3s',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              backgroundColor: 'rgba(255, 140, 0, 0.8)',
            },
          }}>
            <List>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.id}
                  onClick={() => setSelectedModule(item.id)}
                  selected={selectedModule === item.id}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    padding: '10px 16px',
                    color: theme.palette.text.secondary,
                    backgroundColor: 'transparent',
                    transition: 'all 0.3s ease-in-out',
                    '& .MuiListItemIcon-root': {
                      transition: 'color 0.3s ease-in-out',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 140, 0, 0.08)',
                      color: theme.palette.text.primary,
                      transform: 'scale(1.02)',
                      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                    },
                    '&.Mui-selected': {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      color: theme.palette.primary.contrastText,
                      boxShadow: `0px 6px 25px -5px ${theme.palette.primary.main}`,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.contrastText,
                      },
                      '& .MuiListItemText-primary': {
                        fontWeight: '600',
                      },
                      '&:hover': {
                        background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        boxShadow: `0px 8px 30px -6px ${theme.palette.primary.main}`,
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ whiteSpace: 'normal' }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </MuiDrawer>
        )}
        <Main open={drawerOpen && !isEmployeeOnly} isEmployeeOnly={isEmployeeOnly}>
          <AnimatedBackground />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <DrawerHeader />
            {renderContent()}
          </Box>
        </Main>
      </Box>
    );
};

export default AuthenticatedAppContent;