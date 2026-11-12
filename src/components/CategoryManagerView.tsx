import React, { useState } from 'react';
import { 
  Tags, 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import { TaskCategory, SubCategory, Customer, UserAccount } from '../types';
import { DEFAULT_USERS } from '../services/db';

interface CategoryManagerViewProps {
  currentUser: UserAccount;
  categories: TaskCategory[];
  customers: Customer[];
  onSaveCategory: (cat: TaskCategory) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onSaveCustomer: (cust: Customer) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onSwitchUser: (user: UserAccount) => void;
}

export const CategoryManagerView: React.FC<CategoryManagerViewProps> = ({
  currentUser,
  categories,
  customers,
  onSaveCategory,
  onDeleteCategory,
  onSaveCustomer,
  onDeleteCustomer,
  onSwitchUser,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'customers'>('categories');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(categories[0]?.id || null);

  // Category Modal
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [isNewCategory, setIsNewCategory] = useState<boolean>(false);

  // Subcategory Modal
  const [editingSubcategory, setEditingSubcategory] = useState<{
    categoryId: string;
    sub: SubCategory;
    isNew: boolean;
  } | null>(null);

  // Customer Modal
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState<boolean>(false);

  // RBAC Gate
  if (!isAdmin) {
    const adminUser = DEFAULT_USERS.find((u) => u.role === 'admin') || DEFAULT_USERS[3];
    return (
      <div className="pb-24">
        <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-amber-200/80 dark:border-amber-900/40 p-8 shadow-sm text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Taxonomy &amp; Registry Access Restricted
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
            Modifying billing rates, EPR task classifications, and NHS trust customer registries requires Administrator rights.
          </p>
          <button
            onClick={() => onSwitchUser(adminUser)}
            className="w-full py-3.5 px-6 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-extrabold text-sm shadow-lg shadow-[#F37F46]/30 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <span>Switch to {adminUser.name} (Admin Lead)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Handle Category Save
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    await onSaveCategory(editingCategory);
    setEditingCategory(null);
  };

  // Handle Subcategory Save
  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubcategory) return;
    const parentCat = categories.find((c) => c.id === editingSubcategory.categoryId);
    if (!parentCat) return;

    let updatedSubs = [...parentCat.subcategories];
    if (editingSubcategory.isNew) {
      updatedSubs.push(editingSubcategory.sub);
    } else {
      updatedSubs = updatedSubs.map((s) =>
        s.id === editingSubcategory.sub.id ? editingSubcategory.sub : s
      );
    }

    await onSaveCategory({ ...parentCat, subcategories: updatedSubs });
    setEditingSubcategory(null);
  };

  // Handle Customer Save
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    await onSaveCustomer(editingCustomer);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Top Header & Segmented Pill Switcher */}
      <div className="rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Enterprise Taxonomy &amp; Customer Registry
            </h2>
            <p className="text-xs text-slate-400">
              Manage billable work categories, standard rates, and registered hospital trusts
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setActiveSubTab('categories')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                activeSubTab === 'categories'
                  ? 'bg-white dark:bg-[#161D2B] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Task Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveSubTab('customers')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                activeSubTab === 'customers'
                  ? 'bg-white dark:bg-[#161D2B] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Customer Directory ({customers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: Task Categories */}
      {activeSubTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Categories &amp; Sub-activities
            </span>
            <button
              onClick={() => {
                setIsNewCategory(true);
                setEditingCategory({
                  id: `cat-${Date.now()}`,
                  name: '',
                  code: '',
                  isBillable: true,
                  color: '#F37F46',
                  subcategories: [],
                });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white text-xs font-bold shadow-md shadow-[#F37F46]/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="space-y-3">
            {categories.map((cat) => {
              const isExpanded = expandedCatId === cat.id;
              return (
                <div
                  key={cat.id}
                  className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                      className="flex items-center gap-2.5 text-left min-w-0 flex-1"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cat.code}
                          </span>
                          {cat.isBillable ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Billable
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400">
                              Overhead
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {cat.subcategories.length} Subcategories
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setIsNewCategory(false);
                          setEditingCategory(cat);
                        }}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#F37F46] flex items-center justify-center transition"
                        title="Edit category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete category "${cat.name}"?`)) {
                            onDeleteCategory(cat.id);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 flex items-center justify-center transition"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories Accordion List */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase">
                        <span>Subcategories &amp; Standard Rates</span>
                        <button
                          onClick={() => {
                            setEditingSubcategory({
                              categoryId: cat.id,
                              sub: {
                                id: `sub-${Date.now()}`,
                                name: '',
                                code: '',
                                defaultRate: 90,
                              },
                              isNew: true,
                            });
                          }}
                          className="text-[#F37F46] hover:underline flex items-center gap-1 font-bold"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Subcategory</span>
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {cat.subcategories.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-1">
                            No subcategories added yet.
                          </div>
                        ) : (
                          cat.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {sub.name}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2 font-mono">
                                  {sub.code}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub.defaultRate && (
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    £{sub.defaultRate}/hr
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingSubcategory({
                                      categoryId: cat.id,
                                      sub,
                                      isNew: false,
                                    });
                                  }}
                                  className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Customer Directory */}
      {activeSubTab === 'customers' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Hospital Trusts &amp; Clients
            </span>
            <button
              onClick={() => {
                setIsNewCustomer(true);
                setEditingCustomer({
                  id: `cust-${Date.now()}`,
                  name: '',
                  code: '',
                  status: 'Active',
                });
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white text-xs font-bold shadow-md shadow-[#F37F46]/20 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {customers.map((cust) => (
              <div
                key={cust.id}
                className="rounded-[24px] bg-white dark:bg-[#161D2B] border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {cust.name}
                    </h4>
                    {cust.isDefault && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#F37F46]/10 text-[#F37F46]">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="font-mono font-semibold">{cust.code}</span>
                    <span>·</span>
                    <span className={cust.status === 'Active' ? 'text-emerald-500 font-semibold' : 'text-slate-400'}>
                      {cust.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setIsNewCustomer(false);
                      setEditingCustomer(cust);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#F37F46] flex items-center justify-center transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!cust.isDefault && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete customer "${cust.name}"?`)) {
                          onDeleteCustomer(cust.id);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 flex items-center justify-center transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4">
              {isNewCategory ? 'Create Task Category' : 'Edit Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Code
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.code}
                  onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingCategory.color}
                    onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                    className="w-9 h-9 rounded-full border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono">{editingCategory.color}</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCategory.isBillable}
                    onChange={(e) => setEditingCategory({ ...editingCategory, isBillable: e.target.checked })}
                    className="w-4 h-4 rounded text-[#F37F46] focus:ring-[#F37F46]"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Mark as Billable Activity
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {editingSubcategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4">
              {editingSubcategory.isNew ? 'Add Subcategory' : 'Edit Subcategory'}
            </h3>
            <form onSubmit={handleSaveSubcategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subcategory Title
                </label>
                <input
                  type="text"
                  required
                  value={editingSubcategory.sub.name}
                  onChange={(e) =>
                    setEditingSubcategory({
                      ...editingSubcategory,
                      sub: { ...editingSubcategory.sub, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  required
                  value={editingSubcategory.sub.code}
                  onChange={(e) =>
                    setEditingSubcategory({
                      ...editingSubcategory,
                      sub: { ...editingSubcategory.sub, code: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Hourly Rate (£/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={editingSubcategory.sub.defaultRate || ''}
                  onChange={(e) =>
                    setEditingSubcategory({
                      ...editingSubcategory,
                      sub: { ...editingSubcategory.sub, defaultRate: parseFloat(e.target.value) || 0 },
                    })
                  }
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingSubcategory(null)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
                >
                  Save Subcategory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] bg-white dark:bg-[#161D2B] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-4">
              {isNewCustomer ? 'Add Customer Trust' : 'Edit Customer'}
            </h3>
            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Trust / Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Code
                </label>
                <input
                  type="text"
                  required
                  value={editingCustomer.code}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Status
                </label>
                <select
                  value={editingCustomer.status}
                  onChange={(e) =>
                    setEditingCustomer({
                      ...editingCustomer,
                      status: e.target.value as 'Active' | 'Archived',
                    })
                  }
                  className="w-full px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F37F46] hover:bg-[#E26E35] text-white font-bold text-xs shadow-md shadow-[#F37F46]/30"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
