
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Select, MenuItem, FormControl, InputLabel,
  List, ListItem, ListItemText, Checkbox, Button
} from '@mui/material';
import { getPermissions, savePermissions, getRoles, getAllModules, RolePermissions } from '../data/permissions';

const PermissionsDashboard: React.FC = () => {
  const [permissions, setPermissions] = useState<RolePermissions>(getPermissions());
  const [selectedRole, setSelectedRole] = useState<string>('Admin');
  const roles = getRoles();
  const allModules = getAllModules();

  const handleRoleChange = (event: any) => {
    setSelectedRole(event.target.value as string);
  };

  const handlePermissionChange = (moduleId: string) => {
    const newPermissions = { ...permissions };
    const rolePermissions = newPermissions[selectedRole];
    const modulePermission = rolePermissions.find(p => p.id === moduleId);
    if (modulePermission) {
      modulePermission.enabled = !modulePermission.enabled;
      setPermissions(newPermissions);
    }
  };

  const handleSaveChanges = () => {
    savePermissions(permissions);
    alert('Permissions saved!');
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Manage Permissions
      </Typography>
      <Paper elevation={3} sx={{ p: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select value={selectedRole} label="Role" onChange={handleRoleChange}>
            {roles.map(role => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <List>
          {allModules.map(module => (
            <ListItem key={module.id}>
              <ListItemText primary={module.name} />
              <Checkbox
                checked={permissions[selectedRole]?.find(p => p.id === module.id)?.enabled || false}
                onChange={() => handlePermissionChange(module.id)}
              />
            </ListItem>
          ))}
        </List>
        <Button variant="contained" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </Paper>
    </Container>
  );
};

export default PermissionsDashboard;
