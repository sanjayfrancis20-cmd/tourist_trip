import { Router, Response } from 'express';
import Trip from '../models/Trip';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply auth middleware to all expense routes
router.use(authenticateToken);

// POST /api/trips/:id/expenses - Add an expense to a trip
router.post('/:id/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || amount === undefined || !description) {
      return res.status(400).json({ error: 'Category, amount, and description are required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number.' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this trip.' });
    }

    // Add new expense
    const newExpense = {
      id: uuidv4(),
      category,
      amount: parsedAmount,
      description,
      date: date ? new Date(date) : new Date(),
    };

    trip.expenses.push(newExpense);
    await trip.save();

    return res.status(201).json({ trip });
  } catch (error: any) {
    console.error('Add expense error:', error);
    return res.status(500).json({ error: 'Server error adding expense.' });
  }
});

// DELETE /api/trips/:id/expenses/:expenseId - Remove an expense from a trip
router.delete('/:id/expenses/:expenseId', async (req: AuthRequest, res: Response) => {
  try {
    const { id, expenseId } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this trip.' });
    }

    // Find if expense exists
    const initialLength = trip.expenses.length;
    trip.expenses = trip.expenses.filter((exp) => exp.id !== expenseId);

    if (trip.expenses.length === initialLength) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    await trip.save();
    return res.status(200).json({ trip });
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return res.status(500).json({ error: 'Server error deleting expense.' });
  }
});

export default router;
