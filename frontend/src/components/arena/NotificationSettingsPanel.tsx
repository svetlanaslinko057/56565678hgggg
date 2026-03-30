'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Zap, Anchor, Clock, Trophy, Swords } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

const Container = styled.div<{ $bgColor: string; $borderColor: string }>`
  background: ${props => props.$bgColor};
  border-radius: 16px;
  padding: 20px;
  border: 1px solid ${props => props.$borderColor};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const Title = styled.h3<{ $textColor: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.$textColor};
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4<{ $textColor: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.$textColor};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
`;

const SettingRow = styled.div<{ $borderColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${props => props.$borderColor};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled.div<{ $color?: string; $iconColor: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => $color || 'rgba(0, 0, 0, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.$iconColor};
  }
`;

const SettingLabel = styled.div<{ $textColor: string }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.$textColor};
`;

const SettingDescription = styled.div<{ $textColor: string }>`
  font-size: 12px;
  color: ${props => props.$textColor};
  margin-top: 2px;
`;

const SliderRow = styled.div`
  padding: 12px 0;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const SliderValue = styled.span<{ $accentColor: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.$accentColor};
`;

const SaveButton = styled.button<{ $accentColor: string }>`
  width: 100%;
  padding: 14px;
  background: ${props => props.$accentColor};
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
  
  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface NotificationSettings {
  edgeAlerts: boolean;
  whaleAlerts: boolean;
  closingAlerts: boolean;
  winAlerts: boolean;
  rivalAlerts: boolean;
  maxDailyNotifications: number;
  edgeThreshold: number;
  whaleThreshold: number;
}

interface Props {
  wallet: string;
  initialSettings?: Partial<NotificationSettings>;
  onSave?: (settings: NotificationSettings) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * NotificationSettingsPanel
 * 
 * Settings for push notifications with theme support
 */
export const NotificationSettingsPanel: React.FC<Props> = ({
  wallet,
  initialSettings,
  onSave,
}) => {
  const { theme, mode } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>({
    edgeAlerts: true,
    whaleAlerts: true,
    closingAlerts: true,
    winAlerts: true,
    rivalAlerts: true,
    maxDailyNotifications: 5,
    edgeThreshold: 10,
    whaleThreshold: 100,
    ...initialSettings,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Theme-aware colors
  const isDark = mode === 'dark';
  const iconColors = {
    edge: isDark ? '#9c27b0' : '#7b1fa2',
    whale: isDark ? '#ffc107' : '#f9a825',
    closing: isDark ? '#ff5757' : '#e53935',
    win: isDark ? '#00ff88' : '#00c853',
    rival: isDark ? '#ff6b6b' : '#ef5350',
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/push/subscriptions/${wallet}`);
        const data = await res.json();
        if (data.success && data.data?.settings) {
          setSettings(prev => ({ ...prev, ...data.data.settings }));
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    
    if (wallet) {
      fetchSettings();
    }
  }, [wallet]);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSliderChange = (key: keyof NotificationSettings, value: number[]) => {
    setSettings(prev => ({ ...prev, [key]: value[0] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/push/subscriptions/${wallet}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setSaved(true);
        onSave?.(settings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container 
      data-testid="notification-settings-panel"
      $bgColor={theme.bgCard}
      $borderColor={theme.border}
    >
      <Header>
        <Bell size={20} color={theme.accent} />
        <Title $textColor={theme.textPrimary}>Push Notifications</Title>
      </Header>

      <Section>
        <SectionTitle $textColor={theme.textMuted}>Alert Types</SectionTitle>
        
        <SettingRow $borderColor={theme.borderLight}>
          <SettingInfo>
            <IconWrapper $color={`${iconColors.edge}20`} $iconColor={iconColors.edge}>
              <Zap />
            </IconWrapper>
            <div>
              <SettingLabel $textColor={theme.textPrimary}>Edge Alerts</SettingLabel>
              <SettingDescription $textColor={theme.textMuted}>When edge jumps above threshold</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.edgeAlerts}
            onCheckedChange={() => handleToggle('edgeAlerts')}
            data-testid="toggle-edge-alerts"
          />
        </SettingRow>

        <SettingRow $borderColor={theme.borderLight}>
          <SettingInfo>
            <IconWrapper $color={`${iconColors.whale}20`} $iconColor={iconColors.whale}>
              <Anchor />
            </IconWrapper>
            <div>
              <SettingLabel $textColor={theme.textPrimary}>Whale Alerts</SettingLabel>
              <SettingDescription $textColor={theme.textMuted}>Big bets on watched markets</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.whaleAlerts}
            onCheckedChange={() => handleToggle('whaleAlerts')}
            data-testid="toggle-whale-alerts"
          />
        </SettingRow>

        <SettingRow $borderColor={theme.borderLight}>
          <SettingInfo>
            <IconWrapper $color={`${iconColors.closing}20`} $iconColor={iconColors.closing}>
              <Clock />
            </IconWrapper>
            <div>
              <SettingLabel $textColor={theme.textPrimary}>Closing Alerts</SettingLabel>
              <SettingDescription $textColor={theme.textMuted}>Before markets close</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.closingAlerts}
            onCheckedChange={() => handleToggle('closingAlerts')}
            data-testid="toggle-closing-alerts"
          />
        </SettingRow>

        <SettingRow $borderColor={theme.borderLight}>
          <SettingInfo>
            <IconWrapper $color={`${iconColors.win}20`} $iconColor={iconColors.win}>
              <Trophy />
            </IconWrapper>
            <div>
              <SettingLabel $textColor={theme.textPrimary}>Win Alerts</SettingLabel>
              <SettingDescription $textColor={theme.textMuted}>When you win a bet</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.winAlerts}
            onCheckedChange={() => handleToggle('winAlerts')}
            data-testid="toggle-win-alerts"
          />
        </SettingRow>

        <SettingRow $borderColor={theme.borderLight}>
          <SettingInfo>
            <IconWrapper $color={`${iconColors.rival}20`} $iconColor={iconColors.rival}>
              <Swords />
            </IconWrapper>
            <div>
              <SettingLabel $textColor={theme.textPrimary}>Rival Alerts</SettingLabel>
              <SettingDescription $textColor={theme.textMuted}>Duel challenges and results</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.rivalAlerts}
            onCheckedChange={() => handleToggle('rivalAlerts')}
            data-testid="toggle-rival-alerts"
          />
        </SettingRow>
      </Section>

      <Section>
        <SectionTitle $textColor={theme.textMuted}>Thresholds</SectionTitle>
        
        <SliderRow>
          <SliderLabel>
            <SettingLabel $textColor={theme.textPrimary}>Max Daily Notifications</SettingLabel>
            <SliderValue $accentColor={theme.accent}>{settings.maxDailyNotifications}/day</SliderValue>
          </SliderLabel>
          <Slider
            value={[settings.maxDailyNotifications]}
            onValueChange={(v) => handleSliderChange('maxDailyNotifications', v)}
            min={1}
            max={10}
            step={1}
            data-testid="slider-max-daily"
          />
        </SliderRow>

        <SliderRow>
          <SliderLabel>
            <SettingLabel $textColor={theme.textPrimary}>Edge Threshold</SettingLabel>
            <SliderValue $accentColor={theme.accent}>+{settings.edgeThreshold}%</SliderValue>
          </SliderLabel>
          <Slider
            value={[settings.edgeThreshold]}
            onValueChange={(v) => handleSliderChange('edgeThreshold', v)}
            min={5}
            max={30}
            step={5}
            data-testid="slider-edge-threshold"
          />
        </SliderRow>

        <SliderRow>
          <SliderLabel>
            <SettingLabel $textColor={theme.textPrimary}>Whale Threshold</SettingLabel>
            <SliderValue $accentColor={theme.accent}>${settings.whaleThreshold}+</SliderValue>
          </SliderLabel>
          <Slider
            value={[settings.whaleThreshold]}
            onValueChange={(v) => handleSliderChange('whaleThreshold', v)}
            min={50}
            max={500}
            step={50}
            data-testid="slider-whale-threshold"
          />
        </SliderRow>
      </Section>

      <SaveButton
        onClick={handleSave}
        disabled={loading || saved}
        data-testid="save-notification-settings"
        $accentColor={theme.accent}
      >
        {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
      </SaveButton>
    </Container>
  );
};

export default NotificationSettingsPanel;
