
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Icons } from '../constants';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: Partial<User>) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.USER, jobRole: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(newUser);
    setNewUser({ name: '', email: '', password: '', role: UserRole.USER, jobRole: '' });
    setIsAdding(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser);
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Personnel</h2>
          <p className="text-gray-500 mt-2">Manage internal access and roles.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-accent text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center"
        >
          <Icons.Plus /> <span className="ml-2">Add New Member</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-muted p-6 border border-border">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Password</label>
              <input
                type="text"
                required
                className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Job Role</label>
              <input
                type="text"
                placeholder="e.g. Designer"
                className="w-full bg-bg border border-border p-2 focus:border-accent outline-none text-sm"
                value={newUser.jobRole}
                onChange={(e) => setNewUser({ ...newUser, jobRole: e.target.value })}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-widest h-10 hover:bg-accent transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 border border-border text-[10px] uppercase font-bold text-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal / Form */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-muted p-8 border border-border w-full max-w-lg">
            <h3 className="text-xl font-bold uppercase mb-6">Edit User Details</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg border border-border p-3 focus:border-accent outline-none text-white"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full bg-bg border border-border p-3 focus:border-accent outline-none text-white"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Job Role</label>
                <input
                  type="text"
                  className="w-full bg-bg border border-border p-3 focus:border-accent outline-none text-white"
                  value={editingUser.jobRole || ''}
                  placeholder="e.g. Senior Product Designer"
                  onChange={(e) => setEditingUser({ ...editingUser, jobRole: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                  className="w-full bg-bg border border-border p-3 focus:border-accent outline-none text-white"
                >
                  <option value={UserRole.USER}>Team Member</option>
                  <option value={UserRole.ADMIN}>Administrator</option>
                </select>
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-accent text-black py-3 font-bold uppercase hover:bg-white transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-transparent border border-gray-600 text-gray-400 py-3 font-bold uppercase hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-gray-500">
              <th className="py-4 font-bold px-4">Member</th>
              <th className="py-4 font-bold px-4">Job Role</th>
              <th className="py-4 font-bold px-4">Role</th>
              <th className="py-4 font-bold px-4">Status</th>
              <th className="py-4 font-bold px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-muted transition-colors">
                <td className="py-4 px-4">
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs text-gray-400 font-medium">
                    {user.jobRole || '-'}
                  </span>
                </td>
                <td className="py-4 px-4 text-xs font-bold uppercase tracking-tighter">
                  <span className={`px-2 py-0.5 border ${user.role === UserRole.ADMIN ? 'border-accent text-accent' : 'border-gray-700 text-gray-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-4 text-xs">
                  <span className={user.isActive ? 'text-green-500' : 'text-red-500'}>
                    {user.isActive ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-[10px] uppercase font-bold text-accent hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onUpdateUser({ ...user, isActive: !user.isActive })}
                      className="text-[10px] uppercase font-bold text-gray-500 hover:text-white"
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                    {user.email !== 'founder@myntmore.com' && (
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="text-[10px] uppercase font-bold text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-only Personnel Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-muted p-5 border border-border space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg text-white">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
                {user.jobRole && (
                  <p className="text-[10px] uppercase font-bold text-accent mt-1 tracking-widest">{user.jobRole}</p>
                )}
              </div>
              <div className="inline-block px-2 py-0.5 border border-gray-700 text-[10px] font-bold uppercase text-gray-400 tracking-tighter">
                {user.role}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs py-2 border-y border-border/50">
              <span className="text-gray-500 uppercase tracking-widest font-bold">Status</span>
              <span className={user.isActive ? 'text-green-500' : 'text-red-500 font-bold'}>
                {user.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => setEditingUser(user)}
                className="py-3 bg-gray-800 text-[10px] uppercase font-black tracking-widest text-accent hover:bg-white hover:text-black transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onUpdateUser({ ...user, isActive: !user.isActive })}
                className="py-3 bg-gray-800 text-[10px] uppercase font-black tracking-widest text-gray-400 hover:bg-white hover:text-black transition-colors"
              >
                {user.isActive ? 'Disable' : 'Enable'}
              </button>
              {user.email !== 'founder@myntmore.com' ? (
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="py-3 bg-gray-800 text-[10px] uppercase font-black tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  Delete
                </button>
              ) : (
                <div className="py-3 bg-gray-900 text-[10px] uppercase font-black tracking-widest text-gray-700 text-center cursor-not-allowed">
                  Locked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagement;
