
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, MessageSquare } from 'lucide-react';

interface Message {
  phoneNumber: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: string;
}

interface MessageStatusProps {
  messages: Message[];
}

const MessageStatus: React.FC<MessageStatusProps> = ({ messages }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Trimis';
      case 'failed':
        return 'Eșuat';
      case 'pending':
        return 'În așteptare';
      default:
        return 'Necunoscut';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const sentCount = messages.filter(m => m.status === 'sent').length;
  const failedCount = messages.filter(m => m.status === 'failed').length;
  const pendingCount = messages.filter(m => m.status === 'pending').length;

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Status Mesaje
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nu au fost trimise mesaje încă</p>
          </div>
        ) : (
          <>
            {/* Statistici */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sentCount}</div>
                <div className="text-sm text-gray-600">Trimise</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-sm text-gray-600">În așteptare</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-sm text-gray-600">Eșuate</div>
              </div>
            </div>

            {/* Lista mesajelor */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(message.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(message.status)}
                      <div>
                        <div className="font-medium">{message.phoneNumber}</div>
                        <div className="text-sm opacity-75">{message.timestamp}</div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {getStatusText(message.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageStatus;
