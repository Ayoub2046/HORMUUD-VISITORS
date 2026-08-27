const db = require('../config/db');

exports.getVisits = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'All',
      place_type: req.query.place_type || 'All',
      search: req.query.search || '',
      startDate: req.query.startDate || '',
      endDate: req.query.endDate || ''
    };

    // If role is marketing, strictly restrict to their own visits
    if (req.user.role === 'marketing') {
      filters.user_id = req.user.id;
    } else if (req.query.employee_id && req.query.employee_id !== 'All') {
      // Admins can filter by specific employee
      filters.user_id = req.query.employee_id;
    }

    const visits = await db.visits.findMany(filters);
    res.status(200).json({ success: true, data: visits });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch visits.' });
  }
};

exports.getVisitById = async (req, res) => {
  try {
    const visit = await db.visits.findOne(req.params.id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found.' });
    }

    // Role safety check
    if (req.user.role === 'marketing' && visit.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this visit.' });
    }

    res.status(200).json({ success: true, data: visit });
  } catch (error) {
    console.error('Error fetching visit details:', error);
    res.status(500).json({ success: false, message: 'Error fetching visit details.' });
  }
};

exports.createVisit = async (req, res) => {
  const {
    place_name,
    place_type,
    address,
    contact_person,
    phone,
    visit_date,
    visit_time,
    purpose,
    activities,
    status,
    result,
    comments
  } = req.body;

  if (!place_name || !place_type) {
    return res.status(400).json({ success: false, message: 'Please enter the place name and place type.' });
  }

  try {
    const visitData = {
      user_id: req.user.id,
      place_name,
      place_type,
      address: address || '',
      contact_person: contact_person || '',
      phone: phone || '',
      visit_date: visit_date || new Date().toISOString().split('T')[0],
      visit_time: visit_time || new Date().toTimeString().split(' ')[0].substring(0, 5),
      purpose: purpose || '',
      activities: activities || '',
      status: status || 'Pending',
      result: result || '',
      comments: comments || ''
    };

    const newVisit = await db.visits.create(visitData);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'CREATE_VISIT',
      description: `Logged visit to ${place_name} (${place_type}) with status ${status}`
    });

    res.status(201).json({ success: true, message: 'Visit logged successfully.', data: newVisit });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({ success: false, message: 'Failed to save visit.' });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const visitId = req.params.id;
    const visit = await db.visits.findOne(visitId);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found.' });
    }

    // Role check: marketing can only update their own visits if still pending, admin can update anything
    if (req.user.role === 'marketing' && visit.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this visit.' });
    }

    if (req.user.role === 'marketing' && visit.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot edit a visit that has already been reviewed.' });
    }

    const updates = { ...req.body };
    // Prevent marketing from escalating user_id
    if (req.user.role === 'marketing') {
      delete updates.user_id;
    }

    const updatedVisit = await db.visits.update(visitId, updates);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'UPDATE_VISIT',
      description: `Updated visit to ${updatedVisit.place_name} (Status: ${updatedVisit.status})`
    });

    res.status(200).json({ success: true, message: 'Visit updated successfully.', data: updatedVisit });
  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({ success: false, message: 'Failed to update visit.' });
  }
};

exports.deleteVisit = async (req, res) => {
  try {
    const visitId = req.params.id;
    const visit = await db.visits.findOne(visitId);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found.' });
    }

    // Role validation
    if (req.user.role === 'marketing' && visit.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete this visit.' });
    }

    if (req.user.role === 'marketing' && visit.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Cannot delete a visit that has already been approved.' });
    }

    await db.visits.delete(visitId);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'DELETE_VISIT',
      description: `Deleted visit record to ${visit.place_name}`
    });

    res.status(200).json({ success: true, message: 'Visit deleted successfully.' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({ success: false, message: 'Error deleting visit.' });
  }
};
