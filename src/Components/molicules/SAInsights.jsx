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

const INSIGHT_FIELDS = [
  {
    group: '1. Situation', fields: [
      { key: 'whatHappening', label: 'What is happening in the market?' },
      { key: 'whyHappening', label: 'Why is it happening?' },
      { key: 'whatNext', label: 'What will happen next?' },
    ]
  },
  {
    group: '2. Risk', fields: [
      { key: 'bias', label: 'What is my market bias today?' },
      { key: 'exploitPlan', label: 'Is there a plan to exploit it?' },
      { key: 'alternativePlan', label: 'Is there an alternative plan?' },
    ]
  },
  {
    group: '3. Process', fields: [
      { key: 'tradingObjectives', label: 'What does it mean in terms of my trading objectives?' },
      { key: 'whatCanIDo', label: 'What can I do about it?' },
    ]
  },
  {
    group: '4. Setup\'s', fields: [
      { key: 'winningCharacteristics', label: 'Winning characteristics' },
      { key: 'setupWorked', label: 'Setup which worked' },
      { key: 'setupDidntWork', label: 'Setup which didn\'t work' },
      { key: 'notes', label: 'Additional Notes' },
    ]
  }
];

const SAInsights = () => {
  const [insights, setInsights] = useState([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [activeField, setActiveField] = useState('whatHappening');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

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
    setActiveField('whatHappening');
    setIsPreviewMode(false);
    // scroll to top
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleCreateNew = () => {
    setFormData(initialFormState);
    setCurrentDate(todayDate);
    setIsEditing(true);
    setActiveField('whatHappening');
    setIsPreviewMode(false);
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
          <Box sx={{ mb: 5, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <TextField
                label="Date"
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
                size="small"
                sx={{ width: 200 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={!isPreviewMode ? 'contained' : 'outlined'}
                  onClick={() => setIsPreviewMode(false)}
                  sx={{ bgcolor: !isPreviewMode ? '#333' : 'transparent', color: !isPreviewMode ? '#fff' : '#333', borderColor: '#333', '&:hover': { bgcolor: !isPreviewMode ? '#000' : 'rgba(0,0,0,0.05)' } }}
                >
                  Edit
                </Button>
                <Button
                  variant={isPreviewMode ? 'contained' : 'outlined'}
                  onClick={() => setIsPreviewMode(true)}
                  sx={{ mr: 2, bgcolor: isPreviewMode ? '#333' : 'transparent', color: isPreviewMode ? '#fff' : '#333', borderColor: '#333', '&:hover': { bgcolor: isPreviewMode ? '#000' : 'rgba(0,0,0,0.05)' } }}
                >
                  Review
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  sx={{ color: '#333', borderColor: '#333', '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.05)' } }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{ bgcolor: '#333', color: '#fff', '&:hover': { bgcolor: '#000' }, px: 3 }}
                >
                  Save Insight
                </Button>
              </Box>
            </Box>

            {!isPreviewMode ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                {/* Left Sidebar: Field Selection Menu */}
                <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0, borderRight: { md: '1px solid #e0e0e0' }, pr: { md: 2 } }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>Select a topic to focus on:</Typography>
                  {INSIGHT_FIELDS.map((group) => (
                    <Box key={group.group} sx={{ mb: 3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>{group.group}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                        {group.fields.map(field => {
                          const hasContent = !!formData[field.key];
                          return (
                            <Button
                              key={field.key}
                              variant={activeField === field.key ? 'contained' : (hasContent ? 'outlined' : 'text')}
                              onClick={() => setActiveField(field.key)}
                              sx={{
                                justifyContent: 'flex-start',
                                textAlign: 'left',
                                textTransform: 'none',
                                color: activeField === field.key ? '#fff' : '#333',
                                bgcolor: activeField === field.key ? '#333' : 'transparent',
                                borderColor: hasContent && activeField !== field.key ? '#ccc' : 'transparent',
                                '&:hover': { bgcolor: activeField === field.key ? '#000' : '#eee' }
                              }}
                            >
                              {field.label} {hasContent && activeField !== field.key && ' ✓'}
                            </Button>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Box>

                {/* Right Area: The Big Box */}
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  {(() => {
                    const activeFieldObj = INSIGHT_FIELDS.flatMap(g => g.fields).find(f => f.key === activeField);
                    if (!activeFieldObj) return null;
                    return (
                      <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ mb: 2, color: '#333' }}>{activeFieldObj.label}</Typography>
                        <TextField
                          fullWidth
                          autoFocus
                          multiline
                          minRows={18}
                          variant="outlined"
                          placeholder="Type your insights here..."
                          name={activeField}
                          value={formData[activeField]}
                          onChange={handleInputChange}
                          sx={{ bgcolor: '#fff', width: '100%' }}
                        />
                      </Box>
                    );
                  })()}
                </Box>
              </Box>
            ) : (
              /* Preview Mode */
              <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 3, borderBottom: '1px solid #eee', pb: 1 }}>Review Insights for {currentDate}</Typography>
                {INSIGHT_FIELDS.map((group) => {
                  const hasAnyContent = group.fields.some(f => !!formData[f.key]);
                  if (!hasAnyContent) return null;

                  return (
                    <ViewSectionContainer key={group.group} title={group.group}>
                      {group.fields.map(field => {
                        if (!formData[field.key]) return null;
                        return (
                          <Grid item xs={12} sm={12} md={6} key={field.key}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>{field.label}</Typography>
                            <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: 'pre-wrap', color: '#333', bgcolor: '#f9f9f9', p: 1.5, borderRadius: 1, border: '1px solid #eee' }}>{formData[field.key]}</Typography>
                          </Grid>
                        );
                      })}
                    </ViewSectionContainer>
                  );
                })}
              </Box>
            )}

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
