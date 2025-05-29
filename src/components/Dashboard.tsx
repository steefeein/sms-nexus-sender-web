
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Activity, MessageSquare, TrendingUp, Wifi, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DashboardProps {
  messageStatuses: Array<{
    phoneNumber: string;
    status: 'pending' | 'sent' | 'failed';
    timestamp: string;
  }>;
  apiLogs: Array<{
    timestamp: string;
    type: 'success' | 'error' | 'info';
    message: string;
    details?: any;
  }>;
}

const Dashboard: React.FC<DashboardProps> = ({ messageStatuses, apiLogs }) => {
  // Statistici pentru astăzi
  const today = new Date().toDateString();
  const todayMessages = messageStatuses.filter(msg => 
    new Date(msg.timestamp).toDateString() === today
  );

  const sentToday = todayMessages.filter(m => m.status === 'sent').length;
  const failedToday = todayMessages.filter(m => m.status === 'failed').length;
  const totalToday = todayMessages.length;

  // Statistici pentru ultima săptămână
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekMessages = messageStatuses.filter(msg => 
    new Date(msg.timestamp) >= weekAgo
  );

  // Pregătire date pentru grafice
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStr = date.toDateString();
    const dayMessages = messageStatuses.filter(msg => 
      new Date(msg.timestamp).toDateString() === dayStr
    );
    
    return {
      day: date.getDate(),
      sent: dayMessages.filter(m => m.status === 'sent').length,
      failed: dayMessages.filter(m => m.status === 'failed').length,
      total: dayMessages.length
    };
  }).reverse();

  // Status conexiune API
  const recentLogs = apiLogs.slice(-10);
  const lastApiCall = recentLogs[recentLogs.length - 1];
  const connectionStatus = lastApiCall?.type === 'success' ? 'connected' : 'disconnected';

  return (
    <div className="space-y-6">
      {/* Header Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mesaje Astăzi</p>
                <p className="text-2xl font-bold text-blue-600">{totalToday}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trimise Astăzi</p>
                <p className="text-2xl font-bold text-green-600">{sentToday}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Eșuate Astăzi</p>
                <p className="text-2xl font-bold text-red-600">{failedToday}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status API</p>
                <p className={`text-sm font-medium ${
                  connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Conectat' : 'Deconectat'}
                </p>
              </div>
              <Wifi className={`w-8 h-8 ${
                connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Activitate Astăzi</TabsTrigger>
          <TabsTrigger value="stats">Statistici Săptămână</TabsTrigger>
          <TabsTrigger value="logs">Log-uri API</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activitate Astăzi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nu au fost trimise mesaje astăzi</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayMessages.slice(-10).reverse().map((message, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {message.status === 'sent' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {message.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                        {message.status === 'pending' && <Clock className="w-5 h-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium">{message.phoneNumber}</p>
                          <p className="text-sm text-gray-500">{message.timestamp}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${
                        message.status === 'sent' ? 'text-green-600' :
                        message.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {message.status === 'sent' ? 'Trimis' :
                         message.status === 'failed' ? 'Eșuat' : 'În așteptare'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Statistici Ultima Săptămână
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sent" fill="#10b981" name="Trimise" />
                    <Bar dataKey="failed" fill="#ef4444" name="Eșuate" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {weekMessages.length}
                </div>
                <div className="text-sm text-gray-600">Total Săptămână</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {weekMessages.filter(m => m.status === 'sent').length}
                </div>
                <div className="text-sm text-gray-600">Trimise Săptămână</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {weekMessages.filter(m => m.status === 'failed').length}
                </div>
                <div className="text-sm text-gray-600">Eșuate Săptămână</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Log-uri API și Debugging
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {apiLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nu există log-uri disponibile</p>
                  </div>
                ) : (
                  apiLogs.slice().reverse().map((log, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      log.type === 'success' ? 'border-l-green-500 bg-green-50' :
                      log.type === 'error' ? 'border-l-red-500 bg-red-50' :
                      'border-l-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {log.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {log.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                            {log.type === 'info' && <Activity className="w-4 h-4 text-blue-500" />}
                            <span className="text-sm font-medium">{log.timestamp}</span>
                          </div>
                          <p className={`text-sm mt-1 ${
                            log.type === 'success' ? 'text-green-700' :
                            log.type === 'error' ? 'text-red-700' : 'text-blue-700'
                          }`}>
                            {log.message}
                          </p>
                          {log.details && (
                            <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
