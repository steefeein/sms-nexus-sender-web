
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
      
      addLog('info', `Conectare la: ${apiUrl}`, { 
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
        authType: 'Direct Auth (ca în curl -u)',
        username: settings.username,
        hasPassword: !!settings.password
      });

      // Efectuează request-ul EXACT ca în curl
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(authString)}`
        },
        body: JSON.stringify(requestData),
        // Adaugă configurări pentru cross-origin și timeouts
        mode: 'cors',
        credentials: 'omit'
      });

      addLog('info', `Response status: ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Verifică dacă response-ul este OK
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
        errorMessage = `Nu s-a putut conecta la ${settings?.deviceIP || 'dispozitivul Android'}. Verifică:
- Dacă IP-ul este corect (${settings?.deviceIP || 'nesetat'})
- Dacă dispozitivul Android este pornit și conectat la rețea
- Dacă aplicația SMS Gateway rulează pe dispozitiv
- Dacă firewall-ul permite conexiunea pe portul 8080`;
        
        addLog('error', 'Eroare de conectivitate', {
          originalError: error.message,
          deviceIP: settings?.deviceIP,
          suggestion: 'Verifică IP-ul dispozitivului și dacă aplicația SMS Gateway rulează'
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
