
import { useState } from 'react';

interface SMSAPIResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export const useSMSAPI = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendSMS = async (message: string, phoneNumbers: string[]): Promise<SMSAPIResponse> => {
    setIsLoading(true);
    
    try {
      // Obține configurările din localStorage
      const settingsStr = localStorage.getItem('smsGatewaySettings');
      if (!settingsStr) {
        throw new Error('Configurările API nu sunt setate. Te rog configurează setările mai întâi.');
      }

      const settings = JSON.parse(settingsStr);
      if (!settings.deviceIP || !settings.username || !settings.password) {
        throw new Error('Configurările API sunt incomplete. Te rog verifică setările.');
      }

      const apiUrl = `http://${settings.deviceIP}:8080/message`;
      
      // Pregătește datele pentru API
      const requestData = {
        message: message,
        phoneNumbers: phoneNumbers
      };

      console.log('Sending SMS request to:', apiUrl);
      console.log('Request data:', requestData);

      // Creează header-ul de autentificare
      const authHeader = btoa(`${settings.username}:${settings.password}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        try {
          const errorData = await response.text();
          errorMessage += ` - ${errorData}`;
        } catch (e) {
          // Ignoră eroarea de parsing
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('Response data:', responseData);

      return {
        success: true,
        data: responseData
      };

    } catch (error) {
      console.error('SMS API Error:', error);
      
      let errorMessage = 'A apărut o eroare necunoscută';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Verifică dacă este o eroare de rețea
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
        errorMessage = 'Nu s-a putut conecta la dispozitivul Android. Verifică adresa IP și conexiunea la rețea.';
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
    isLoading
  };
};
