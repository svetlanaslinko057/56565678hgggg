'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { useWallet } from '@/lib/wagmi';
import { 
  User, Camera, Shield, Lock, Bell, Globe, 
  Twitter, MessageCircle, Send, Wallet, 
  ChevronRight, Check, X, Loader2, Eye, EyeOff,
  Smartphone, Key, AlertTriangle, Copy, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

// Types
interface UserSettings {
  wallet: string;
  username: string;
  avatar: string;
  bio: string;
  email: string;
  socials: {
    twitter: string;
    discord: string;
    telegram: string;
    website: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
    trades: boolean;
    mentions: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod: 'app' | 'sms' | null;
    lastPasswordChange: string | null;
  };
  privacy: {
    showBalance: boolean;
    showActivity: boolean;
    showPositions: boolean;
  };
}

// Styled Components
const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 48px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const PageSubtitle = styled.p`
  font-size: 15px;
  color: #738094;
  margin-bottom: 32px;
`;

const SettingsGrid = styled.div`
  display: flex;
  gap: 24px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 240px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const MainContent = styled.div`
  flex: 1;
`;

const NavItem = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  background: ${({ $active }) => $active ? '#10B98115' : 'transparent'};
  color: ${({ $active }) => $active ? '#10B981' : '#738094'};
  
  &:hover {
    background: ${({ $active }) => $active ? '#10B98115' : '#f5f7fa'};
    color: ${({ $active }) => $active ? '#10B981' : '#0f172a'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const Section = styled.div`
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  padding: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    width: 20px;
    height: 20px;
    color: #10B981;
  }
`;

const SectionDescription = styled.p`
  font-size: 14px;
  color: #738094;
  margin-bottom: 24px;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const Avatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #10B981;
  object-fit: cover;
`;

const AvatarUploadButton = styled.label`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #10B981;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #059669;
    transform: scale(1.05);
  }
  
  input {
    display: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AvatarInfo = styled.div`
  flex: 1;
`;

const AvatarTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 4px;
`;

const AvatarSubtitle = styled.div`
  font-size: 13px;
  color: #738094;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #10B981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #10B981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const InputWithIcon = styled.div`
  position: relative;
  
  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #9ca3af;
  }
  
  input {
    padding-left: 44px;
  }
`;

const CharCount = styled.div`
  text-align: right;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ToggleInfo = styled.div`
  flex: 1;
`;

const ToggleTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin-bottom: 2px;
`;

const ToggleDescription = styled.div`
  font-size: 13px;
  color: #738094;
`;

const Toggle = styled.button<{ $enabled?: boolean }>`
  width: 48px;
  height: 26px;
  border-radius: 13px;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  background: ${({ $enabled }) => $enabled ? '#10B981' : '#e5e7eb'};
  
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $enabled }) => $enabled ? '25px' : '3px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'danger':
        return `
          background: #FEE2E2;
          color: #DC2626;
          &:hover { background: #FECACA; }
        `;
      case 'secondary':
        return `
          background: #f5f7fa;
          color: #0f172a;
          border: 1px solid #e5e7eb;
          &:hover { background: #eef1f5; }
        `;
      default:
        return `
          background: #10B981;
          color: white;
          &:hover { background: #059669; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const SecurityCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const SecurityIcon = styled.div<{ $enabled?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $enabled }) => $enabled ? '#10B98115' : '#f1f5f9'};
  
  svg {
    width: 24px;
    height: 24px;
    color: ${({ $enabled }) => $enabled ? '#10B981' : '#9ca3af'};
  }
`;

const SecurityInfo = styled.div`
  flex: 1;
`;

const SecurityTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 2px;
`;

const SecurityStatus = styled.div<{ $enabled?: boolean }>`
  font-size: 13px;
  color: ${({ $enabled }) => $enabled ? '#10B981' : '#738094'};
`;

const WalletCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 16px;
`;

const WalletInfo = styled.div`
  flex: 1;
`;

