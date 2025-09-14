import React, { useState } from 'react';
import { X, DollarSign, Calendar, Tag, FileText, Save } from 'lucide-react';
import { transactionAPI } from '../../services/api';

const TransactionForm = ({ 
  onClose, 
  onTransactionAdded, 
  showNotification, 
  currentMonth, 
  selectedYear,
  editTransaction = null 
}) => {
  const [formData, setFormData] = useState({
    type: editTransaction?.type || 'expense',
    amount: editTransaction?.amount || '',
    category: editTransaction?.category || 'Basic Needs',
    description: editTransaction?.description || '',
    date: editTransaction?.date ? new Date(editTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: editTransaction?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Categories based on transaction type
  const categories = {
    expense: ['Basic Needs', 'Clothes', 'Entertainment', 'Other'],
    income: ['Salary', 'Freelance', 'Investment', 'Gift']
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for amount to ensure it's a valid number
    if (name === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle transaction type change
  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: categories[type][0] // Reset to first category of the type
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please enter a description';
    } else if (formData.description.trim().length < 3) {
      newErrors.description = 'Description must be at least 3 characters';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }
    
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        notes: formData.notes.trim() || undefined
      };

      let response;
      if (editTransaction) {
        // Update existing transaction
        response = await transactionAPI.updateTransaction(editTransaction._id, transactionData);
        showNotification('Transaction updated successfully!', 'success');
      } else {
        // Create new transaction
        response = await transactionAPI.createTransaction(transactionData);
        showNotification('Transaction added successfully!', 'success');
      }

      onTransactionAdded(response.data.transaction);
      onClose();

    } catch (error) {
      console.error('Transaction submission error:', error);
      
      if (error.status === 400 && error.details) {
        showNotification(error.details, 'error');
      } else {
        showNotification(
          editTransaction ? 'Failed to update transaction' : 'Failed to add transaction',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  // Format amount input
  const formatAmount = (value) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? '' : numValue.toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {editTransaction ? 'Edit Transaction' : 'Add New Transaction'}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-not-allowed"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Expense</div>
                  <div className="text-sm text-gray-600">Money going out</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={loading}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Income</div>
                  <div className="text-sm text-gray-600">Money coming in</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 text-gray-400" size={20} />
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                {categories[formData.type].map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter description..."
                disabled={loading}
                maxLength={200}
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <div className="mt-1 text-xs text-gray-500">
              {formData.description.length}/200 characters
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Add any additional notes..."
              disabled={loading}
              maxLength={500}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
            <div className="mt-1 text-xs text-gray-500">
              {formData.notes.length}/500 characters
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : formData.type === 'expense'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {editTransaction ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {editTransaction ? 'Update Transaction' : 'Add Transaction'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;