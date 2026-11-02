import React, { useState } from 'react';
import { Send, BrainCircuit, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const financialData = {
  totalRevenue: 45231.89,
  totalPending: 12053.00,
  totalOverdue: 2300.00,
  recentInvoices: [
    { client: 'شركة التقنية', amount: 15400, status: 'paid' },
    { client: 'مؤسسة الأفق', amount: 8200, status: 'pending' }
  ]
};

export function SmartAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: 'مرحباً! أنا مساعدك المحاسبي الذكي. يمكنني تحليل البيانات المالية، وتوقع التدفق النقدي، أو تقديم ملخص عن الفواتير المتأخرة. كيف يمكنني مساعدتك اليوم؟' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userQuery }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          data: financialData
        })
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: data.result || 'عذراً، لم أتمكن من معالجة طلبك.' 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        content: 'حدث خطأ في الاتصال بالخادم الذكي. يرجى التأكد من إعداد مفتاح API بشكل صحيح.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedQueries = [
    "لخص لي الوضع المالي الحالي",
    "من هم العملاء المتأخرون في السداد؟",
    "ما هي توقعات التدفق النقدي للشهر القادم؟"
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center shadow-md">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div className="ms-3">
            <h2 className="text-base font-bold text-stone-800">المساعد المحاسبي الذكي</h2>
            <p className="text-xs text-stone-500 font-medium">مدعوم بنماذج الذكاء الاصطناعي</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex max-w-[85%]",
              msg.role === 'user' ? "ms-auto" : "me-auto"
            )}
          >
            <div className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-amber-600 text-white rounded-tr-sm shadow-sm" 
                : "bg-white text-stone-800 rounded-tl-sm border border-stone-200 shadow-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex me-auto max-w-[85%]">
            <div className="rounded-2xl px-4 py-2.5 bg-white text-stone-800 rounded-tl-sm border border-stone-200 shadow-sm flex items-center space-x-2 rtl:space-x-reverse">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span className="text-xs">جاري المعالجة...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-stone-200 bg-white">
        <div className="flex flex-wrap gap-2 mb-3">
          {predefinedQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => setInput(q)}
              className="text-xs font-medium px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-full text-stone-600 hover:border-amber-300 hover:text-amber-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسأل المساعد الذكي..."
            className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 px-4 pe-12 text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute left-2 w-8 h-8 flex items-center justify-center bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
