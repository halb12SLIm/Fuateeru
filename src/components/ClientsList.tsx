import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Client } from '../types';
import { Modal } from './Modal';

interface ClientsListProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

export function ClientsList({ clients, setClients }: ClientsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({});

  const filteredClients = clients.filter(c => 
    c.name.includes(searchTerm) || c.phone.includes(searchTerm) || c.email.includes(searchTerm)
  );

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name) return;
    
    const client: Client = {
      id: `C-${Date.now()}`,
      name: newClient.name,
      phone: newClient.phone || '',
      email: newClient.email || '',
      address: newClient.address || '',
    };
    
    setClients(prev => [client, ...prev]);
    setIsModalOpen(false);
    setNewClient({});
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">إدارة العملاء</h2>
          <p className="text-xs text-stone-500 mt-1">سجل تفاصيل عملائك لتسهيل إصدار الفواتير.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 me-2" />
          إضافة عميل جديد
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <div className="relative w-full sm:w-80">
            <div className="absolute inset-y-0 right-0 pe-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، أو البريد..."
              className="block w-full rounded-lg border border-stone-200 bg-stone-50 ps-10 pe-3 py-2 text-sm focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right whitespace-nowrap">
            <thead className="bg-stone-50 text-stone-600 font-medium border-b border-stone-200">
              <tr>
                <th scope="col" className="px-5 py-3">اسم العميل</th>
                <th scope="col" className="px-5 py-3">رقم الهاتف</th>
                <th scope="col" className="px-5 py-3">البريد الإلكتروني</th>
                <th scope="col" className="px-5 py-3">العنوان</th>
                <th scope="col" className="px-5 py-3">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-stone-900">{client.name}</td>
                  <td className="px-5 py-3 text-stone-600" dir="ltr">{client.phone}</td>
                  <td className="px-5 py-3 text-stone-600">{client.email}</td>
                  <td className="px-5 py-3 text-stone-500 truncate max-w-[200px]">{client.address}</td>
                  <td className="px-5 py-3 text-left">
                    <div className="flex items-center justify-end gap-2 text-stone-400">
                      <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="سجل الفواتير">
                        <FileText className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="تعديل">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-8 text-center text-stone-500 text-sm">
              لم يتم العثور على عملاء مطابقين لبحثك.
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة عميل جديد">
        <form onSubmit={handleAddClient} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">اسم العميل *</label>
            <input 
              required
              type="text" 
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={newClient.name || ''}
              onChange={e => setNewClient({...newClient, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">رقم الهاتف</label>
            <input 
              type="tel" 
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={newClient.phone || ''}
              onChange={e => setNewClient({...newClient, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={newClient.email || ''}
              onChange={e => setNewClient({...newClient, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">العنوان</label>
            <textarea 
              rows={2}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={newClient.address || ''}
              onChange={e => setNewClient({...newClient, address: e.target.value})}
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
            >
              حفظ العميل
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
