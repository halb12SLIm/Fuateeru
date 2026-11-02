import React, { useState } from 'react';
import { UserPlus, Phone, FileText, X, Share2, Receipt, Banknote, HandCoins, Trash2, AlertTriangle, Truck, ArrowRight, Edit } from 'lucide-react';
import type { Client, Transaction, Currency, Invoice } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { ShippingLabelModal } from './ShippingLabelModal';

interface Props {
  clients: Client[];
  transactions: Transaction[];
  invoices: Invoice[];
  onAddClient: (client: Client) => void;
  onAddPayment: (trx: Transaction) => void;
  onDeleteClient: (clientId: string) => void;
}

export function ClientsTab({ clients, transactions, invoices, onAddClient, onAddPayment, onDeleteClient }: Props) {
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  const [activeModal, setActiveModal] = useState<'payment' | 'statement' | 'invoice' | 'old_debt' | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [shippingClient, setShippingClient] = useState<Client | null>(null);
  
  const [payAmount, setPayAmount] = useState('');
  const [payCurrency, setPayCurrency] = useState<Currency>('TRY');
  const [payNotes, setPayNotes] = useState('');

  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientNotes, setEditClientNotes] = useState('');
  const [snackBar, setSnackBar] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getBalances = (clientId: string) => {
    const clientTx = transactions.filter(t => t.clientId === clientId);
    return {
      TRY: clientTx.filter(t => t.currency === 'TRY').reduce((a, t) => a + ((t.type === 'invoice' || t.type === 'old_debt') ? t.amount : -t.amount), 0),
      USD: clientTx.filter(t => t.currency === 'USD').reduce((a, t) => a + ((t.type === 'invoice' || t.type === 'old_debt') ? t.amount : -t.amount), 0),
      EUR: clientTx.filter(t => t.currency === 'EUR').reduce((a, t) => a + ((t.type === 'invoice' || t.type === 'old_debt') ? t.amount : -t.amount), 0),
    };
  };

  const handleAddClient = () => {
    if(!newClientName) return;
    const name = newClientName;
    onAddClient({
      id: `C-${Date.now()}`,
      name: newClientName,
      phone: newClientPhone,
      email: '',
      address: newClientAddress
    });
    setNewClientName('');
    setNewClientPhone('');
    setNewClientAddress('');
    setSnackBar({
      message: `تم إضافة العميل "${name}" بنجاح`,
      type: 'success'
    });
    setTimeout(() => {
      setSnackBar(prev => prev?.message.includes(name) ? null : prev);
    }, 3500);
  };

  const confirmDeleteCustomer = (client: Client) => {
    setClientToDelete(client);
  };

  const handleConfirmDeleteCustomer = () => {
    if (!clientToDelete) return;
    const customerName = clientToDelete.name;
    const customerId = clientToDelete.id;
    setClientToDelete(null);
    if (selectedClient?.id === customerId) {
      setActiveModal(null);
      setSelectedClient(null);
    }
    onDeleteClient(customerId);
    setSnackBar({
      message: `تم حذف العميل "${customerName}" بنجاح`,
      type: 'error'
    });
    setTimeout(() => {
      setSnackBar(prev => prev?.message.includes(customerName) ? null : prev);
    }, 3500);
  };

  const handleSavePayment = () => {
    if(!selectedClient || !payAmount) return;
    onAddPayment({
      id: `PAY-${Date.now()}`,
      clientId: selectedClient.id,
      type: activeModal === 'old_debt' ? 'old_debt' : 'payment',
      amount: Number(payAmount),
      currency: payCurrency,
      date: new Date().toISOString().split('T')[0],
      description: payNotes || (activeModal === 'old_debt' ? 'دين سابق' : 'دفعة نقدية')
    });
    const msg = activeModal === 'old_debt' ? 'تمت إضافة الدين السابق بنجاح!' : 'تم تسجيل الدفعة وخصمها من الرصيد بنجاح!';
    setSnackBar({ message: msg, type: 'success' });
    setTimeout(() => setSnackBar(null), 3500);
    setActiveModal(null);
    setPayAmount('');
    setPayNotes('');
  };

  const openPayment = (client: Client) => {
    setSelectedClient(client);
    setActiveModal('payment');
  };

  const openOldDebt = (client: Client) => {
    setSelectedClient(client);
    setActiveModal('old_debt');
  };

  const openStatement = (client: Client) => {
    setSelectedClient(client);
    setActiveModal('statement');
  };

  const handleViewInvoice = (refId?: string) => {
    if (!refId) return;
    const inv = invoices.find(i => i.id === refId);
    if (inv) {
      setPreviewInvoice(inv);
      setActiveModal('invoice');
    }
  };

  const formatCurr = (amount: number, curr: string) => {
    return `${amount.toLocaleString()} ${curr === 'TRY' ? '₺' : curr === 'USD' ? '$' : '€'}`;
  };

  const clientTransactions = selectedClient ? transactions.filter(t => t.clientId === selectedClient.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-4">
      
      {/* Add Client Card */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-[#f1f5f9]">
        <div className="text-[0.82rem] font-bold text-[#15803d] mb-2 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4" /> إضافة عميل جديد
        </div>
        <div className="mb-2">
          <input type="text" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="اسم العميل" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
        </div>
        <div className="mb-2">
          <input type="tel" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="رقم الهاتف (واتساب)" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
        </div>
        <div className="mb-2">
          <input type="text" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="المدينة / العنوان" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} />
        </div>
        <button 
          onClick={handleAddClient}
          className="w-full h-[32px] bg-[#15803d] text-white rounded-lg text-[0.82rem] font-bold flex items-center justify-center cursor-pointer border-none"
        >
          حفظ العميل
        </button>
      </div>

      {/* Total Market Debts Banner */}
      {(() => {
        const totalDebtsTRY = clients.reduce((sum, c) => sum + getBalances(c.id).TRY, 0);
        return (
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-3 mb-2.5 flex items-center justify-between text-amber-900 shadow-2xs">
            <div>
              <span className="block text-[11px] font-bold text-amber-800">إجمالي الديون المتبقية عند جميع العملاء:</span>
              <span className="text-xs text-amber-700 font-medium">سجل الذمم والمستحقات المترتبة في السوق</span>
            </div>
            <div className="text-left font-mono font-extrabold text-base text-red-600" dir="ltr">
              {totalDebtsTRY.toLocaleString()} ₺
            </div>
          </div>
        );
      })()}

      {/* Clients List */}
      <div className="bg-white rounded-xl p-3 mb-2.5 border border-[#f1f5f9]">
        <div className="text-[0.82rem] font-bold text-[#15803d] mb-2">
          <span>أرصدة وديون العملاء</span>
        </div>
        
        <div className="flex flex-col gap-0">
          {clients.map(client => {
            const balances = getBalances(client.id);
            return (
              <div key={client.id} className="bg-white border border-[#e5e7eb] rounded-[12px] p-3 mb-2 flex flex-col gap-2 hover:border-slate-300 transition-all shadow-sm">
                {/* Flutter ListTile pattern */}
                <div 
                  onClick={() => openStatement(client)}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex-1 min-w-0 pr-1">
                    {/* title: Text(customer.name) */}
                    <div className="text-[0.92rem] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      <span>{client.name}</span>
                    </div>
                    {/* subtitle: Text(customer.phone) */}
                    <div className="text-[0.75rem] text-slate-500 flex items-center gap-2 mt-0.5" dir="ltr">
                      {client.phone ? (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{client.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[0.7rem]">لا يوجد رقم</span>
                      )}
                      {client.address && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 truncate" dir="rtl">{client.address}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(client);
                        setEditClientName(client.name);
                        setEditClientPhone(client.phone || '');
                        setEditClientAddress(client.address || '');
                        setEditClientNotes(client.notes || '');
                      }}
                      title="تعديل بيانات العميل"
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center border-none bg-transparent cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // منع فتح تفاصيل العميل عند الضغط على الحذف
                        confirmDeleteCustomer(client);
                      }}
                      title="حذف العميل"
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center shrink-0 border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#fffbeb] p-[4px_8px] rounded-md text-[#78350f] font-bold text-[0.68rem] flex flex-wrap items-center gap-2 mt-1">
                  <span>الديون المتبقية:</span>
                  <span dir="ltr">{formatCurr(balances.TRY, 'TRY')}</span> | 
                  <span dir="ltr">{formatCurr(balances.USD, 'USD')}</span> | 
                  <span dir="ltr">{formatCurr(balances.EUR, 'EUR')}</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-1 mt-1 border-t border-[#f1f5f9] pt-2">
                  <button onClick={() => openStatement(client)} className="h-7 rounded-md border border-[#fcd34d] bg-[#fde68a] text-[#78350f] text-[0.62rem] font-bold flex items-center justify-center gap-0.5 cursor-pointer hover:bg-[#fef3c7] transition-colors">
                    <Receipt className="w-3 h-3" /> كشف
                  </button>
                  <button onClick={() => openPayment(client)} className="h-7 rounded-md border border-[#86efac] bg-[#bbf7d0] text-[#15803d] text-[0.62rem] font-bold flex items-center justify-center gap-0.5 cursor-pointer hover:bg-[#dcfce7] transition-colors">
                    <HandCoins className="w-3 h-3" /> دفعة
                  </button>
                  <button onClick={() => openOldDebt(client)} className="h-7 rounded-md border border-[#fdba74] bg-[#fed7aa] text-[#9a3412] text-[0.62rem] font-bold flex items-center justify-center gap-0.5 cursor-pointer hover:bg-[#ffedd5] transition-colors">
                    <Banknote className="w-3 h-3" /> دين
                  </button>
                  <button onClick={() => setShippingClient(client)} title="إنشاء بوليصة شحن 10×10 سم" className="h-7 rounded-md border border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1] text-[0.62rem] font-bold flex items-center justify-center gap-0.5 cursor-pointer hover:bg-[#bae6fd] transition-colors">
                    <Truck className="w-3 h-3" /> شحن
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment / Old Debt Modal Overlay */}
      {(activeModal === 'payment' || activeModal === 'old_debt') && selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-3.5 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[380px] rounded-xl p-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="text-[0.85rem] font-bold text-[#15803d] mb-2 flex items-center justify-between">
              <span>{activeModal === 'old_debt' ? 'إضافة دين سابق' : 'تسجيل دفعة نقدية'}</span>
              <button onClick={() => setActiveModal(null)} className="bg-transparent border-none text-slate-400 cursor-pointer p-1"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[0.75rem] text-slate-600 mb-2">العميل: <strong className="text-slate-900">{selectedClient.name}</strong></p>
            
            <div className="mb-2">
              <label className="block text-[0.7rem] font-semibold text-slate-500 mb-1">{activeModal === 'old_debt' ? 'مبلغ الدين:' : 'المبلغ الواصل:'}</label>
              <input type="number" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="block text-[0.7rem] font-semibold text-slate-500 mb-1">العملة:</label>
              <select className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white appearance-none" value={payCurrency} onChange={e => setPayCurrency(e.target.value as Currency)}>
                <option value="TRY">تركي (TRY ₺)</option>
                <option value="USD">دولار (USD $)</option>
                <option value="EUR">يورو (EUR €)</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-[0.7rem] font-semibold text-slate-500 mb-1">ملاحظات / البيان:</label>
              <input type="text" className="w-full h-[34px] border border-slate-200 rounded-lg px-2.5 text-[0.78rem] outline-none bg-[#fafaf9] focus:border-[#15803d] focus:bg-white" placeholder={activeModal === 'old_debt' ? 'رصيد مدور، بضاعة سابقة...' : 'حوالة، كاش باليد...'} value={payNotes} onChange={e => setPayNotes(e.target.value)} />
            </div>
            
            <button onClick={handleSavePayment} className={`w-full h-[38px] text-white rounded-lg text-[0.82rem] font-bold flex items-center justify-center transition-colors border-none cursor-pointer ${activeModal === 'old_debt' ? 'bg-[#f97316] hover:bg-[#ea580c]' : 'bg-[#15803d] hover:bg-green-800'}`}>
              {activeModal === 'old_debt' ? 'إضافة الدين للرصيد' : 'تأكيد استلام الدفعة'}
            </button>
          </div>
        </div>
      )}

      {/* Statement Modal Overlay (Customer Detail Screen) */}
      {activeModal === 'statement' && selectedClient && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-3.5 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl max-h-[86vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Flutter AppBar:
                AppBar(
                  title: Text(customer.name),
                  actions: [
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.white),
                      onPressed: () {
                        confirmDeleteCustomer(context, customer.id, customer.name);
                      },
                    ),
                  ],
                )
            */}
            <div className="bg-[#15803d] text-white px-3.5 py-3 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Leading: Back Button */}
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 text-white hover:bg-white/15 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center shrink-0"
                  title="رجوع"
                >
                  <ArrowRight className="w-5 h-5 text-white" />
                </button>
                {/* title: Text(customer.name) */}
                <div className="min-w-0">
                  <h2 className="text-[1.05rem] font-bold text-white truncate m-0">
                    {selectedClient.name}
                  </h2>
                  {selectedClient.phone && (
                    <span className="text-[0.7rem] text-emerald-100 flex items-center gap-1 font-normal" dir="ltr">
                      <Phone className="w-3 h-3 text-emerald-200" />
                      {selectedClient.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* actions: [ IconButton(icon: const Icon(Icons.delete, color: Colors.white), onPressed: () { confirmDeleteCustomer(context, customer.id, customer.name); }) ] */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => confirmDeleteCustomer(selectedClient)}
                  title="حذف العميل"
                  className="p-2 text-white hover:bg-white/20 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-3.5 flex flex-col flex-1 overflow-hidden">
              {/* Balances summary */}
              {(() => {
                const balances = getBalances(selectedClient.id);
                return (
                  <div className="bg-[#fffbeb] border border-[#fde68a] p-2 rounded-xl text-[#78350f] font-bold text-[0.72rem] flex justify-around mb-2.5 shrink-0">
                    <div className="text-center">
                      <span className="text-[0.62rem] block text-amber-800 font-medium">تركي</span>
                      <span dir="ltr">{formatCurr(balances.TRY, 'TRY')}</span>
                    </div>
                    <div className="w-px bg-amber-200"></div>
                    <div className="text-center">
                      <span className="text-[0.62rem] block text-amber-800 font-medium">دولار</span>
                      <span dir="ltr">{formatCurr(balances.USD, 'USD')}</span>
                    </div>
                    <div className="w-px bg-amber-200"></div>
                    <div className="text-center">
                      <span className="text-[0.62rem] block text-amber-800 font-medium">يورو</span>
                      <span dir="ltr">{formatCurr(balances.EUR, 'EUR')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Actions inside customer details */}
              <div className="grid grid-cols-3 gap-1.5 mb-2.5 shrink-0">
                <button 
                  onClick={() => openPayment(selectedClient)}
                  className="h-7.5 rounded-lg border border-[#86efac] bg-[#bbf7d0] text-[#15803d] text-[0.68rem] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#dcfce7] transition-colors"
                >
                  <HandCoins className="w-3.5 h-3.5" /> تسجيل دفعة
                </button>
                <button 
                  onClick={() => openOldDebt(selectedClient)}
                  className="h-7.5 rounded-lg border border-[#fdba74] bg-[#fed7aa] text-[#9a3412] text-[0.68rem] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#ffedd5] transition-colors"
                >
                  <Banknote className="w-3.5 h-3.5" /> إضافة دين
                </button>
                <button 
                  onClick={() => setShippingClient(selectedClient)}
                  className="h-7.5 rounded-lg border border-[#bae6fd] bg-[#e0f2fe] text-[#0369a1] text-[0.68rem] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-[#bae6fd] transition-colors"
                >
                  <Truck className="w-3.5 h-3.5" /> بوليصة شحن
                </button>
              </div>

              {/* Transactions table */}
              <div className="flex-1 overflow-y-auto min-h-0 border border-slate-200 rounded-lg mb-3">
                <table className="w-full text-[0.68rem] text-center border-collapse">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="py-1.5 px-1 font-bold text-slate-600 border-b border-slate-200">البيان</th>
                      <th className="py-1.5 px-1 font-bold text-slate-600 border-b border-slate-200">المبلغ</th>
                      <th className="py-1.5 px-1 font-bold text-slate-600 border-b border-slate-200">التاريخ</th>
                      <th className="py-1.5 px-1 font-bold text-slate-600 border-b border-slate-200">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTransactions.length === 0 ? (
                      <tr><td colSpan={4} className="py-6 text-slate-400">لا توجد حركات مالية مسجلة.</td></tr>
                    ) : (
                      clientTransactions.map(trx => (
                        <tr key={trx.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50">
                          <td className="py-1.5 px-1 text-right pr-2">
                            {trx.type === 'invoice' ? (
                              <button onClick={() => handleViewInvoice(trx.referenceId)} className="text-blue-600 hover:underline border-none bg-transparent text-[0.68rem] cursor-pointer text-right line-clamp-1">{trx.description}</button>
                            ) : (
                              <span className="line-clamp-1">{trx.description}</span>
                            )}
                          </td>
                          <td className="py-1.5 px-1 font-semibold" dir="ltr">{trx.amount.toLocaleString()} {trx.currency}</td>
                          <td className="py-1.5 px-1 text-slate-500">{trx.date}</td>
                          <td className={`py-1.5 px-1 font-bold ${trx.type === 'invoice' || trx.type === 'old_debt' ? 'text-red-500' : 'text-[#15803d]'}`}>
                            {trx.type === 'invoice' ? 'فاتورة' : trx.type === 'old_debt' ? 'دين' : 'واصل'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button onClick={() => alert('تم تجهيز كشف الحساب بصيغة PDF للطباعة أو الإرسال')} className="w-full h-[38px] bg-[#f59e0b] text-white rounded-lg text-[0.82rem] font-bold flex items-center justify-center gap-1.5 hover:bg-yellow-600 transition-colors border-none cursor-pointer shrink-0 shadow-sm">
                <Share2 className="w-4 h-4" /> مشاركة كشف الحساب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal (nested from Statement) */}
      {activeModal === 'invoice' && previewInvoice && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
           <InvoicePreview invoice={previewInvoice} onClose={() => setActiveModal('statement')} />
        </div>
      )}

      {/* Delete Confirmation Modal (matching Flutter confirmDeleteCustomer AlertDialog) */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[360px] rounded-[15px] p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-right">
            {/* Title */}
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-7 h-7 text-red-600 shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">تأكيد الحذف</h3>
            </div>

            {/* Content */}
            <div className="text-[15px] text-gray-700 leading-relaxed mb-6">
              <p>
                هل أنت متأكد من حذف العميل <span className="font-bold text-gray-900">"{clientToDelete.name}"</span>؟
              </p>
              <p className="text-gray-500 text-[13px] mt-1.5">
                سيتم حذف كافة البيانات الخاصة به نهائياً.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setClientToDelete(null)}
                className="text-gray-500 hover:text-gray-700 text-base font-medium px-4 py-2 rounded-lg cursor-pointer transition-colors bg-transparent border-none"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmDeleteCustomer}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-base font-bold px-5 py-2 rounded-[8px] border-none shadow-sm cursor-pointer transition-colors"
              >
                نعم، حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة تعديل بيانات العميل */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 z-[450] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[380px] rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-right border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
                <Edit className="w-5 h-5 text-blue-600" />
                <span>تعديل بيانات العميل</span>
              </h3>
              <button 
                onClick={() => setEditingClient(null)} 
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل *</label>
                <input 
                  type="text" 
                  value={editClientName} 
                  onChange={(e) => setEditClientName(e.target.value)} 
                  className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
                  placeholder="الاسم الكامل"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف</label>
                <input 
                  type="tel" 
                  value={editClientPhone} 
                  onChange={(e) => setEditClientPhone(e.target.value)} 
                  className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
                  placeholder="05xxxxxxxxx"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">العنوان / المدينة</label>
                <input 
                  type="text" 
                  value={editClientAddress} 
                  onChange={(e) => setEditClientAddress(e.target.value)} 
                  className="w-full h-9 border border-slate-300 rounded-lg px-3 text-xs outline-none focus:border-[#15803d]" 
                  placeholder="إسطنبول - الفاتح..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات خاصة بالعميل</label>
                <textarea 
                  value={editClientNotes} 
                  onChange={(e) => setEditClientNotes(e.target.value)} 
                  rows={2} 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-[#15803d] resize-none" 
                  placeholder="تفضيلات الشحن، طريقة الدفع..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editClientName.trim()) return;
                  onAddClient({
                    id: editingClient.id,
                    name: editClientName.trim(),
                    phone: editClientPhone.trim(),
                    email: editingClient.email || '',
                    address: editClientAddress.trim(),
                    notes: editClientNotes.trim()
                  });
                  setEditingClient(null);
                  setSnackBar({ message: 'تم تحديث بيانات العميل بنجاح!', type: 'success' });
                  setTimeout(() => setSnackBar(null), 3500);
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#15803d] text-white font-bold text-xs hover:bg-green-800 transition cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ملصق شحن للعميل */}
      {shippingClient && (
        <ShippingLabelModal
          client={shippingClient}
          clients={clients}
          onClose={() => setShippingClient(null)}
        />
      )}

      {/* إشعار سريع أسفل الشاشة (SnackBar / Toast) */}
      {snackBar && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] max-w-[92%] sm:max-w-md w-full px-4 animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto">
          <div className={`${snackBar.type === 'error' ? 'bg-[#b91c1c]' : 'bg-[#15803d]'} text-white px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between text-sm font-bold`}>
            <span>{snackBar.message}</span>
            <button 
              onClick={() => setSnackBar(null)} 
              className="text-white/80 hover:text-white mr-3 text-sm border-none bg-transparent cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
