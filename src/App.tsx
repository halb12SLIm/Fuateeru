import React, { useState, useEffect } from 'react';
import { Bell, FileText, Users, PlusSquare, Hexagon, LogOut, Loader2, Truck, Camera, Sparkles, Smartphone, QrCode, RefreshCw, Settings } from 'lucide-react';
import { CreateInvoiceTab } from './components/CreateInvoiceTab';
import { ClientsTab } from './components/ClientsTab';
import { InvoicesTab } from './components/InvoicesTab';
import { ShipmentsTab } from './components/ShipmentsTab';
import { CompanyLogoModal } from './components/CompanyLogoModal';
import { ShippingLabelModal, ShippingLabelScreen } from './components/ShippingLabelModal';
import { LinkOtherDeviceModal } from './components/LinkOtherDeviceModal';
import { ScanToSyncDeviceScreen } from './components/ScanToSyncDeviceScreen';
import { LogoScannerScreen } from './components/LogoScannerScreen';
import { EditFormScreen } from './components/EditFormScreen';
import { FeaturesDrawer } from './components/FeaturesDrawer';
import { ShippingLabelScanner, type ScannedShippingLabelData } from './services/ShippingLabelScanner';
import type { Client, Invoice, Transaction, Currency, LogoData } from './types';
import { 
  db, 
  getSavedCode,
  createNewAccount,
  verifyAndLogin,
  removeLocalCode,
  handleFirestoreError, 
  OperationType 
} from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'invoices' | 'create' | 'shipments'>('create');
  
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [scannedLabelData, setScannedLabelData] = useState<ScannedShippingLabelData | null>(null);
  const [isScanningLabel, setIsScanningLabel] = useState(false);
  const [scanLabelError, setScanLabelError] = useState<string | null>(null);
  const [isLinkDeviceModalOpen, setIsLinkDeviceModalOpen] = useState(false);
  const [isLoginScanModalOpen, setIsLoginScanModalOpen] = useState(false);
  const [isLogoScannerOpen, setIsLogoScannerOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editFormInitialData, setEditFormInitialData] = useState<LogoData | null>(null);
  const [isFeaturesDrawerOpen, setIsFeaturesDrawerOpen] = useState(false);
  const [isCompanyLogoModalOpen, setIsCompanyLogoModalOpen] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(() => localStorage.getItem('company_logo_permanent'));
  
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // 1. Check if opened with direct sync link: ?sync_id=... or ?store_id=...
    const params = new URLSearchParams(window.location.search);
    const syncId = params.get('sync_id') || params.get('store_id');
    if (syncId) {
      verifyAndLogin(syncId.trim()).then(isValid => {
        if (isValid) {
          setAccessCode(syncId.trim());
        } else {
          setInputCode(syncId.trim());
        }
        setIsAuthReady(true);
      });
      return;
    }

    const code = getSavedCode();
    if (code) {
      verifyAndLogin(code).then(isValid => {
        if (isValid) setAccessCode(code);
        setIsAuthReady(true);
      });
    } else {
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!accessCode) {
      setClients([]);
      setInvoices([]);
      setTransactions([]);
      return;
    }

    const unsubClients = onSnapshot(collection(db, `accounts/${accessCode}/clients`), (snap) => {
      setClients(snap.docs.map(d => d.data() as Client));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `accounts/${accessCode}/clients`);
    });

    const invoicesQuery = query(collection(db, `accounts/${accessCode}/invoices`), orderBy('date', 'desc'));
    const unsubInvoices = onSnapshot(invoicesQuery, (snap) => {
      setInvoices(snap.docs.map(d => d.data() as Invoice));
    }, (error) => {
      // Fallback without ordering if index not built yet
      const fallbackUnsub = onSnapshot(collection(db, `accounts/${accessCode}/invoices`), (snap) => {
        const list = snap.docs.map(d => d.data() as Invoice);
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setInvoices(list);
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, `accounts/${accessCode}/invoices`);
      });
      handleFirestoreError(error, OperationType.GET, `accounts/${accessCode}/invoices`);
    });

    const txsQuery = query(collection(db, `accounts/${accessCode}/transactions`), orderBy('date', 'desc'));
    const unsubTxs = onSnapshot(txsQuery, (snap) => {
      setTransactions(snap.docs.map(d => d.data() as Transaction));
    }, (error) => {
      const fallbackUnsub = onSnapshot(collection(db, `accounts/${accessCode}/transactions`), (snap) => {
        const list = snap.docs.map(d => d.data() as Transaction);
        list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setTransactions(list);
      });
      handleFirestoreError(error, OperationType.GET, `accounts/${accessCode}/transactions`);
    });

    return () => {
      unsubClients();
      unsubInvoices();
      unsubTxs();
    };
  }, [accessCode]);

  const handleCreateAccount = async () => {
    const code = await createNewAccount();
    setNewGeneratedCode(code);
  };

  const handleLogin = async () => {
    setLoginError('');
    if (!inputCode.trim()) return;
    
    const isValid = await verifyAndLogin(inputCode.trim());
    if (isValid) {
      setAccessCode(inputCode.trim());
    } else {
      setLoginError('كود الدخول غير صحيح أو غير موجود');
    }
  };

  const handleConnectScannedWorkspace = async (syncData: { store_id: string; sync_key: string }) => {
    const targetId = syncData.store_id.trim();
    if (!targetId) return;
    const isValid = await verifyAndLogin(targetId);
    if (isValid) {
      setAccessCode(targetId);
      setIsLinkDeviceModalOpen(false);
      setIsLoginScanModalOpen(false);
    } else {
      setInputCode(targetId);
      setLoginError('تعذر العثور على المتجر المحدد بواسطة الباركود.');
    }
  };

  const handleLogout = () => {
    removeLocalCode();
    setAccessCode(null);
    setInputCode('');
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!accessCode) return;
    try {
      const batch = writeBatch(db);
      const invRef = doc(db, `accounts/${accessCode}/invoices/${invoice.id}`);
      batch.set(invRef, invoice);
      
      const trx: Transaction = {
        id: `TRX-${Date.now()}`,
        clientId: invoice.clientId,
        type: 'invoice',
        amount: invoice.total,
        currency: invoice.currency,
        date: invoice.date,
        description: `فاتورة مبيعات ${invoice.id}`,
        referenceId: invoice.id
      };
      const txRef = doc(db, `accounts/${accessCode}/transactions/${trx.id}`);
      batch.set(txRef, trx);
      
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `accounts/${accessCode}/invoices`);
    }
  };

  const handleAddClient = async (client: Client) => {
    if (!accessCode) return;
    try {
      await setDoc(doc(db, `accounts/${accessCode}/clients/${client.id}`), client);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `accounts/${accessCode}/clients`);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!accessCode) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, `accounts/${accessCode}/clients/${clientId}`));
      
      invoices.filter(i => i.clientId === clientId).forEach(inv => {
        batch.delete(doc(db, `accounts/${accessCode}/invoices/${inv.id}`));
      });
      transactions.filter(t => t.clientId === clientId).forEach(tx => {
        batch.delete(doc(db, `accounts/${accessCode}/transactions/${tx.id}`));
      });
      
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `accounts/${accessCode}/clients/${clientId}`);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!accessCode) return;
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, `accounts/${accessCode}/invoices/${invoiceId}`));
      transactions.filter(t => t.invoiceId === invoiceId || t.id === `tx_${invoiceId}`).forEach(tx => {
        batch.delete(doc(db, `accounts/${accessCode}/transactions/${tx.id}`));
      });
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `accounts/${accessCode}/invoices/${invoiceId}`);
    }
  };

  const handleAddPayment = async (trx: Transaction) => {
    if (!accessCode) return;
    try {
      await setDoc(doc(db, `accounts/${accessCode}/transactions/${trx.id}`), trx);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `accounts/${accessCode}/transactions`);
    }
  };

  const onScanPressed = async (useCamera: boolean = true) => {
    setIsScanningLabel(true);
    setScanLabelError(null);
    try {
      const scanner = new ShippingLabelScanner();
      const data = await scanner.scanAndExtract(useCamera);
      if (data) {
        setScannedLabelData(data);
        setIsShippingModalOpen(true);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanLabelError('تعذر استخراج بيانات البوليصة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsScanningLabel(false);
    }
  };

  const getDebt = (curr: Currency) => {
    return transactions
      .filter(t => t.currency === curr)
      .reduce((acc, t) => acc + ((t.type === 'invoice' || t.type === 'old_debt') ? t.amount : -t.amount), 0);
  };

  const formatCurr = (amount: number, curr: Currency) => {
    const sym = { TRY: '₺', USD: '$', EUR: '€', SAR: 'ر.س' }[curr];
    return `${amount.toLocaleString()} ${sym}`;
  };

  const handleScanPressed = async () => {
    setIsScanningLabel(true);
    setScanLabelError(null);
    try {
      const scanner = new ShippingLabelScanner();
      const data = await scanner.scanAndExtract(true);
      if (data) {
        setScannedLabelData(data);
        setIsShippingModalOpen(true);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanLabelError('تعذر مسح بوليصة الشحن، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsScanningLabel(false);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center text-[#15803d]" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!accessCode) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center justify-center text-center p-4 font-['Tajawal']" dir="rtl">
        <div className="w-[80px] h-[80px] bg-[#fef3c7] text-[#78350f] rounded-2xl flex items-center justify-center text-[2rem] border-2 border-[#f59e0b] mb-4 shadow-sm">
          <Hexagon className="w-10 h-10 fill-[#fef3c7]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#15803d] mb-2">تطبيق سليم</h1>
        <p className="text-slate-600 mb-8 max-w-xs text-[0.85rem] leading-relaxed">
          نظام حماية يعتمد على "رمز الدخول الخاص". لا حاجة لاستخدام جوجل أو بريد إلكتروني.
        </p>

        <div className="w-full max-w-[300px] bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-4">
          <label className="block text-right text-[0.75rem] font-bold text-slate-600 mb-1">
            أدخل رمز الدخول الخاص بك (مثال: SLM-ABCD):
          </label>
          <input 
            type="text" 
            placeholder="SLM-..." 
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full h-10 border border-slate-300 rounded-lg px-3 text-center font-bold tracking-widest text-[#15803d] outline-none focus:border-[#15803d]"
            dir="ltr"
          />
          {loginError && <p className="text-red-500 text-[0.7rem] font-bold mt-1 text-right">{loginError}</p>}
          <button 
            onClick={handleLogin}
            className="w-full mt-3 bg-[#15803d] text-white font-bold h-10 rounded-lg hover:bg-green-800 transition-colors"
          >
            تسجيل الدخول
          </button>

          <button 
            onClick={() => setIsLoginScanModalOpen(true)}
            className="w-full mt-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold h-10 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>مسح باركود الربط من هاتف آخر</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-[300px] mb-4">
          <div className="flex-1 h-px bg-slate-300"></div>
          <span className="text-slate-400 text-[0.75rem] font-bold">أو</span>
          <div className="flex-1 h-px bg-slate-300"></div>
        </div>

        <button 
          onClick={handleCreateAccount}
          className="w-full max-w-[300px] bg-white border border-[#15803d] text-[#15803d] font-bold py-3 px-6 rounded-xl hover:bg-green-50 transition-colors cursor-pointer text-[0.9rem]"
        >
          إنشاء حساب جديد (توليد رمز)
        </button>

        {/* Modal for scanning QR on login via ScanToSyncDeviceScreen */}
        {isLoginScanModalOpen && (
          <ScanToSyncDeviceScreen
            onClose={() => setIsLoginScanModalOpen(false)}
            onSuccessSync={(storeId) => {
              handleConnectScannedWorkspace({ store_id: storeId, sync_key: '' });
            }}
          />
        )}

        {/* Modal for new code */}
        {newGeneratedCode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
              <h3 className="text-xl font-bold text-[#15803d] mb-2">تم إنشاء حسابك بنجاح!</h3>
              <p className="text-slate-600 mb-4 text-[0.85rem]">
                احفظ هذا الكود لديك جيداً لاسترجاع بياناتك من أي جهاز في أي وقت:
              </p>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-200 mb-6">
                <span className="text-2xl font-black text-green-700 tracking-[0.2em]" dir="ltr">
                  {newGeneratedCode}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newGeneratedCode);
                    alert('تم نسخ الكود!');
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-lg border border-slate-300 hover:bg-slate-200 transition-colors text-[0.85rem]"
                >
                  نسخ الكود
                </button>
                <button
                  onClick={() => {
                    setAccessCode(newGeneratedCode);
                    setNewGeneratedCode(null);
                  }}
                  className="flex-1 bg-[#15803d] text-white font-bold py-2.5 rounded-lg hover:bg-green-800 transition-colors text-[0.85rem]"
                >
                  دخول للتطبيق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#f3f4f6] min-h-screen flex justify-center text-[#1f2937] text-[13px] font-['Tajawal'] overflow-x-hidden" dir="rtl">
      <div className="w-full max-w-[440px] min-h-screen bg-[#fbfbee] flex flex-col relative pb-[70px] shadow-[0_0_20px_rgba(0,0,0,0.05)]">
        {/* App Header (AppBar matching Flutter HomeScreen) */}
        <header className="bg-[#1B6E39] text-white px-3.5 py-2.5 flex items-center justify-between rounded-b-[18px] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-[38px] h-[38px] bg-white rounded-[10px] flex items-center justify-center border-2 border-[#8B5A2B] shadow-xs">
              <Hexagon className="w-5 h-5 text-[#8B5A2B] fill-transparent stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-[0.95rem] font-bold text-white m-0 leading-tight">شركة سليم</h1>
              <p className="text-[0.7rem] text-white/75 m-0 font-mono tracking-wider" dir="ltr">{accessCode || 'SLM-JEZLD'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Quick action buttons */}
            <div className="hidden xs:flex items-center gap-1">
              <button 
                onClick={handleScanPressed}
                title="مسح بوليصة شحن بالكاميرا واستخراج البيانات بالذكاء الاصطناعي"
                disabled={isScanningLabel}
                className="text-white bg-[#0088CC] hover:brightness-110 px-2 py-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1 shadow-xs disabled:opacity-50"
              >
                {isScanningLabel ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span className="text-[0.66rem] font-bold">مسح AI</span>
              </button>
              <button 
                onClick={() => {
                  setScannedLabelData(null);
                  setIsShippingModalOpen(true);
                }}
                title="إنشاء ملصق شحن وبوليصة كارجو (10×10 سم)"
                className="text-white bg-[#F58220] hover:brightness-110 px-2 py-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1 shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="text-[0.66rem] font-bold">ملصق شحن</span>
              </button>
              <button 
                onClick={() => setIsCompanyLogoModalOpen(true)}
                title="تحديث وإدارة شعار الشركة الدائم"
                className="text-white bg-[#8B5A2B] hover:brightness-110 px-2 py-1.5 rounded-lg border-none cursor-pointer transition-all flex items-center gap-1 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[0.66rem] font-bold">اللوجو</span>
              </button>
            </div>

            {/* Settings button to open FeaturesDrawer (matching Flutter openEndDrawer) */}
            <button
              onClick={() => setIsFeaturesDrawerOpen(true)}
              title="الميزات والإعدادات (قائمة الخدمات السريعة)"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl flex items-center justify-center transition-all cursor-pointer border border-white/15"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>

            <button 
              onClick={handleLogout} 
              title="تسجيل الخروج"
              className="w-8 h-8 text-white/80 hover:text-white hover:bg-black/20 rounded-lg border-none cursor-pointer transition-colors flex items-center justify-center"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Debts Summary */}
        <div className="bg-white mx-3.5 my-2.5 p-2 rounded-xl border-r-4 border-[#78350f] flex justify-around shadow-[0_2px_5px_rgba(0,0,0,0.03)]">
          <div className="text-center">
            <span className="block text-[0.62rem] text-[#6b7280] font-semibold mb-0.5">إجمالي الديون (₺)</span>
            <strong className="text-[0.82rem] text-[#78350f] font-extrabold" dir="ltr">{formatCurr(getDebt('TRY'), 'TRY')}</strong>
          </div>
          <div className="text-center">
            <span className="block text-[0.62rem] text-[#6b7280] font-semibold mb-0.5">إجمالي الديون ($)</span>
            <strong className="text-[0.82rem] text-[#78350f] font-extrabold" dir="ltr">{formatCurr(getDebt('USD'), 'USD')}</strong>
          </div>
          <div className="text-center">
            <span className="block text-[0.62rem] text-[#6b7280] font-semibold mb-0.5">إجمالي الديون (€)</span>
            <strong className="text-[0.82rem] text-[#78350f] font-extrabold" dir="ltr">{formatCurr(getDebt('EUR'), 'EUR')}</strong>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 px-3.5 mb-[60px]">
          {activeTab === 'create' && (
            <CreateInvoiceTab clients={clients} onSave={handleSaveInvoice} />
          )}
          {activeTab === 'invoices' && (
            <InvoicesTab 
              invoices={invoices} 
              clients={clients} 
              onDeleteInvoice={handleDeleteInvoice} 
              onUpdateInvoice={handleSaveInvoice}
            />
          )}
          {activeTab === 'clients' && (
            <ClientsTab clients={clients} transactions={transactions} invoices={invoices} onAddClient={handleAddClient} onAddPayment={handleAddPayment} onDeleteClient={handleDeleteClient} />
          )}
          {activeTab === 'shipments' && (
            <ShipmentsTab invoices={invoices} clients={clients} />
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 w-full max-w-[440px] h-[58px] bg-white border-t border-[#e5e7eb] flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center gap-[2px] text-[0.62rem] sm:text-[0.68rem] bg-transparent border-none cursor-pointer flex-1 h-full justify-center transition-colors ${activeTab === 'clients' ? 'text-[#15803d] font-extrabold' : 'text-[#6b7280] font-semibold'}`}
          >
            <Users className="w-4 h-4" />
            <span>العملاء والديون</span>
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center gap-[2px] text-[0.62rem] sm:text-[0.68rem] bg-transparent border-none cursor-pointer flex-1 h-full justify-center transition-colors ${activeTab === 'invoices' ? 'text-[#15803d] font-extrabold' : 'text-[#6b7280] font-semibold'}`}
          >
            <FileText className="w-4 h-4" />
            <span>سجل الفواتير</span>
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex flex-col items-center gap-[2px] text-[0.62rem] sm:text-[0.68rem] bg-transparent border-none cursor-pointer flex-1 h-full justify-center transition-colors ${activeTab === 'create' ? 'text-[#15803d] font-extrabold' : 'text-[#6b7280] font-semibold'}`}
          >
            <PlusSquare className="w-4 h-4" />
            <span>إنشاء فاتورة</span>
          </button>
          <button 
            onClick={() => setActiveTab('shipments')}
            className={`flex flex-col items-center gap-[2px] text-[0.62rem] sm:text-[0.68rem] bg-transparent border-none cursor-pointer flex-1 h-full justify-center transition-colors ${activeTab === 'shipments' ? 'text-[#15803d] font-extrabold' : 'text-[#6b7280] font-semibold'}`}
          >
            <Truck className="w-4 h-4" />
            <span>الشحن والطرود</span>
          </button>
        </nav>

        {/* مؤشر تحميل فحص الذكاء الاصطناعي */}
        {isScanningLabel && (
          <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl border border-blue-100 flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">جاري قراءة البوليصة</h4>
              <p className="text-xs text-slate-500 mb-4">يقوم الذكاء الاصطناعي باستخراج الاسم، العنوان، رقم التتبع وشركة الشحن تلقائياً...</p>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>يرجى الانتظار ثوانٍ معدودة...</span>
              </div>
            </div>
          </div>
        )}

        {/* نافذة ملصق الشحن / ShippingLabelScreen */}
        {isShippingModalOpen && (
          <ShippingLabelScreen
            clients={clients}
            receiverName={scannedLabelData?.receiver_name}
            address={scannedLabelData?.receiver_address}
            city={scannedLabelData?.receiver_city}
            trackingNumber={scannedLabelData?.tracking_number}
            carrier={scannedLabelData?.carrier}
            weightDesi={scannedLabelData?.weight_desi}
            senderName={scannedLabelData?.sender_name}
            onClose={() => {
              setIsShippingModalOpen(false);
              setScannedLabelData(null);
            }}
          />
        )}

        {/* نافذة ربط ومزامنة هاتف آخر / LinkOtherDeviceModal */}
        {isLinkDeviceModalOpen && accessCode && (
          <LinkOtherDeviceModal
            storeWorkspaceId={accessCode}
            onClose={() => setIsLinkDeviceModalOpen(false)}
            onScanSyncData={handleConnectScannedWorkspace}
          />
        )}

        {/* نافذة فحص وتحليل الشعار عبر الذكاء الاصطناعي / LogoScannerScreen */}
        {isLogoScannerOpen && (
          <LogoScannerScreen 
            onClose={() => setIsLogoScannerOpen(false)} 
            onOpenEditForm={(data) => {
              setIsLogoScannerOpen(false);
              setEditFormInitialData(data || null);
              setIsEditFormOpen(true);
            }}
          />
        )}

        {/* شاشة إدخال البيانات والملء التلقائي للشعار / EditFormScreen */}
        {isEditFormOpen && (
          <EditFormScreen
            initialData={editFormInitialData}
            onClose={() => {
              setIsEditFormOpen(false);
              setEditFormInitialData(null);
            }}
          />
        )}

        {/* نافذة إدارة وتثبيت شعار الشركة الدائم */}
        {isCompanyLogoModalOpen && (
          <CompanyLogoModal
            currentLogoUrl={companyLogoUrl}
            onClose={() => setIsCompanyLogoModalOpen(false)}
            onSaveLogo={(url) => {
              setCompanyLogoUrl(url);
              if (url) {
                localStorage.setItem('company_logo_permanent', url);
              } else {
                localStorage.removeItem('company_logo_permanent');
              }
            }}
          />
        )}

        {/* القائمة الجانبية للخدمات السريعة (FeaturesDrawer matching Flutter endDrawer) */}
        <FeaturesDrawer
          isOpen={isFeaturesDrawerOpen}
          onClose={() => setIsFeaturesDrawerOpen(false)}
          onScanAI={handleScanPressed}
          onShippingLabel={() => {
            setScannedLabelData(null);
            setIsShippingModalOpen(true);
          }}
          onDataEntry={() => {
            setEditFormInitialData(null);
            setIsEditFormOpen(true);
          }}
          onLogoScanner={() => setIsLogoScannerOpen(true)}
          onLinkDevice={() => setIsLinkDeviceModalOpen(true)}
          onLogout={handleLogout}
          accountCode={accessCode || 'SLM-JEZLD'}
        />
      </div>
    </div>
  );
}
