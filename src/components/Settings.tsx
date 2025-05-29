
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Save, Wifi } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState({
    deviceIP: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    // Încarcă setările din localStorage
    const savedSettings = localStorage.getItem('smsGatewaySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    if (!settings.deviceIP || !settings.username || !settings.password) {
      toast({
        title: "Eroare",
        description: "Te rog completează toate câmpurile.",
        variant: "destructive"
      });
      return;
    }

    // Validare IP simpla
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(settings.deviceIP)) {
      toast({
        title: "Eroare",
        description: "Te rog introdu o adresă IP validă.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('smsGatewaySettings', JSON.stringify(settings));
    toast({
      title: "Succes",
      description: "Configurările au fost salvate cu succes."
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Configurări API Gateway
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresa IP dispozitiv Android
          </label>
          <Input
            type="text"
            placeholder="Ex: 192.168.1.100"
            value={settings.deviceIP}
            onChange={(e) => handleInputChange('deviceIP', e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            IP-ul local al dispozitivului Android din aceeași rețea
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <Input
            type="text"
            placeholder="Username pentru API"
            value={settings.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <Input
            type="password"
            placeholder="Password pentru API"
            value={settings.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="w-full"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Informații importante:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Asigură-te că dispozitivul Android are aplicația SMS Gateway instalată</li>
            <li>• Dispozitivul trebuie să fie în aceeași rețea cu serverul</li>
            <li>• Portul implicit este 8080</li>
            <li>• Verifică că aplicația SMS Gateway rulează pe dispozitiv</li>
          </ul>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
        >
          <Save className="w-4 h-4 mr-2" />
          Salvează Configurările
        </Button>
      </CardContent>
    </Card>
  );
};

export default Settings;
