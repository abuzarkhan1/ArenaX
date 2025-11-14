import React, { useEffect, useState } from 'react';
import { Save, DollarSign } from 'lucide-react';
import { settingsAPI } from '../services/api';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversionRate, setConversionRate] = useState('1');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getAll();
      setSettings(response.data.settings);
      const rateSetting = response.data.settings.find((s: any) => s.settingKey === 'coin_conversion_rate');
      if (rateSetting) setConversionRate(rateSetting.settingValue.toString());
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConversionRate = async () => {
    try {
      await settingsAPI.update('coin_conversion_rate', parseFloat(conversionRate), '1 AX Coin = PKR conversion rate');
      alert('Conversion rate updated successfully');
      fetchSettings();
    } catch (error) {
      console.error('Error updating conversion rate:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Configure platform settings</p>
      </div>

      {/* Economy Settings */}
      <div
        className="rounded-xl overflow-hidden mb-6"
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div 
              className="p-2 rounded-lg"
              style={{
                background: '#00BFFF',
                boxShadow: '0 0 15px rgba(0, 191, 255, 0.3)'
              }}
            >
              <DollarSign size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Economy Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-3">
                Coin Conversion Rate (1 AX Coin = ? PKR)
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <div 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg"
                    style={{
                      background: '#00BFFF'
                    }}
                  >
                    <DollarSign className="text-white" size={18} />
                  </div>
                  <input
                    type="number"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    className="w-full pl-16 pr-4 py-4 rounded-xl text-white font-bold focus:outline-none transition-all"
                    style={{
                      background: 'rgba(20, 20, 20, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                    placeholder="1.0"
                    step="0.1"
                  />
                </div>
                <button
                  onClick={handleSaveConversionRate}
                  className="px-6 py-4 rounded-xl font-bold text-white transition-all flex items-center space-x-2"
                  style={{
                    background: '#00BFFF',
                    boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
                  }}
                >
                  <Save size={20} />
                  <span>Save</span>
                </button>
              </div>
              <p 
                className="text-sm mt-3 px-4 py-2 rounded-lg inline-block font-medium"
                style={{
                  background: 'rgba(0, 191, 255, 0.1)',
                  color: '#00BFFF',
                  border: '1px solid rgba(0, 191, 255, 0.2)'
                }}
              >
                Current rate: 1 AX Coin = {conversionRate} PKR
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Settings;