const WalletAddress = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WalletStatus = styled.div`
  font-size: 13px;
  color: #10B981;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

const IconButton = styled.button`
  padding: 8px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #738094;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e7eb;
    color: #0f172a;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ConnectPrompt = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid #eef1f5;
  text-align: center;
  padding: 48px;
`;

const PromptIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  
  svg {
    width: 40px;
    height: 40px;
    color: white;
  }
`;

const PromptTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
`;

const PromptText = styled.p`
  font-size: 16px;
  color: #738094;
  margin-bottom: 24px;
`;

const SaveStatus = styled.div<{ $type: 'success' | 'error' | 'saving' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `background: #10B98115; color: #10B981;`;
      case 'error':
        return `background: #FEE2E2; color: #DC2626;`;
      default:
        return `background: #f5f7fa; color: #738094;`;
    }
  }}
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #738094;
  gap: 12px;
`;

type TabType = 'profile' | 'socials' | 'security' | 'notifications' | 'privacy';

// Main Component
export default function SettingsPage() {
  const { 
    isConnected, 
    walletAddress, 
    shortAddress,
    isAuthenticated, 
    token,
    user
  } = useWallet();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [hydrated, setHydrated] = useState(false);
  
  // Form state
  const [settings, setSettings] = useState<UserSettings>({
    wallet: '',
    username: '',
    avatar: '',
    bio: '',
    email: '',
    socials: {
      twitter: '',
      discord: '',
      telegram: '',
      website: '',
    },
    notifications: {
      email: true,
      push: true,
      marketing: false,
      trades: true,
      mentions: true,
    },
    security: {
      twoFactorEnabled: false,
      twoFactorMethod: null,
      lastPasswordChange: null,
    },
    privacy: {
      showBalance: true,
      showActivity: true,
      showPositions: true,
    },
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFaToken, setTwoFaToken] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydration
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Fetch settings
  useEffect(() => {
    if (hydrated && isAuthenticated && walletAddress && token) {
      fetchSettings();
    } else if (hydrated) {
      setLoading(false);
    }
  }, [hydrated, isAuthenticated, walletAddress, token]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': walletAddress || '',
        },
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setSettings(prev => ({
          ...prev,
          wallet: data.data.wallet || walletAddress || '',
          username: data.data.username || '',
          avatar: data.data.avatar || '',
          bio: data.data.bio || '',
          email: data.data.email || '',
          socials: {
            twitter: data.data.socials?.twitter || '',
            discord: data.data.socials?.discord || '',
            telegram: data.data.socials?.telegram || '',
            website: data.data.socials?.website || '',
          },
          notifications: data.data.notifications || prev.notifications,
          security: data.data.security || prev.security,
          privacy: data.data.privacy || prev.privacy,
        }));
      } else {
        // Use default with wallet
        setSettings(prev => ({
          ...prev,
          wallet: walletAddress || '',
          username: user?.username || '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setSettings(prev => ({
        ...prev,
        wallet: walletAddress || '',
        username: user?.username || '',
      }));
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!token || !walletAddress) return;
    
    setSaving(true);
    setSaveStatus(null);
    
    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          username: settings.username,
          avatar: settings.avatar,
          bio: settings.bio,
          email: settings.email,
          socials: settings.socials,
          notifications: settings.notifications,
          privacy: settings.privacy,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setSaveStatus('error');
    }
    
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !walletAddress) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }
    
    setAvatarUploading(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        
        // Try Cloudinary upload first
        try {
          const res = await fetch(`${API_BASE}/api/cloudinary/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'x-wallet-address': walletAddress,
            },
            body: JSON.stringify({ image: dataUrl }),
          });
          
          const data = await res.json();
          
          if (data.success && data.data?.url) {
            setSettings(prev => ({ ...prev, avatar: data.data.url }));
            // Auto-save avatar
            await fetch(`${API_BASE}/api/profile/me`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-wallet-address': walletAddress,
              },
              body: JSON.stringify({ avatar: data.data.url }),
            });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000);
          } else {
            // Fallback to data URL if Cloudinary not configured
            setSettings(prev => ({ ...prev, avatar: dataUrl }));
          }
        } catch {
          // Fallback to data URL
          setSettings(prev => ({ ...prev, avatar: dataUrl }));
        }
        
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setAvatarUploading(false);
    }
  };

  // 2FA Setup
  const start2FASetup = async () => {
    if (!token || !walletAddress) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': walletAddress,
        },
      });
      
      const data = await res.json();
      
      if (data.success && data.data) {
        setTwoFaSetup({
          qrCode: data.data.qrCode,
          secret: data.data.secret,
        });
      } else {
        alert(data.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      console.error('2FA setup failed:', err);
      alert('Failed to setup 2FA');
    }
  };

  // Verify and Enable 2FA
  const verify2FA = async () => {
    if (!token || !walletAddress || !twoFaToken) return;
    
    if (twoFaToken.length !== 6) {
      alert('Please enter a 6-digit code');
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE}/api/2fa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ token: twoFaToken }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          security: { ...prev.security, twoFactorEnabled: true, twoFactorMethod: 'app' },
        }));
        setRecoveryCodes(data.data.recoveryCodes || []);
        setShowRecoveryCodes(true);
        setTwoFaSetup(null);
        setTwoFaToken('');
      } else {
        alert(data.message || 'Invalid code');
      }
    } catch (err) {
      console.error('2FA verify failed:', err);
      alert('Verification failed');
    }
  };

  // Disable 2FA
  const disable2FA = async () => {
    if (!token || !walletAddress) return;
    
    const code = prompt('Enter your 2FA code to disable:');
    if (!code) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/2fa/disable`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ token: code }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          security: { ...prev.security, twoFactorEnabled: false, twoFactorMethod: null },
        }));
        alert('2FA disabled successfully');
      } else {
        alert(data.message || 'Invalid code');
      }
    } catch (err) {
      console.error('2FA disable failed:', err);
      alert('Failed to disable 2FA');
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
    }
  };

  // Not hydrated yet
  if (!hydrated) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[{ title: 'Arena', link: '/arena' }, { title: 'Settings', link: '/arena/settings' }]} />
          <LoadingOverlay>
            <Loader2 className="animate-spin" size={24} />
            Loading...
          </LoadingOverlay>
        </Container>
      </PageWrapper>
    );
  }

  // Not connected
  if (!isConnected || !isAuthenticated) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[{ title: 'Arena', link: '/arena' }, { title: 'Settings', link: '/arena/settings' }]} />
          <ConnectPrompt>
            <PromptIcon><User /></PromptIcon>
            <PromptTitle>Sign In Required</PromptTitle>
            <PromptText>Connect and sign in with your wallet to access settings.</PromptText>
          </ConnectPrompt>
        </Container>
      </PageWrapper>
    );
  }

  // Loading
  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <BreadCrumbs items={[{ title: 'Arena', link: '/arena' }, { title: 'Settings', link: '/arena/settings' }]} />
          <LoadingOverlay>
            <Loader2 className="animate-spin" size={24} />
            Loading settings...
          </LoadingOverlay>
        </Container>
      </PageWrapper>
    );
  }

  const navItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'Profile', icon: <User /> },
    { key: 'socials', label: 'Social Links', icon: <Globe /> },
    { key: 'security', label: 'Security', icon: <Shield /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell /> },
    { key: 'privacy', label: 'Privacy', icon: <Eye /> },
  ];

  return (
    <PageWrapper>
      <Container>
        <BreadCrumbs items={[{ title: 'Arena', link: '/arena' }, { title: 'Settings', link: '/arena/settings' }]} />
        
        <PageTitle>Settings</PageTitle>
        <PageSubtitle>Manage your account settings and preferences</PageSubtitle>
        
        {saveStatus && (
          <SaveStatus $type={saveStatus}>
            {saveStatus === 'success' ? (
              <><Check /> Settings saved successfully</>
            ) : (
              <><AlertTriangle /> Failed to save settings</>
            )}
          </SaveStatus>
        )}
        
        <SettingsGrid>
          <Sidebar>
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                $active={activeTab === item.key}
                onClick={() => setActiveTab(item.key)}
                data-testid={`nav-${item.key}`}
              >
                {item.icon}
                {item.label}
              </NavItem>
            ))}
          </Sidebar>
          
          <MainContent>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <Section data-testid="profile-section">
                  <SectionTitle><User /> Profile Information</SectionTitle>
                  <SectionDescription>Update your personal information and public profile</SectionDescription>
                  
                  <AvatarSection>
                    <AvatarWrapper>
                      <Avatar 
                        src={settings.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`} 
                        alt="Avatar" 
                      />
                      <AvatarUploadButton>
                        {avatarUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera />}
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          disabled={avatarUploading}
                          data-testid="avatar-upload"
                        />
                      </AvatarUploadButton>
                    </AvatarWrapper>
                    <AvatarInfo>
                      <AvatarTitle>Profile Photo</AvatarTitle>
                      <AvatarSubtitle>
                        {avatarUploading ? 'Uploading...' : 'JPG, PNG or GIF. Max 2MB. Recommended 200x200px.'}
                      </AvatarSubtitle>
                    </AvatarInfo>
                  </AvatarSection>
                  
                  <FormGroup>
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter your username"
                      maxLength={30}
                      data-testid="username-input"
                    />
                    <CharCount>{settings.username.length}/30</CharCount>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Bio</Label>
                    <Textarea
                      value={settings.bio}
                      onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      maxLength={200}
                      data-testid="bio-input"
                    />
                    <CharCount>{settings.bio.length}/200</CharCount>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Email (optional)</Label>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      data-testid="email-input"
                    />
                  </FormGroup>
                </Section>
                
                <Section>
                  <SectionTitle><Wallet /> Connected Wallet</SectionTitle>
                  <SectionDescription>Your primary wallet for authentication and transactions</SectionDescription>
                  
                  <WalletCard>
                    <SecurityIcon $enabled>
                      <Wallet />
                    </SecurityIcon>
                    <WalletInfo>
                      <WalletAddress>
                        {shortAddress || walletAddress}
                        <IconButton onClick={copyAddress} data-testid="copy-wallet">
                          <Copy />
                        </IconButton>
                      </WalletAddress>
                      <WalletStatus>
                        <Check size={14} /> Connected
                      </WalletStatus>
                    </WalletInfo>
                  </WalletCard>
                </Section>
                
                <ButtonRow>
                  <Button onClick={saveSettings} disabled={saving} data-testid="save-profile-btn">
                    {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Check /> Save Changes</>}
                  </Button>
                  <Button $variant="secondary" onClick={() => router.push('/arena/profile')}>
                    View Profile
                  </Button>
                </ButtonRow>
              </>
            )}
            
            {/* Social Links Tab */}
            {activeTab === 'socials' && (
              <Section data-testid="socials-section">
                <SectionTitle><Globe /> Social Links</SectionTitle>
                <SectionDescription>Connect your social accounts to build trust and reach</SectionDescription>
                
                <FormGroup>
                  <Label>Twitter / X</Label>
                  <InputWithIcon>
                    <Twitter />
                    <Input
                      type="text"
                      value={settings.socials.twitter}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        socials: { ...prev.socials, twitter: e.target.value }
                      }))}
                      placeholder="@username"
                      data-testid="twitter-input"
                    />
                  </InputWithIcon>
                </FormGroup>
                
                <FormGroup>
                  <Label>Discord</Label>
                  <InputWithIcon>
                    <MessageCircle />
                    <Input
                      type="text"
                      value={settings.socials.discord}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        socials: { ...prev.socials, discord: e.target.value }
                      }))}
                      placeholder="username#0000"
                      data-testid="discord-input"
                    />
                  </InputWithIcon>
                </FormGroup>
                
                <FormGroup>
                  <Label>Telegram</Label>
                  <InputWithIcon>
                    <Send />
                    <Input
                      type="text"
                      value={settings.socials.telegram}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        socials: { ...prev.socials, telegram: e.target.value }
                      }))}
                      placeholder="@username"
                      data-testid="telegram-input"
                    />
                  </InputWithIcon>
                </FormGroup>
                
                <FormGroup>
                  <Label>Website</Label>
                  <InputWithIcon>
                    <ExternalLink />
                    <Input
                      type="url"
                      value={settings.socials.website}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev, 
                        socials: { ...prev.socials, website: e.target.value }
                      }))}
                      placeholder="https://yourwebsite.com"
                      data-testid="website-input"
                    />
                  </InputWithIcon>
                </FormGroup>
                
                <ButtonRow>
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Check /> Save Changes</>}
                  </Button>
                </ButtonRow>
              </Section>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <Section data-testid="security-section">
                  <SectionTitle><Shield /> Two-Factor Authentication</SectionTitle>
                  <SectionDescription>Add an extra layer of security to your account</SectionDescription>
                  
                  {/* 2FA Setup Flow */}
                  {twoFaSetup && !settings.security.twoFactorEnabled && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                        <img src={twoFaSetup.qrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
                      </div>
                      <div style={{ fontSize: '13px', color: '#738094', textAlign: 'center', marginBottom: '16px' }}>
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </div>
                      <div style={{ fontSize: '12px', background: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        Secret: {twoFaSetup.secret}
                      </div>
                      <FormGroup>
                        <Label>Enter 6-digit code from app</Label>
                        <Input
                          type="text"
                          value={twoFaToken}
                          onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
                          data-testid="2fa-code-input"
                        />
                      </FormGroup>
                      <ButtonRow>
                        <Button onClick={verify2FA} disabled={twoFaToken.length !== 6}>
                          <Check /> Verify & Enable
                        </Button>
                        <Button $variant="secondary" onClick={() => { setTwoFaSetup(null); setTwoFaToken(''); }}>
                          Cancel
                        </Button>
                      </ButtonRow>
                    </div>
                  )}
                  
                  {/* Recovery Codes Display */}
                  {showRecoveryCodes && recoveryCodes.length > 0 && (
                    <div style={{ marginBottom: '24px', padding: '20px', background: '#FEF3C7', borderRadius: '12px', border: '1px solid #F59E0B' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#92400E', fontWeight: '600' }}>
                        <AlertTriangle size={20} />
                        Save Your Recovery Codes!
                      </div>
                      <div style={{ fontSize: '13px', color: '#92400E', marginBottom: '16px' }}>
                        These codes can be used to access your account if you lose your authenticator. Save them somewhere safe!
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        {recoveryCodes.map((code, i) => (
                          <div key={i} style={{ fontFamily: 'monospace', fontSize: '14px', padding: '4px 8px', background: '#f5f5f5', borderRadius: '4px' }}>
                            {code}
                          </div>
                        ))}
                      </div>
                      <Button $variant="secondary" onClick={() => setShowRecoveryCodes(false)}>
                        I've Saved My Codes
                      </Button>
                    </div>
                  )}
                  
                  <SecurityCard>
                    <SecurityIcon $enabled={settings.security.twoFactorEnabled}>
                      <Smartphone />
                    </SecurityIcon>
                    <SecurityInfo>
                      <SecurityTitle>Authenticator App</SecurityTitle>
                      <SecurityStatus $enabled={settings.security.twoFactorEnabled}>
                        {settings.security.twoFactorEnabled ? 'Enabled' : 'Not configured'}
                      </SecurityStatus>
                    </SecurityInfo>
                    <Button 
                      $variant={settings.security.twoFactorEnabled ? 'danger' : 'primary'}
                      onClick={settings.security.twoFactorEnabled ? disable2FA : start2FASetup}
                      data-testid="2fa-toggle"
                    >
                      {settings.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </SecurityCard>
                  
                  <SecurityCard>
                    <SecurityIcon>
                      <Key />
                    </SecurityIcon>
                    <SecurityInfo>
                      <SecurityTitle>Recovery Codes</SecurityTitle>
                      <SecurityStatus>
                        {settings.security.twoFactorEnabled ? 'Available' : 'Enable 2FA first'}
                      </SecurityStatus>
                    </SecurityInfo>
                    <Button 
                      $variant="secondary"
                      disabled={!settings.security.twoFactorEnabled}
                      onClick={() => {
                        if (recoveryCodes.length > 0) {
                          setShowRecoveryCodes(true);
                        } else {
                          alert('Recovery codes are shown only once when enabling 2FA');
                        }
                      }}
                    >
                      View Codes
                    </Button>
                  </SecurityCard>
                </Section>
                
                <Section>
                  <SectionTitle><Lock /> Session Security</SectionTitle>
                  <SectionDescription>Manage your active sessions</SectionDescription>
                  
                  <WalletCard>
                    <SecurityIcon $enabled>
                      <Globe />
                    </SecurityIcon>
                    <WalletInfo>
                      <WalletAddress>Current Session</WalletAddress>
                      <WalletStatus>
                        <Check size={14} /> Active now
                      </WalletStatus>
                    </WalletInfo>
                  </WalletCard>
                  
                  <Button $variant="danger">
                    <LogOut /> Sign Out All Devices
                  </Button>
                </Section>
              </>
            )}
            
            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Section data-testid="notifications-section">
                <SectionTitle><Bell /> Notification Preferences</SectionTitle>
                <SectionDescription>Choose how you want to be notified</SectionDescription>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Email Notifications</ToggleTitle>
                    <ToggleDescription>Receive important updates via email</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.email}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: !prev.notifications.email }
                    }))}
                    data-testid="toggle-email"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Push Notifications</ToggleTitle>
                    <ToggleDescription>Get instant alerts in your browser</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.push}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, push: !prev.notifications.push }
                    }))}
                    data-testid="toggle-push"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Trade Alerts</ToggleTitle>
                    <ToggleDescription>Notifications about your positions and trades</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.trades}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, trades: !prev.notifications.trades }
                    }))}
                    data-testid="toggle-trades"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Mentions & Replies</ToggleTitle>
                    <ToggleDescription>When someone mentions or replies to you</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.mentions}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, mentions: !prev.notifications.mentions }
                    }))}
                    data-testid="toggle-mentions"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Marketing Updates</ToggleTitle>
                    <ToggleDescription>News, features, and promotional content</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.notifications.marketing}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, marketing: !prev.notifications.marketing }
                    }))}
                    data-testid="toggle-marketing"
                  />
                </ToggleRow>
                
                <ButtonRow>
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Check /> Save Preferences</>}
                  </Button>
                </ButtonRow>
              </Section>
            )}
            
            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <Section data-testid="privacy-section">
                <SectionTitle><Eye /> Privacy Settings</SectionTitle>
                <SectionDescription>Control what others can see on your profile</SectionDescription>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Show Balance</ToggleTitle>
                    <ToggleDescription>Display your portfolio value publicly</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.privacy.showBalance}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showBalance: !prev.privacy.showBalance }
                    }))}
                    data-testid="toggle-balance"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Show Activity</ToggleTitle>
                    <ToggleDescription>Let others see your recent activity</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.privacy.showActivity}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showActivity: !prev.privacy.showActivity }
                    }))}
                    data-testid="toggle-activity"
                  />
                </ToggleRow>
                
                <ToggleRow>
                  <ToggleInfo>
                    <ToggleTitle>Show Positions</ToggleTitle>
                    <ToggleDescription>Make your positions visible to others</ToggleDescription>
                  </ToggleInfo>
                  <Toggle
                    $enabled={settings.privacy.showPositions}
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, showPositions: !prev.privacy.showPositions }
                    }))}
                    data-testid="toggle-positions"
                  />
                </ToggleRow>
                
                <ButtonRow>
                  <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <><Loader2 className="animate-spin" /> Saving...</> : <><Check /> Save Preferences</>}
                  </Button>
                </ButtonRow>
              </Section>
            )}
          </MainContent>
        </SettingsGrid>
      </Container>
    </PageWrapper>
  );
}

// Missing import
const LogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
