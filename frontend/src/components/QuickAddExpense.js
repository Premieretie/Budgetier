import React, { useState } from 'react';
import { Plus, Edit2, X, Check, Sparkles } from 'lucide-react';

const QuickAddExpense = ({ buttons, onAdd, onEdit, onDelete, loading }) => {
  const [editingButton, setEditingButton] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pressedButton, setPressedButton] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    icon: '💰',
    color: '#D4AF37',
  });

  const handleButtonPress = async (button) => {
    // Visual feedback
    setPressedButton(button.id);
    setTimeout(() => setPressedButton(null), 200);
    
    // Add expense — include buttonId so backend flags it as quick_add
    await onAdd({
      amount: button.amount,
      category: button.category,
      description: button.name,
      date: new Date().toISOString().split('T')[0],
      buttonId: button.id,
    });
  };

  const handleAddButton = async (e) => {
    e.preventDefault();
    await onEdit(null, formData); // null id = create new
    setShowAddForm(false);
    setFormData({ name: '', amount: '', category: '', icon: '💰', color: '#D4AF37' });
  };

  const handleUpdateButton = async (e) => {
    e.preventDefault();
    await onEdit(editingButton.id, editingButton);
    setEditingButton(null);
  };

  const presetIcons = ['💰', '☕', '🍔', '🛒', '⛽', '🍺', '🎬', '🚗', '🏥', '📚', '🎮', '🎁'];
  const presetColors = ['#D4AF37', '#8B4513', '#CD853F', '#228B22', '#B22222', '#4169E1', '#FF6347', '#9370DB'];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={20} />
          <h3 className="font-bold text-gray-800">Quick Log ⚡</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} />}
          {showAddForm ? 'Cancel' : 'Add Button'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingButton) && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 border-2 border-dashed border-gray-300">
          <form onSubmit={editingButton ? handleUpdateButton : handleAddButton}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name (e.g., Coffee)"
                value={editingButton ? editingButton.name : formData.name}
                onChange={(e) => editingButton 
                  ? setEditingButton({...editingButton, name: e.target.value})
                  : setFormData({...formData, name: e.target.value})
                }
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Amount ($)"
                value={editingButton ? editingButton.amount : formData.amount}
                onChange={(e) => editingButton
                  ? setEditingButton({...editingButton, amount: e.target.value})
                  : setFormData({...formData, amount: e.target.value})
                }
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
                required
              />
            </div>
            
            <input
              type="text"
              placeholder="Category"
              value={editingButton ? editingButton.category : formData.category}
              onChange={(e) => editingButton
                ? setEditingButton({...editingButton, category: e.target.value})
                : setFormData({...formData, category: e.target.value})
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mb-3"
            />

            {/* Icon Selector */}
            <div className="mb-3">
              <label className="text-xs text-gray-500 mb-1 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {presetIcons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => editingButton
                      ? setEditingButton({...editingButton, icon})
                      : setFormData({...formData, icon})
                    }
                    className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all ${
                      (editingButton?.icon || formData.icon) === icon
                        ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                        : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => editingButton
                      ? setEditingButton({...editingButton, color})
                      : setFormData({...formData, color})
                    }
                    className={`w-8 h-8 rounded-lg transition-all ${
                      (editingButton?.color || formData.color) === color
                        ? 'ring-2 ring-offset-2 ring-blue-500'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50"
              >
                <Check size={16} />
                {editingButton ? 'Update' : 'Add'} Button
              </button>
              {editingButton && (
                <button
                  type="button"
                  onClick={() => setEditingButton(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Quick Buttons Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {buttons.map((button) => (
          <div key={button.id} className="relative group">
            <button
              onClick={() => handleButtonPress(button)}
              disabled={loading}
              className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all transform ${
                pressedButton === button.id 
                  ? 'scale-95' 
                  : 'hover:scale-105 active:scale-95'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                backgroundColor: `${button.color}20`,
                border: `2px solid ${button.color}`,
              }}
            >
              <span className="text-2xl">{button.icon}</span>
              <span className="text-xs font-bold text-gray-700 text-center px-1 truncate w-full">
                {button.name}
              </span>
              <span className="text-xs font-semibold" style={{ color: button.color }}>
                ${button.amount}
              </span>
            </button>

            {/* Edit/Delete overlay */}
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <button
                onClick={() => setEditingButton(button)}
                className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={() => onDelete(button.id)}
                className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>

            {/* Usage indicator */}
            {button.usage_count > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {button.usage_count}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty state */}
      {buttons.length === 0 && !showAddForm && (
        <div className="text-center py-6 text-gray-500">
          <p className="text-sm">No quick buttons yet!</p>
          <p className="text-xs">Click "Add Button" to create one-tap expenses</p>
        </div>
      )}
    </div>
  );
};

export default QuickAddExpense;
