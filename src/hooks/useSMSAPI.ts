
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
    
    try {
      // Obține configurările din localStorage
      const settingsStr = localStorage.getItem('smsGatewaySettings');
      if (!settingsStr) {
        const errorMsg = 'Configurările API nu sunt setate. Te rog configurează setările mai întâi.';
        addLog('error', errorMsg);
        throw new Error(errorMsg);
      }

      const settings = JSON.parse(settingsStr);
      if (!settings.deviceIP || !settings.username || !settings.password) {
        const errorMsg = 'Configurările API sunt incomplete. Te rog verifică setările.';
        addLog('error', errorMsg, settings);
        throw new Error(errorMsg);
      }

      // Construiește URL-ul API corect
      const apiUrl = `http://${settings.deviceIP}:8080/message`;
      
      addLog('info', `Încercare conectare la: ${apiUrl}`, { 
        deviceIP: settings.deviceIP,
        username: settings.username,
        messageLength: message.length,
        phoneCount: phoneNumbers.length
      });

      // Pregătește datele pentru API - exact ca în exemplul curl
      const requestData = {
        message: message,
        phoneNumbers: phoneNumbers
      };

      addLog('info', 'Date pregătite pentru trimitere', requestData);

      // Creează header-ul de autentificare Basic Auth
      const credentials = btoa(`${settings.username}:${settings.password}`);
      
      addLog('info', 'Headers pregătite pentru autentificare', {
        authType: 'Basic Auth',
        hasCredentials: !!credentials
      });

      // Efectuează request-ul cu configurația corectă
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData),
        // Adaugă timeout pentru debugging
        signal: AbortSignal.timeout(30000) // 30 secunde timeout
      });

      addLog('info', `Răspuns primit cu status: ${response.status}`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
        
        try {
          const errorText = await response.text();
          addLog('error', 'Răspuns eroare de la server', {
            status: response.status,
            statusText: response.statusText,
            responseBody: errorText
          });
          errorMessage += ` - ${errorText}`;
        } catch (e) {
          addLog('error', 'Nu s-a putut citi răspunsul de eroare', e);
        }

        throw new Error(errorMessage);
      }

      // Încearcă să parseze răspunsul JSON
      let responseData;
      try {
        const responseText = await response.text();
        addLog('info', 'Răspuns text primit', { responseText });
        
        if (responseText) {
          responseData = JSON.parse(responseText);
        } else {
          responseData = { success: true, message: 'Răspuns gol - probabil succes' };
        }
      } catch (parseError) {
        addLog('error', 'Eroare la parsarea răspunsului JSON', parseError);
        // Dacă nu e JSON valid, considerăm succesul pe baza status code-ului
        responseData = { success: true, message: 'Răspuns non-JSON - considerat succes' };
      }

      addLog('success', 'Mesaj trimis cu succes!', {
        responseData,
        sentTo: phoneNumbers.length + ' numere'
      });

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      let errorMessage = 'A apărut o eroare necunoscută';
      let errorDetails = error;
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Verifică tipurile specifice de erori
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'Nu s-a putut conecta la dispozitivul Android. Verifică adresa IP și conexiunea la rețea.';
          addLog('error', 'Eroare de conectivitate', {
            originalError: error.message,
            suggestion: 'Verifică IP-ul dispozitivului și dacă aplicația SMS Gateway rulează'
          });
        } else if (error.name === 'AbortError') {
          errorMessage = 'Timeout - dispozitivul nu răspunde în timp util.';
          addLog('error', 'Timeout la request', {
            timeout: '30 secunde',
            suggestion: 'Verifică dacă dispozitivul este pornit și conectat la rețea'
          });
        } else {
          addLog('error', 'Eroare generală', {
            errorName: error.name,
            errorMessage: error.message,
            stack: error.stack
          });
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
        addLog('error', 'Eroare string', { error });
      } else {
        addLog('error', 'Eroare necunoscută', { error, type: typeof error });
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
