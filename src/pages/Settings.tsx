import React, { useEffect, useState } from 'react';
import { Save, DollarSign, Globe, CreditCard, Trophy, RefreshCw } from 'lucide-react';
import { settingsAPI } from '../services/api';

interface Setting {
  _id: string;
  settingKey: string;
  settingValue: any;
  description: string;
  category: string;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('economy');
  const [formData, setFormData] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: 'success', message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getGrouped();
      setSettings(response.data.settings);
      
      // Initialize form data
      const initialData: any = {};
      Object.values(response.data.settings).flat().forEach((setting: any) => {
        initialData[setting.settingKey] = setting.settingValue;
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare settings array for bulk update
      const settingsToUpdate = Object.keys(formData).map(key => ({
        settingKey: key,
        settingValue: formData[key]
      }));

      await settingsAPI.bulkUpdate(settingsToUpdate);
      setModalMessage({ type: 'success', message: 'Settings saved successfully!' });
      setShowModal(true);
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setModalMessage({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setShowModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#121212' }}>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2" style={{ borderColor: '#00BFFF' }}></div>
      </div>
    );
  }

  const tabs = [
    { id: 'economy', label: 'Economy', icon: DollarSign },
    { id: 'platform', label: 'Platform', icon: Globe },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'general', label: 'Tournament & Notifications', icon: Trophy },
  ];

  return (
    <div className="min-h-screen p-6" style={{ background: '#121212' }}>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Configure platform settings and preferences</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={fetchSettings}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 hover:scale-105"
            style={{
              background: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: '#8B5CF6'
            }}
          >
            <RefreshCw size={20} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-lg font-semibold text-white transition-all flex items-center space-x-2 hover:scale-105"
            style={{
              background: '#00BFFF',
              boxShadow: '0 4px 12px rgba(0, 191, 255, 0.3)'
            }}
          >
            <Save size={20} />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 whitespace-nowrap"
            style={
              activeTab === tab.id
                ? {
                    background: 'rgba(0, 191, 255, 0.2)',
                    border: '1px solid rgba(0, 191, 255, 0.5)',
                    color: '#00BFFF'
                  }
                : {
                    background: 'rgba(30, 30, 30, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#888888'
                  }
            }
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {activeTab === 'economy' && <EconomySettings settings={settings.economy || []} formData={formData} onChange={handleChange} />}
        {activeTab === 'platform' && <PlatformSettings settings={settings.platform || []} formData={formData} onChange={handleChange} />}
        {activeTab === 'payment' && <PaymentSettings settings={settings.payment || []} formData={formData} onChange={handleChange} />}
        {activeTab === 'general' && <GeneralSettings settings={settings.general || []} formData={formData} onChange={handleChange} />}
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)' }}
          onClick={() => setShowModal(false)}
        >
          <div 
            className="rounded-xl p-8 max-w-md w-full mx-4 transform transition-all"
            style={{
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-center mb-6">
              <div 
                className="p-4 rounded-full"
                style={{
                  background: modalMessage.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  border: `2px solid ${modalMessage.type === 'success' ? '#10B981' : '#EF4444'}`
                }}
              >
                {modalMessage.type === 'success' ? (
                  <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white text-center mb-3">
              {modalMessage.type === 'success' ? 'Success!' : 'Error'}
            </h3>
            
            <p className="text-gray-400 text-center mb-6">
              {modalMessage.message}
            </p>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-105"
              style={{
                background: modalMessage.type === 'success' ? '#10B981' : '#EF4444',
                boxShadow: `0 4px 12px ${modalMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Economy Settings Component
const EconomySettings: React.FC<{ settings: Setting[]; formData: any; onChange: (key: string, value: any) => void }> = ({ settings, formData, onChange }) => {
  return (
    <SettingsCard title="Economy Settings" icon={DollarSign} color="#00BFFF">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <SettingField
            key={setting.settingKey}
            setting={setting}
            value={formData[setting.settingKey]}
            onChange={(value) => onChange(setting.settingKey, value)}
          />
        ))}
      </div>
    </SettingsCard>
  );
};

// Platform Settings Component
const PlatformSettings: React.FC<{ settings: Setting[]; formData: any; onChange: (key: string, value: any) => void }> = ({ settings, formData, onChange }) => {
  return (
    <SettingsCard title="Platform Settings" icon={Globe} color="#10B981">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <SettingField
            key={setting.settingKey}
            setting={setting}
            value={formData[setting.settingKey]}
            onChange={(value) => onChange(setting.settingKey, value)}
          />
        ))}
      </div>
    </SettingsCard>
  );
};

// Payment Settings Component
const PaymentSettings: React.FC<{ settings: Setting[]; formData: any; onChange: (key: string, value: any) => void }> = ({ settings, formData, onChange }) => {
  return (
    <SettingsCard title="Payment Settings" icon={CreditCard} color="#F59E0B">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <SettingField
            key={setting.settingKey}
            setting={setting}
            value={formData[setting.settingKey]}
            onChange={(value) => onChange(setting.settingKey, value)}
          />
        ))}
      </div>
    </SettingsCard>
  );
};

// General Settings Component (Tournament + Notifications)
const GeneralSettings: React.FC<{ settings: Setting[]; formData: any; onChange: (key: string, value: any) => void }> = ({ settings, formData, onChange }) => {
  return (
    <SettingsCard title="Tournament & Notification Settings" icon={Trophy} color="#8B5CF6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <SettingField
            key={setting.settingKey}
            setting={setting}
            value={formData[setting.settingKey]}
            onChange={(value) => onChange(setting.settingKey, value)}
          />
        ))}
      </div>
    </SettingsCard>
  );
};

// Reusable Setting Field Component
const SettingField: React.FC<{ setting: Setting; value: any; onChange: (value: any) => void }> = ({ setting, value, onChange }) => {
  const isBoolean = typeof setting.settingValue === 'boolean';
  const isNumber = typeof setting.settingValue === 'number';

  // Format label from settingKey
  const formatLabel = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (isBoolean) {
    return (
      <div>
        <label className="block text-gray-300 text-sm font-bold mb-3">
          {formatLabel(setting.settingKey)}
        </label>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onChange(!value)}
            className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors"
            style={{
              background: value ? '#00BFFF' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <span
              className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
              style={{
                transform: value ? 'translateX(2rem)' : 'translateX(0.25rem)'
              }}
            />
          </button>
          <span className="text-gray-400 text-sm">{value ? 'Enabled' : 'Disabled'}</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">{setting.description}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-gray-300 text-sm font-bold mb-3">
        {formatLabel(setting.settingKey)}
      </label>
      <input
        type={isNumber ? 'number' : 'text'}
        value={value || ''}
        onChange={(e) => onChange(isNumber ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-white font-medium focus:outline-none transition-all"
        style={{
          background: 'rgba(20, 20, 20, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
        placeholder={setting.description}
        step={isNumber ? '0.1' : undefined}
      />
      <p className="text-xs text-gray-500 mt-2">{setting.description}</p>
    </div>
  );
};

// Reusable Settings Card Component
const SettingsCard: React.FC<{ title: string; icon: any; color: string; children: React.ReactNode }> = ({ title, icon: Icon, color, children }) => {
  return (
    <div
      className="rounded-xl overflow-hidden"
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
              background: color,
              boxShadow: `0 0 15px ${color}50`
            }}
          >
            <Icon size={24} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Settings;