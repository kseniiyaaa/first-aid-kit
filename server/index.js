const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { startReminderEmailJob } = require('./jobs/reminderEmailJob');
const { startStockAlertJob }   = require('./jobs/stockAlertJob');
const authRoutes       = require('./routes/auth');
const userRoutes       = require('./routes/users');
const medicineRoutes   = require('./routes/medicines');
const reminderRoutes   = require('./routes/reminders');
const drugSearchRoutes = require('./routes/drugSearch');
const { createUsersTable } = require('./models/User');
const { createMedicinesTable } = require('./models/Medicine');
const { createPasswordResetTokensTable } = require('./models/PasswordResetToken');
const { createRemindersTable } = require('./models/Reminder');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/drug-search', drugSearchRoutes);

const PORT = process.env.PORT || 3001;

Promise.all([createUsersTable(), createMedicinesTable(), createPasswordResetTokensTable(), createRemindersTable()])
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
        startReminderEmailJob();
        startStockAlertJob();
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err.message);
        process.exit(1);
    });
