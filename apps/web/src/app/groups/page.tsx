'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Plus, Edit2, Trash2, Loader2, AlertCircle, X, Check } from 'lucide-react';

interface GroupData {
  _id: string;
  name: string;
  description?: string;
  assignmentCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const apiURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchGroups = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get(`${apiURL}/api/groups`);
      if (res.data && res.data.success) {
        setGroups(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to retrieve groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenCreate = () => {
    setEditingGroup(null);
    setGroupName('');
    setGroupDesc('');
    setModalOpen(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (group: GroupData) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description || '');
    setModalOpen(true);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingGroup) {
        // Edit group
        const res = await axios.put(`${apiURL}/api/groups/${editingGroup._id}`, {
          name: groupName.trim(),
          description: groupDesc.trim(),
        });
        if (res.data && res.data.success) {
          setModalOpen(false);
          fetchGroups();
        }
      } else {
        // Create group
        const res = await axios.post(`${apiURL}/api/groups`, {
          name: groupName.trim(),
          description: groupDesc.trim(),
        });
        if (res.data && res.data.success) {
          setModalOpen(false);
          fetchGroups();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to save group details');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group? Assignments under this group will not be deleted, they will simply be uncategorized.')) {
      return;
    }

    try {
      const res = await axios.delete(`${apiURL}/api/groups/${id}`);
      if (res.data && res.data.success) {
        fetchGroups();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete group');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-primary md:text-2xl">My Groups / Classes</h2>
          <p className="text-sm text-text-secondary mt-1">
            Organize your assignments by student sections or subject classes.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#333333] active:scale-[0.97] transition-all text-white font-medium py-2.5 px-5 rounded-full text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>New Group</span>
        </button>
      </div>

      {errorMsg && !modalOpen && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-100">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-text-secondary">Loading groups...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-border rounded-3xl py-16 text-center shadow-sm max-w-xl mx-auto">
          <Users className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-text-primary">No Groups Created</h3>
          <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
            Group your assignments to easily search and sort exam papers.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 bg-brand text-white text-xs font-bold py-2 px-5 rounded-full"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <div
              key={group._id}
              className="bg-white border border-border p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-brand/35 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(group)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
                      title="Edit Group"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(group._id)}
                      className="p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-base text-text-primary mt-4 truncate">
                  {group.name}
                </h4>
                
                <p className="text-xs text-text-secondary mt-1.5 line-clamp-2 h-8 leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              {/* Bottom stats details */}
              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="bg-surface px-2.5 py-1 rounded-full text-text-secondary font-semibold">
                  {group.assignmentCount === 1 ? '1 Assignment' : `${group.assignmentCount} Assignments`}
                </span>
                <span className="text-text-secondary/60">
                  {new Date(group.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. CRUD DIALOG MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-border shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border">
              <h3 className="font-bold text-text-primary text-base">
                {editingGroup ? 'Edit Group details' : 'Create new Group'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 hover:bg-surface rounded-full text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-start gap-1.5 border border-red-100">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label htmlFor="modal-name" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Group / Class Name <span className="text-brand">*</span>
                </label>
                <input
                  id="modal-name"
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="block w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Class 10 - Physics"
                />
              </div>

              <div>
                <label htmlFor="modal-desc" className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5">
                  Description
                </label>
                <textarea
                  id="modal-desc"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  className="block w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand min-h-[80px]"
                  placeholder="Brief class summary or schedule notes..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-full text-xs font-semibold text-text-secondary hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !groupName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white bg-brand hover:bg-[#D84D1B] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingGroup ? 'Save Changes' : 'Create Group'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
