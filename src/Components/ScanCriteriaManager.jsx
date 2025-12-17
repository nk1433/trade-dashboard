import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { BACKEND_URL } from '../utils/config';
import { useSelector } from 'react-redux';

const ScanCriteriaManager = () => {
    const [criteriaList, setCriteriaList] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentCriteria, setCurrentCriteria] = useState({ name: '', description: '', criteria: '{}' });
    const [isEditing, setIsEditing] = useState(false);
    const appToken = localStorage.getItem('token');

    useEffect(() => {
        fetchCriteria();
    }, []);

    const fetchCriteria = async () => {
        if (!appToken) return;
        try {
            const response = await axios.get(`${BACKEND_URL}/scans/criteria`, {
                headers: { Authorization: `Bearer ${appToken}` }
            });
            if (response.data.success) {
                setCriteriaList(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching criteria:", error);
        }
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...currentCriteria,
                criteria: JSON.parse(currentCriteria.criteria)
            };

            if (isEditing) {
                await axios.put(`${BACKEND_URL}/scans/criteria/${currentCriteria._id}`, payload, {
                    headers: { Authorization: `Bearer ${appToken}` }
                });
            } else {
                await axios.post(`${BACKEND_URL}/scans/criteria`, payload, {
                    headers: { Authorization: `Bearer ${appToken}` }
                });
            }
            setOpenDialog(false);
            fetchCriteria();
        } catch (error) {
            console.error("Error saving criteria:", error);
            alert("Invalid JSON or Server Error");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await axios.delete(`${BACKEND_URL}/scans/criteria/${id}`, {
                headers: { Authorization: `Bearer ${appToken}` }
            });
            fetchCriteria();
        } catch (error) {
            console.error("Error deleting criteria:", error);
        }
    };

    const openEdit = (item) => {
        setCurrentCriteria({ ...item, criteria: JSON.stringify(item.criteria, null, 2) });
        setIsEditing(true);
        setOpenDialog(true);
    };

    const openNew = () => {
        setCurrentCriteria({ name: '', description: '', criteria: '{\n  "condition": "AND",\n  "rules": [\n    { "field": "close", "operator": ">", "value": "open" }\n  ]\n}' });
        setIsEditing(false);
        setOpenDialog(true);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">Scan Criteria Manager</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
                    New Criteria
                </Button>
            </Box>

            <List>
                {criteriaList.map((item) => (
                    <Paper key={item._id} sx={{ mb: 2, p: 2 }}>
                        <ListItem
                            secondaryAction={
                                <Box>
                                    <IconButton onClick={() => openEdit(item)}><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDelete(item._id)}><DeleteIcon /></IconButton>
                                </Box>
                            }
                        >
                            <ListItemText
                                primary={item.name}
                                secondary={item.description}
                            />
                        </ListItem>
                        <Typography variant="body2" component="pre" sx={{ bgcolor: '#f5f5f5', p: 1, borderRadius: 1, overflowX: 'auto' }}>
                            {JSON.stringify(item.criteria, null, 2)}
                        </Typography>
                    </Paper>
                ))}
            </List>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Criteria' : 'New Criteria'}</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        fullWidth
                        margin="normal"
                        value={currentCriteria.name}
                        onChange={(e) => setCurrentCriteria({ ...currentCriteria, name: e.target.value })}
                    />
                    <TextField
                        label="Description"
                        fullWidth
                        margin="normal"
                        value={currentCriteria.description}
                        onChange={(e) => setCurrentCriteria({ ...currentCriteria, description: e.target.value })}
                    />
                    <TextField
                        label="Criteria (JSON)"
                        fullWidth
                        multiline
                        rows={10}
                        margin="normal"
                        value={currentCriteria.criteria}
                        onChange={(e) => setCurrentCriteria({ ...currentCriteria, criteria: e.target.value })}
                        helperText="Define rules in JSON format. Example: { 'condition': 'AND', 'rules': [{ 'field': 'close', 'operator': '>', 'value': 'open' }] }"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ScanCriteriaManager;
