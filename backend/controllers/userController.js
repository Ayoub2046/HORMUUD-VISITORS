const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const users = await db.users.findMany();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await db.users.findOne({ id: req.params.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const { password_hash, ...userDetails } = user;
    res.status(200).json({ success: true, data: userDetails });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
};

exports.createUser = async (req, res) => {
  const { full_name, email, phone, address, role, department, password } = req.body;

  if (!full_name || !email || !phone || !address || !password) {
    return res.status(400).json({ success: false, message: 'Please fill Name, Email, Phone, Address, and Password.' });
  }

  let normalizedPhone = phone.trim().replace(/\s/g, '');
  if (/^0\d{8,9}$/.test(normalizedPhone)) {
    normalizedPhone = '+252' + normalizedPhone.slice(1);
  } else if (/^\d{9}$/.test(normalizedPhone)) {
    normalizedPhone = '+252' + normalizedPhone;
  } else if (!/^\+?252\d{7,9}$/.test(normalizedPhone)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid phone number (e.g. +25261XXXXXXX or 0615XXXXXXX).' });
  }
  if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+' + normalizedPhone;
  }

  try {
    const existingUser = await db.users.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const newUser = await db.users.create({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
      address: address.trim(),
      role,
      department: department || 'Field Marketing',
      password_hash,
      is_verified: true
    });

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'CREATE_USER',
      description: `Created user ${full_name} (${email}) as ${role}`
    });

    res.status(201).json({ success: true, message: 'User registered successfully.', data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = { ...req.body };
    if (updates.password) {
      updates.password_hash = bcrypt.hashSync(updates.password, 10);
      delete updates.password;
    }

    const user = await db.users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updatedUser = await db.users.update(userId, updates);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'UPDATE_USER',
      description: `Updated user info for ${user.full_name}`
    });

    res.status(200).json({ success: true, message: 'User updated successfully.', data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let newPassword = req.body.password;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide a new password of at least 6 characters.' });
    }
    newPassword = newPassword.trim();

    const password_hash = bcrypt.hashSync(newPassword, 10);
    await db.users.update(userId, { password_hash });

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'RESET_PASSWORD',
      description: `Reset password for user ${user.full_name} (${user.email})`
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Share the new password with the user.',
      new_password: newPassword
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself.' });
    }

    const user = await db.users.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.users.delete(userId);

    await db.auditLogs.create({
      user_id: req.user.id,
      action: 'DELETE_USER',
      description: `Deleted user ${user.full_name} (${user.email})`
    });

    res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};
