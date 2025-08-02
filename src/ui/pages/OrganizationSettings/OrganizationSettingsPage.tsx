import React, { useState, useEffect, useRef } from 'react';
import { 
  PageHeader, 
  Loading,
  ConfirmationModal
} from '@components';
import { 
  useGetOrganizationQuery,
  useGetOrganizationSettingsQuery,
  useUpdateOrganizationSettingsMutation,
  useUpdateOrganizationMutation
} from '../../store/api/organizationApi';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { useNotification } from '../../hooks/useNotification';
import { OrganizationType } from '../../typings';

interface SettingsState {
  general: {
    dateFormat: string;
    timeFormat: string;
    currency: string;
    language: string;
    timezone: string;
  };
  notifications: {
    emailNotifications: boolean;
    newArtworkAlerts: boolean;
    appraisalUpdates: boolean;
    memberJoinAlerts: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    ipWhitelist: string[];
    allowedDomains: string[];
  };
  features: {
    enableNFC: boolean;
    enableAppraisals: boolean;
    enablePublicGallery: boolean;
    enableAPI: boolean;
    apiRateLimit: number;
  };
  branding: {
    primaryColor: string;
    logoUrl: string;
    customDomain: string;
    emailFooter: string;
  };
}

const OrganizationSettingsPage: React.FC = () => {
  const { currentOrganization } = useAuth();
  const { canManageOrgSettings } = usePermissions();
  const { showSuccess, showError } = useNotification();
  
  const organizationId = currentOrganization?.id || '';
  
  // State
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security' | 'features' | 'branding'>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Refs for input fields
  const ipInputRef = useRef<HTMLInputElement>(null);
  const domainInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<SettingsState>({
    general: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      language: 'en',
      timezone: 'America/New_York'
    },
    notifications: {
      emailNotifications: true,
      newArtworkAlerts: true,
      appraisalUpdates: true,
      memberJoinAlerts: false,
      weeklyReports: false,
      monthlyReports: false
    },
    security: {
      requireTwoFactor: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      ipWhitelist: [],
      allowedDomains: []
    },
    features: {
      enableNFC: true,
      enableAppraisals: true,
      enablePublicGallery: false,
      enableAPI: false,
      apiRateLimit: 1000
    },
    branding: {
      primaryColor: '#3B82F6',
      logoUrl: '',
      customDomain: '',
      emailFooter: ''
    }
  });

  // Queries
  const { 
    data: organization, 
    isLoading: isLoadingOrg 
  } = useGetOrganizationQuery(organizationId, {
    skip: !organizationId
  });

  const { 
    data: savedSettings, 
    isLoading: isLoadingSettings,
    refetch: refetchSettings 
  } = useGetOrganizationSettingsQuery(organizationId, {
    skip: !organizationId || !canManageOrgSettings
  });

  // Mutations
  const [updateSettings, { isLoading: isUpdating }] = useUpdateOrganizationSettingsMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();

  // Load saved settings
  useEffect(() => {
    if (savedSettings) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...savedSettings
      }));
    }
  }, [savedSettings]);

  // Handlers
  const handleSettingChange = (category: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        organizationId,
        settings
      }).unwrap();
      
      showSuccess('Settings saved successfully');
      setHasChanges(false);
      refetchSettings();
    } catch (error: any) {
      showError(error?.message || 'Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    setSettings({
      general: {
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        language: 'en',
        timezone: 'America/New_York'
      },
      notifications: {
        emailNotifications: true,
        newArtworkAlerts: true,
        appraisalUpdates: true,
        memberJoinAlerts: false,
        weeklyReports: false,
        monthlyReports: false
      },
      security: {
        requireTwoFactor: false,
        sessionTimeout: 30,
        passwordExpiry: 90,
        ipWhitelist: [],
        allowedDomains: []
      },
      features: {
        enableNFC: true,
        enableAppraisals: true,
        enablePublicGallery: false,
        enableAPI: false,
        apiRateLimit: 1000
      },
      branding: {
        primaryColor: '#3B82F6',
        logoUrl: '',
        customDomain: '',
        emailFooter: ''
      }
    });
    setHasChanges(true);
    setShowResetModal(false);
    showSuccess('Settings reset to defaults');
  };

  const handleAddToList = (category: 'security', key: 'ipWhitelist' | 'allowedDomains', value: string) => {
    if (!value.trim()) return;
    
    const currentList = settings[category][key];
    if (!currentList.includes(value)) {
      handleSettingChange(category, key, [...currentList, value]);
    }
  };

  const handleRemoveFromList = (category: 'security', key: 'ipWhitelist' | 'allowedDomains', index: number) => {
    const currentList = settings[category][key];
    handleSettingChange(category, key, currentList.filter((_, i) => i !== index));
  };

  if (!organizationId) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-warning">
          <span>No organization selected. Please select an organization first.</span>
        </div>
      </div>
    );
  }

  if (!canManageOrgSettings) {
    return (
      <div className="container mx-auto px-4">
        <div className="alert alert-error">
          <span>You don't have permission to manage organization settings.</span>
        </div>
      </div>
    );
  }

  if (isLoadingOrg || isLoadingSettings) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <PageHeader 
        title="Organization Settings"
        subtitle={`Configure settings for ${organization?.name}`}
        action={
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <button 
                  onClick={() => setShowResetModal(true)}
                  className="btn btn-ghost btn-sm"
                >
                  Reset
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="btn btn-primary btn-sm"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed">
        <a 
          className={`tab ${activeTab === 'general' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </a>
        <a 
          className={`tab ${activeTab === 'notifications' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </a>
        <a 
          className={`tab ${activeTab === 'security' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </a>
        <a 
          className={`tab ${activeTab === 'features' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </a>
        <a 
          className={`tab ${activeTab === 'branding' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('branding')}
        >
          Branding
        </a>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">General Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Date Format</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.general.dateFormat}
                  onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD.MM.YYYY">DD.MM.YYYY</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Time Format</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.general.timeFormat}
                  onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Currency</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.general.currency}
                  onChange={(e) => handleSettingChange('general', 'currency', e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Language</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.general.language}
                  onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Timezone</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={settings.general.timezone}
                  onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                >
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Australia/Sydney">Sydney</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-base-content/60">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary ml-4"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                  />
                </label>
              </div>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">New Artwork Alerts</p>
                    <p className="text-sm text-base-content/60">Get notified when new artworks are added</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle ml-4"
                    checked={settings.notifications.newArtworkAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'newArtworkAlerts', e.target.checked)}
                    disabled={!settings.notifications.emailNotifications}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Appraisal Updates</p>
                    <p className="text-sm text-base-content/60">Notifications about appraisal changes</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle ml-4"
                    checked={settings.notifications.appraisalUpdates}
                    onChange={(e) => handleSettingChange('notifications', 'appraisalUpdates', e.target.checked)}
                    disabled={!settings.notifications.emailNotifications}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Member Join Alerts</p>
                    <p className="text-sm text-base-content/60">Get notified when new members join</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle ml-4"
                    checked={settings.notifications.memberJoinAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'memberJoinAlerts', e.target.checked)}
                    disabled={!settings.notifications.emailNotifications}
                  />
                </label>
              </div>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Weekly Reports</p>
                    <p className="text-sm text-base-content/60">Receive weekly activity summaries</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle ml-4"
                    checked={settings.notifications.weeklyReports}
                    onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                    disabled={!settings.notifications.emailNotifications}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Monthly Reports</p>
                    <p className="text-sm text-base-content/60">Receive monthly organization reports</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle ml-4"
                    checked={settings.notifications.monthlyReports}
                    onChange={(e) => handleSettingChange('notifications', 'monthlyReports', e.target.checked)}
                    disabled={!settings.notifications.emailNotifications}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Security Settings</h2>
            
            <div className="space-y-6">
              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Require Two-Factor Authentication</p>
                    <p className="text-sm text-base-content/60">All members must enable 2FA</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-error ml-4"
                    checked={settings.security.requireTwoFactor}
                    onChange={(e) => handleSettingChange('security', 'requireTwoFactor', e.target.checked)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Session Timeout (minutes)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value) || 30)}
                    min="5"
                    max="1440"
                  />
                  <label className="label">
                    <span className="label-text-alt">Automatically log out users after inactivity</span>
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-medium">Password Expiry (days)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value) || 90)}
                    min="0"
                    max="365"
                  />
                  <label className="label">
                    <span className="label-text-alt">Force password changes (0 = disabled)</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">IP Whitelist</h3>
                <p className="text-sm text-base-content/60 mb-2">Restrict access to specific IP addresses</p>
                <div className="space-y-2">
                  {settings.security.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={ip}
                        readOnly
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveFromList('security', 'ipWhitelist', index)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      ref={ipInputRef}
                      type="text"
                      placeholder="Add IP address (e.g., 192.168.1.1)"
                      className="input input-bordered input-sm flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddToList('security', 'ipWhitelist', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (ipInputRef.current && ipInputRef.current.value) {
                          handleAddToList('security', 'ipWhitelist', ipInputRef.current.value);
                          ipInputRef.current.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Allowed Email Domains</h3>
                <p className="text-sm text-base-content/60 mb-2">Only allow members from specific email domains</p>
                <div className="space-y-2">
                  {settings.security.allowedDomains.map((domain, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        className="input input-bordered input-sm flex-1"
                        value={domain}
                        readOnly
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveFromList('security', 'allowedDomains', index)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      ref={domainInputRef}
                      type="text"
                      placeholder="Add domain (e.g., company.com)"
                      className="input input-bordered input-sm flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddToList('security', 'allowedDomains', (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (domainInputRef.current && domainInputRef.current.value) {
                          handleAddToList('security', 'allowedDomains', domainInputRef.current.value);
                          domainInputRef.current.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Settings */}
      {activeTab === 'features' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Feature Settings</h2>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Enable NFC Features</p>
                    <p className="text-sm text-base-content/60">Allow NFC tag management and scanning</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary ml-4"
                    checked={settings.features.enableNFC}
                    onChange={(e) => handleSettingChange('features', 'enableNFC', e.target.checked)}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Enable Appraisals</p>
                    <p className="text-sm text-base-content/60">Allow artwork appraisal functionality</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary ml-4"
                    checked={settings.features.enableAppraisals}
                    onChange={(e) => handleSettingChange('features', 'enableAppraisals', e.target.checked)}
                  />
                </label>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Enable Public Gallery</p>
                    <p className="text-sm text-base-content/60">Make selected artworks publicly viewable</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary ml-4"
                    checked={settings.features.enablePublicGallery}
                    onChange={(e) => handleSettingChange('features', 'enablePublicGallery', e.target.checked)}
                  />
                </label>
              </div>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label cursor-pointer justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Enable API Access</p>
                    <p className="text-sm text-base-content/60">Allow external API integrations</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning ml-4"
                    checked={settings.features.enableAPI}
                    onChange={(e) => handleSettingChange('features', 'enableAPI', e.target.checked)}
                  />
                </label>
              </div>

              {settings.features.enableAPI && (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">API Rate Limit (requests per hour)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={settings.features.apiRateLimit}
                    onChange={(e) => handleSettingChange('features', 'apiRateLimit', parseInt(e.target.value) || 1000)}
                    min="100"
                    max="10000"
                  />
                  <label className="label">
                    <span className="label-text-alt">Maximum API requests allowed per hour</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Branding Settings */}
      {activeTab === 'branding' && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title mb-4">Branding Settings</h2>
            
            <div className="space-y-6">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Primary Color</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-20 h-12 rounded-lg border border-base-300 cursor-pointer"
                    value={settings.branding.primaryColor}
                    onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value={settings.branding.primaryColor}
                    onChange={(e) => handleSettingChange('branding', 'primaryColor', e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#3B82F6"
                  />
                </div>
                <label className="label">
                  <span className="label-text-alt">Used for buttons, links, and accents</span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Logo URL</span>
                </label>
                <input
                  type="url"
                  className="input input-bordered w-full"
                  value={settings.branding.logoUrl}
                  onChange={(e) => handleSettingChange('branding', 'logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <label className="label">
                  <span className="label-text-alt">URL to your organization's logo</span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Custom Domain</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={settings.branding.customDomain}
                  onChange={(e) => handleSettingChange('branding', 'customDomain', e.target.value)}
                  placeholder="gallery.yourcompany.com"
                />
                <label className="label">
                  <span className="label-text-alt">Use your own domain for the public gallery</span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Email Footer Text</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={settings.branding.emailFooter}
                  onChange={(e) => handleSettingChange('branding', 'emailFooter', e.target.value)}
                  placeholder="Add custom text to email notifications..."
                />
                <label className="label">
                  <span className="label-text-alt">Appears at the bottom of system emails</span>
                </label>
              </div>

              {settings.branding.logoUrl && (
                <div className="alert alert-info">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Logo preview:</span>
                  <img 
                    src={settings.branding.logoUrl} 
                    alt="Organization logo" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Changes Alert */}
      {hasChanges && (
        <div className="toast toast-end">
          <div className="alert alert-warning">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>You have unsaved changes</span>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetSettings}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to their default values? This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        danger={true}
      />
    </div>
  );
};

export default OrganizationSettingsPage;