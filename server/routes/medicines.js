const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
    getMedicinesByUserId,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deductMedicineStock,
    deleteMedicine,
} = require('../models/Medicine');
const { checkAndSendAlerts } = require('../utils/alertHelpers');

const router = express.Router();

// GET /api/medicines
router.get('/', requireAuth, async (req, res) => {
    try {
        const medicines = await getMedicinesByUserId(req.userId);
        res.json(medicines);
    } catch (err) {
        console.error('Get medicines error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/medicines/intake  — must be before /:id to avoid param capture
router.post('/intake', requireAuth, async (req, res) => {
    try {
        const { items } = req.body; // [{ medicine_id, amount }]
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        const results = [];
        for (const { medicine_id, amount } of items) {
            if (!medicine_id || !amount || Number(amount) <= 0) continue;
            const updated = await deductMedicineStock(medicine_id, req.userId, amount);
            if (updated) results.push(updated);
        }

        res.json(results);
        // One batched call → one grouped email per user, not one per medicine
        const ids = results.map(m => m.id);
        if (ids.length) checkAndSendAlerts(ids).catch(() => {});
    } catch (err) {
        console.error('Log intake error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/medicines/:id
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const medicine = await getMedicineById(req.params.id, req.userId);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
        res.json(medicine);
    } catch (err) {
        console.error('Get medicine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/medicines
router.post('/', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        const medicine = await createMedicine(req.userId, req.body);
        res.status(201).json(medicine);
        checkAndSendAlerts([medicine.id]).catch(() => {});
    } catch (err) {
        console.error('Create medicine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/medicines/:id
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Medicine name is required' });
        }
        const medicine = await updateMedicine(req.params.id, req.userId, req.body);
        if (!medicine) return res.status(404).json({ error: 'Medicine not found' });
        res.json(medicine);
        checkAndSendAlerts([medicine.id]).catch(() => {});
    } catch (err) {
        console.error('Update medicine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/medicines/:id
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const deleted = await deleteMedicine(req.params.id, req.userId);
        if (!deleted) return res.status(404).json({ error: 'Medicine not found' });
        res.json({ message: 'Medicine deleted' });
    } catch (err) {
        console.error('Delete medicine error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
