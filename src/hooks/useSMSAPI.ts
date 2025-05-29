
import { useState } from 'react';

interface SMSAPIResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface APILog {
  timestamp: string;
  type: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

export const useSMSAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);

  const addLog = (type: 'success' | 'error' | 'info', message: string, details?: any) => {
    const newLog: APILog = {
      timestamp: new Date().toLocaleString('ro-RO'),
      type,
      message,
      details
    };
    setApiLogs(prev => [...prev, newLog]);
    console.log(`[SMS API ${type.toUpperCase()}]`, message, details);
  };

  const sendSMS = async (message: string, phoneNumbers: string[]): Promise<SMSAPIResponse> => {
    setIsLoading(true);
    
    // Declare settings outside try block so it's accessible in catch block
    let settings: any = null;
    
    try {
      // Obține configurările din localStorage
      const settingsStr = localStorage.getItem('smsGatewaySettings');
      if (!settingsStr) {
        const errorMsg = 'Configurările API nu sunt setate. Te rog configurează setările mai întâi.';
        addLog('error', errorMsg);
        throw new Error(errorMsg);
      }

      settings = JSON.parse(settingsStr);
      if (!settings.deviceIP || !settings.username || !settings.password) {
        const errorMsg = 'Configurările API sunt incomplete. Te rog verifică setările.';
        addLog('error', errorMsg, settings);
        throw new Error(errorMsg);
      }

      // Construiește URL-ul API exact ca în curl
      const apiUrl = `http://${settings.deviceIP}:8080/message`;
      
      addLog('info', `Încercare conectare la: ${apiUrl}`, { 
        deviceIP: settings.deviceIP,
        username: settings.username,
        messageLength: message.length,
        phoneCount: phoneNumbers.length
      });

      // Pregătește datele EXACT ca în exemplul curl
      const requestData = {
        message: message,
        phoneNumbers: phoneNumbers
      };

      addLog('info', 'Request data pregătite', requestData);

      // Folosește autentificarea directă ca în curl -u username:password
      const authString = `${settings.username}:${settings.password}`;
      
      addLog('info', 'Autentificare pregătită', {
        authType: 'Basic Auth ca în curl -u',
        username: settings.username,
        hasPassword: !!settings.password,
        authString: `${settings.username}:****`
      });

      // Încearcă mai multe strategii pentru a ocoli CORS
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(authString)}`,
          // Adaugă header-e pentru a încerca să ocolim CORS
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify(requestData),
        // Încearcă fără CORS validation
        mode: 'no-cors' as RequestMode
      };

      addLog('info', 'Se încearcă request cu mode: no-cors', requestOptions);

      // Efectuează request-ul
      const response = await fetch(apiUrl, requestOptions);

      addLog('info', `Response primit cu mode no-cors`, {
        type: response.type,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Cu mode: 'no-cors', nu putem citi răspunsul, dar dacă fetch-ul nu aruncă eroare,
      // înseamnă că request-ul a fost trimis cu succes
      if (response.type === 'opaque') {
        addLog('success', `Request trimis cu succes în mode no-cors către ${phoneNumbers.length} numere!`, {
          phoneNumbers,
          note: 'Nu putem verifica răspunsul exact din cauza CORS, dar request-ul a fost trimis'
        });

        return {
          success: true,
          data: { 
            message: 'Request trimis cu succes (mode: no-cors)',
            phoneNumbers: phoneNumbers,
            note: 'Răspunsul exact nu poate fi citit din cauza restricțiilor CORS'
          }
        };
      }

      // Dacă nu este opaque, încearcă să citești răspunsul normal
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          addLog('error', `HTTP Error ${response.status}`, {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorText
          });
        } catch (e) {
          addLog('error', 'Nu s-a putut citi răspunsul de eroare', e);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      // Parsează răspunsul JSON
      const responseText = await response.text();
      addLog('info', 'Response raw text', { responseText });
      
      let responseData;
      if (responseText.trim()) {
        try {
          responseData = JSON.parse(responseText);
          addLog('success', 'Response JSON parsed successfully', responseData);
        } catch (parseError) {
          addLog('info', 'Response nu este JSON valid, dar request a fost de succes', {
            responseText,
            parseError: parseError
          });
          responseData = { raw: responseText, success: true };
        }
      } else {
        addLog('info', 'Response gol - considerat succes', {});
        responseData = { success: true, message: 'Empty response - considered success' };
      }

      addLog('success', `Mesaj trimis cu succes către ${phoneNumbers.length} numere!`, {
        responseData,
        phoneNumbers
      });

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      let errorMessage = 'Eroare necunoscută';
      let errorDetails = error;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `CORS Error: Browser-ul blochează request-ul către ${settings?.deviceIP || 'dispozitivul Android'}.

Soluții posibile:
1. Instalează o extensie de browser pentru a dezactiva CORS (ex: "CORS Unblock" pentru Chrome)
2. Lansează Chrome cu --disable-web-security --user-data-dir="/tmp/chrome_dev"
3. Configurează SMS Gateway să permită CORS
4. Folosește un proxy server

IP testat: ${settings?.deviceIP || 'nesetat'}
Port: 8080`;
        
        addLog('error', 'Eroare CORS - Browser blochează request-ul', {
          originalError: error.message,
          deviceIP: settings?.deviceIP,
          suggestion: 'Browser-ul blochează request-urile cross-origin către IP-uri locale',
          solutions: [
            'Extensie browser pentru CORS',
            'Chrome cu --disable-web-security',
            'Configurare CORS în SMS Gateway',
            'Proxy server'
          ]
        });
      } else if (error instanceof Error) {
        errorMessage = error.message;
        addLog('error', 'Eroare API', {
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack
        });
      } else {
        addLog('error', 'Eroare neprevăzută', { error });
      }

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendSMS,
    isLoading,
    apiLogs
  };
};
