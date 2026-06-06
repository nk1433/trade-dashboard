import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, IconButton, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const initialFormState = {
  bias: '',
  exploitPlan: '',
  alternativePlan: '',
  whatHappening: '',
  whyHappening: '',
  whatNext: '',
  tradingObjectives: '',
  whatCanIDo: '',
  winningCharacteristics: '',
  setupWorked: '',
  setupDidntWork: '',
  notes: ''
};

const SectionContainer = ({ title, children }) => (
  <Box sx={{ mb: 3, p: 2.5, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2, borderBottom: '1px solid #ccc', pb: 0.5 }}>
      {title}
    </Typography>
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Box>
);

const ViewSectionContainer = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', borderBottom: '1px solid #ccc', pb: 0.5, mb: 1.5 }}>
      {title}
    </Typography>
    <Grid container spacing={3}>
      {children}
    </Grid>
  </Box>
);

const SAInsights = () => {
  const [insights, setInsights] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const todayDate = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = useState(todayDate);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/market-breadth/sa-insights`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        setInsights(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch SA insights:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/market-breadth/sa-insights`, {
        ...formData,
        date: currentDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEditing(false);
      setFormData(initialFormState);
      setCurrentDate(todayDate);
      fetchInsights();
    } catch (error) {
      console.error('Failed to save SA insight:', error);
    }
  };

  const handleDelete = async (date) => {
    if (!window.confirm(`Are you sure you want to delete the insight for ${date}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${BACKEND_URL}/market-breadth/sa-insights/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInsights();
    } catch (error) {
      console.error('Failed to delete SA insight:', error);
    }
  };

  const handleEdit = (insight) => {
    setFormData({
      bias: insight.bias || '',
      exploitPlan: insight.exploitPlan || '',
      alternativePlan: insight.alternativePlan || '',
      whatHappening: insight.whatHappening || '',
      whyHappening: insight.whyHappening || '',
      whatNext: insight.whatNext || '',
      tradingObjectives: insight.tradingObjectives || '',
      whatCanIDo: insight.whatCanIDo || '',
      winningCharacteristics: insight.winningCharacteristics || '',
      setupWorked: insight.setupWorked || '',
      setupDidntWork: insight.setupDidntWork || '',
      notes: insight.notes || ''
    });
    setCurrentDate(insight.date);
    setIsEditing(true);
    // scroll to top
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setFormData(initialFormState);
    setCurrentDate(todayDate);
    setIsEditing(true);
  };

  const toggleRow = (date) => {
    setExpandedRowId(prev => prev === date ? null : date);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Paper sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, borderLeft: '4px solid #333', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
            Situational Awareness (SA) Insights
          </Typography>
          {!isEditing && (
            <Button
              variant="contained"
              onClick={handleCreateNew}
              size="small"
              sx={{ bgcolor: '#333', color: '#fff', '&:hover': { bgcolor: '#000' } }}
            >
              New Insight
            </Button>
          )}
        </Box>

        {isEditing && (
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <TextField
                label="Date"
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                sx={{ width: 200 }}
              />
            </Box>

            {/* 1. Situation */}
            <SectionContainer title="1. Situation">
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="What is happening in the market?" name="whatHappening" value={formData.whatHappening} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Why is it happening?" name="whyHappening" value={formData.whyHappening} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="What will happen next?" name="whatNext" value={formData.whatNext} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
            </SectionContainer>

            {/* 2. Risk */}
            <SectionContainer title="2. Risk">
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="What is my market bias today?" name="bias" value={formData.bias} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Is there a plan to exploit it?" name="exploitPlan" value={formData.exploitPlan} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Is there an alternative plan?" name="alternativePlan" value={formData.alternativePlan} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
            </SectionContainer>

            {/* 3. Process */}
            <SectionContainer title="3. Process">
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="What does it mean in terms of my trading objectives?" name="tradingObjectives" value={formData.tradingObjectives} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="What can I do about it?" name="whatCanIDo" value={formData.whatCanIDo} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
            </SectionContainer>

            {/* 4. Setups */}
            <SectionContainer title="4. Setup's">
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Winning characteristics" name="winningCharacteristics" value={formData.winningCharacteristics} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Setup which worked" name="setupWorked" value={formData.setupWorked} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth label="Setup which didn't work" name="setupDidntWork" value={formData.setupDidntWork} onChange={handleInputChange} multiline rows={3} variant="outlined" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Additional Notes" name="notes" value={formData.notes} onChange={handleInputChange} multiline rows={2} variant="outlined" />
              </Grid>
            </SectionContainer>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{ bgcolor: '#333', color: '#fff', '&:hover': { bgcolor: '#000' } }}
              >
                Save Insight
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(false)}
                sx={{ color: '#333', borderColor: '#333', '&:hover': { borderColor: '#000' } }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f4f4f5' }}>
                <TableCell width="50px" />
                <TableCell sx={{ fontWeight: 600, color: '#333' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#333' }}>Market Bias</TableCell>
                <TableCell width="120px" align="right" sx={{ fontWeight: 600, color: '#333' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {insights.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#666' }}>No insights recorded yet.</TableCell>
                </TableRow>
              )}
              {insights.map((insight) => (
                <React.Fragment key={insight.date}>
                  <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: expandedRowId === insight.date ? '#fafafa' : 'inherit' }}>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRow(insight.date)}>
                        {expandedRowId === insight.date ? <KeyboardArrowUpIcon sx={{ color: '#333' }} /> : <KeyboardArrowDownIcon sx={{ color: '#333' }} />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#333' }}>{insight.date}</TableCell>
                    <TableCell sx={{ color: '#555' }}>{insight.bias ? insight.bias.substring(0, 80) + (insight.bias.length > 80 ? '...' : '') : 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEdit(insight)} sx={{ color: '#666', '&:hover': { color: '#000' } }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(insight.date)} sx={{ color: '#666', '&:hover': { color: '#d32f2f' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                      <Collapse in={expandedRowId === insight.date} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2, p: 3, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0' }}>

                          <ViewSectionContainer title="1. Situation">
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>What is happening in the market?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.whatHappening || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Why is it happening?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.whyHappening || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>What will happen next?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.whatNext || '-'}</Typography>
                            </Grid>
                          </ViewSectionContainer>

                          <ViewSectionContainer title="2. Risk">
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>What is my market bias today?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.bias || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Is there a plan to exploit it?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.exploitPlan || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Is there an alternative plan?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.alternativePlan || '-'}</Typography>
                            </Grid>
                          </ViewSectionContainer>

                          <ViewSectionContainer title="3. Process">
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Trading Objectives Impact</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.tradingObjectives || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>What can I do about it?</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.whatCanIDo || '-'}</Typography>
                            </Grid>
                          </ViewSectionContainer>

                          <ViewSectionContainer title="4. Setup's">
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Winning characteristics</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.winningCharacteristics || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Setup which worked</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.setupWorked || '-'}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Setup which didn't work</Typography>
                              <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333' }}>{insight.setupDidntWork || '-'}</Typography>
                            </Grid>
                            {insight.notes && (
                              <Grid item xs={12}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>Notes</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#333' }}>{insight.notes}</Typography>
                              </Grid>
                            )}
                          </ViewSectionContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default SAInsights;
