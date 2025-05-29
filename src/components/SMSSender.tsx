
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Settings as SettingsIcon, BarChart } from 'lucide-react';
import Settings from './Settings';
import MessageStatus from './MessageStatus';
import Dashboard from './Dashboard';
import { useSMSAPI } from '@/hooks/useSMSAPI';
import { toast } from '@/hooks/use-toast';

interface MessageStatusType {
  phoneNumber: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
}

const SMSSender = () => {
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'sender' | 'dashboard'>('sender');
  const [messageStatuses, setMessageStatuses] = useState<MessageStatusType[]>([]);
  const { sendSMS, isLoading, apiLogs } = useSMSAPI();

  const handleSendMessage = async () => {
    if (!phoneNumbers.trim() || !message.trim()) {
      toast({
        title: "Eroare",
        description: "Te rog completează numerele de telefon și mesajul.",
        variant: "destructive"
      });
      return;
    }

    const numbers = phoneNumbers
      .split('\n')
      .map(num => num.trim())
      .filter(num => num.length > 0);

    if (numbers.length === 0) {
      toast({
        title: "Eroare",
        description: "Te rog adaugă cel puțin un număr de telefon valid.",
        variant: "destructive"
      });
      return;
    }

    // Inițializează statusurile ca pending
    const initialStatuses: MessageStatusType[] = numbers.map(number => ({
      phoneNumber: number,
      status: 'pending',
      timestamp: new Date().toLocaleString('ro-RO')
    }));
    
    setMessageStatuses(prev => [...prev, ...initialStatuses]);

    try {
      const result = await sendSMS(message, numbers);
      
      // Actualizează statusurile bazat pe răspunsul API-ului
      const updatedStatuses = initialStatuses.map(status => ({
        ...status,
        status: result.success ? 'sent' as const : 'failed' as const,
        timestamp: new Date().toLocaleString('ro-RO')
      }));
      
      // Înlocuiește statusurile pending cu cele actualizate
      setMessageStatuses(prev => {
        const withoutPending = prev.filter(status => 
          !initialStatuses.some(initial => 
            initial.phoneNumber === status.phoneNumber && status.status === 'pending'
          )
        );
        return [...withoutPending, ...updatedStatuses];
      });

      if (result.success) {
        toast({
          title: "Succes",
          description: `Mesajul a fost trimis la ${numbers.length} număr${numbers.length > 1 ? 'e' : ''}.`
        });
        // Resetează formularul după trimitere cu succes
        setPhoneNumbers('');
        setMessage('');
      } else {
        toast({
          title: "Eroare",
          description: result.error || "A apărut o eroare la trimiterea mesajului.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      const failedStatuses = initialStatuses.map(status => ({
        ...status,
        status: 'failed' as const,
        timestamp: new Date().toLocaleString('ro-RO')
      }));
      
      // Înlocuiește statusurile pending cu cele failed
      setMessageStatuses(prev => {
        const withoutPending = prev.filter(status => 
          !initialStatuses.some(initial => 
            initial.phoneNumber === status.phoneNumber && status.status === 'pending'
          )
        );
        return [...withoutPending, ...failedStatuses];
      });
      
      toast({
        title: "Eroare",
        description: "A apărut o eroare neașteptată la trimiterea mesajului.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SMS Gateway Manager</h1>
            <p className="text-gray-600 mt-1">Trimite mesaje SMS în masă și monitorizează activitatea</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'sender' ? 'default' : 'outline'}
              onClick={() => setActiveTab('sender')}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              SMS Sender
            </Button>
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2"
            >
              <BarChart className="w-4 h-4" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              Configurări
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}

        {/* Content based on active tab */}
        {activeTab === 'sender' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMS Composer */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Compune Mesaj
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numere de telefon (unul per linie)
                  </label>
                  <Textarea
                    placeholder="Ex:&#10;+40712345678&#10;+40723456789&#10;+40734567890"
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mesaj SMS
                  </label>
                  <Textarea
                    placeholder="Scrie mesajul tau aici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px] resize-none"
                    maxLength={160}
                    disabled={isLoading}
                  />
                  <div className="text-right text-sm text-gray-500 mt-1">
                    {message.length}/160 caractere
                  </div>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !phoneNumbers.trim() || !message.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Se trimite...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Trimite SMS
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Message Status */}
            <MessageStatus messages={messageStatuses} />
          </div>
        ) : (
          // Dashboard view
          <Dashboard messageStatuses={messageStatuses} apiLogs={apiLogs} />
        )}
      </div>
    </div>
  );
};

export default SMSSender;
