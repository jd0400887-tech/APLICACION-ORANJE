import React, { useState, useEffect } from 'react';
import { ThemeProvider, styled } from '@mui/material/styles';
import theme from './theme';
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
import HotelManagement from './components/HotelManagement';
import HotelDashboard from './components/HotelDashboard';
import RecruitmentDashboard from './components/RecruitmentDashboard';
import CandidatesDashboard from './components/CandidatesDashboard';
import CollaboratorsDashboard from './components/CollaboratorsDashboard';
import DashboardContent from './components/DashboardContent';
import EmpleadoDashboard from './components/EmpleadoDashboard';
import UserProfile from './components/UserProfile';
import LoginPage from './components/LoginPage';
import PermissionsDashboard from './components/PermissionsDashboard';
import NominaDashboard from './components/NominaDashboard';
import InventoryDashboard from './components/InventoryDashboard';
import QADashboard from './components/QADashboard';
import { useAuth } from './context/AuthContext';
import { useNotification } from './context/NotificationContext';
import { QAProvider } from './context/QAContext';
import {
  getHotels, getEmployees, getCandidates, getPersonnelRequests,
  addHotel as dbAddHotel, addPersonnelRequest as dbAddPersonnelRequest,
  assignEmployeeToHotel as dbAssignEmployeeToHotel, fulfillRequest as dbFulfillRequest,
  promoteCandidateToEmployee as dbPromoteCandidate, updateHotelStatus as dbUpdateHotelStatus,
  updateEmployee as dbUpdateEmployee,   deleteEmployee as dbDeleteEmployee, PersonnelRequest, Employee, Candidate, Hotel,
  QAInspection, getQAInspections, addQAInspection, updateQAInspection, deleteQAInspection,
} from './data/database';
import { getPermissions } from './data/permissions';
import { getDisplayImage } from './utils/imageUtils';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== 'open' })<{open?: boolean;}>
(({ theme, open }) => ({
  backgroundColor: '#FF9800',
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{open?: boolean;}>
(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  height: '100vh',
  overflow: 'auto',
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

function App() {
  const { currentUser, logout } = useAuth();
  const { showNotification } = useNotification();
  if (!currentUser) {
    return <LoginPage />;
  }
  const [selectedModule, setSelectedModule] = useState('Dashboard');
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [employees, setEmployees] = useState<Employee[]>(getEmployees());
  const [personnelRequests, setPersonnelRequests] = useState<PersonnelRequest[]>(getPersonnelRequests());
  const [candidates, setCandidates] = useState<Candidate[]>(getCandidates());
  const [hotels, setHotels] = useState<Hotel[]>(getHotels());
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

  const handlePermissions = () => {
    setSelectedModule('Permissions');
    handleUserMenuClose();
  };

  // ... (data handling functions remain the same)
  const handleAddNewRequest = (newRequestData: Omit<PersonnelRequest, 'id' | 'status'>) => {
    dbAddPersonnelRequest(newRequestData);
    setPersonnelRequests(getPersonnelRequests());
    showNotification('Solicitud de personal creada con éxito', 'success');
  };

  const handleAssignEmployee = (employeeId: number, hotelName: string) => {
    dbAssignEmployeeToHotel(employeeId, hotelName);
    setEmployees(getEmployees());
    showNotification('Empleado asignado correctamente', 'success');
  };

  const handleFulfillRequest = (requestId: number) => {
    dbFulfillRequest(requestId);
    setPersonnelRequests(getPersonnelRequests());
    showNotification('Solicitud completada', 'success');
  };

  const handlePromoteCandidate = (candidateId: number) => {
    dbPromoteCandidate(candidateId);
    setCandidates(getCandidates());
    setEmployees(getEmployees());
    showNotification('Candidato promovido a empleado', 'success');
  };

  const handleAddNewHotel = (newHotelData: Omit<Hotel, 'id'>) => {
    dbAddHotel(newHotelData);
    setHotels(getHotels());
    showNotification('Hotel añadido con éxito', 'success');
  };

  const handleUpdateHotelStatus = (hotelId: number) => {
    dbUpdateHotelStatus(hotelId);
    setHotels(getHotels());
    showNotification('El estado del hotel ha sido actualizado', 'success');
  };

  const handleHotelUpdated = (updatedHotel: Hotel) => {
    setHotels(getHotels());
    setSelectedHotel(updatedHotel);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
    dbUpdateEmployee(updatedEmployee);
    setEmployees(getEmployees());
    showNotification('Empleado actualizado con éxito', 'success');
  };

  const handleDeleteEmployee = (employeeId: number) => {
    dbDeleteEmployee(employeeId);
    setEmployees(getEmployees());
    showNotification('Empleado eliminado con éxito', 'success');
  };

  const handleRefreshEmployees = () => {
    setEmployees(getEmployees());
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
      case 'Hotel Mg':
        return selectedHotel ? (
          <HotelDashboard hotel={selectedHotel} onBack={() => setSelectedHotel(null)} employees={employees} onAddNewRequest={handleAddNewRequest} onHotelUpdated={handleHotelUpdated} />
        ) : (
          <HotelManagement hotels={hotels} onSelectHotel={setSelectedHotel} onAddNewHotel={handleAddNewHotel} />
        );
      case 'Reclutamiento':
        return <RecruitmentDashboard requests={personnelRequests} employees={employees} onAssignEmployee={handleAssignEmployee} onFulfillRequest={handleFulfillRequest} onEmployeeListRefresh={() => setEmployees(getEmployees())} />;
      case 'Candidatos':
        return <CandidatesDashboard candidates={candidates} onPromoteCandidate={handlePromoteCandidate} />;
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
        return <UserProfile />;
      case 'Permissions':
        return <PermissionsDashboard />;
      case 'Nómina':
        return <NominaDashboard />;
      case 'Inventarios':
        return <InventoryDashboard />;
      default:
        return <DashboardContent hotels={hotels} employees={employees} personnelRequests={personnelRequests} candidates={candidates} />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="fixed" open={drawerOpen && !isEmployeeOnly}>
          <Toolbar>
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
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#FFFFFF' }}>
              Hotel Manager PWA
            </Typography>
            <IconButton color="inherit" onClick={handleUserMenu}>
              <Avatar src={getDisplayImage(currentUser.imageUrl, 'person')} sx={{ width: 32, height: 32 }}/>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchorEl}
              open={Boolean(userMenuAnchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleProfile}>Profile</MenuItem>
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
              backgroundColor: '#FF9800',
            },
          }}
          variant="persistent"
          anchor="left"
          open={drawerOpen}
        >
          <DrawerHeader>
            <IconButton onClick={handleDrawerToggle}>
               <MenuIcon />
            </IconButton>
          </DrawerHeader>
          <Box sx={{ overflow: 'auto', p: 1 }}>
            <List>
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  onClick={() => setSelectedModule(item.text)}
                  selected={selectedModule === item.text}
                  sx={{
                    borderRadius: '12px',
                    mb: 1,
                    color: 'black',
                    backgroundColor: selectedModule === item.text ? '#e0e0e0' : 'white',
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#e0e0e0',
                      '&:hover': {
                        backgroundColor: '#d5d5d5',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'black' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} sx={{ textTransform: 'uppercase' }} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </MuiDrawer>
        )}
        <Main open={drawerOpen && !isEmployeeOnly}>
          <DrawerHeader />
          {renderContent()}
        </Main>
      </Box>
    </ThemeProvider>
  );
}

export default App;