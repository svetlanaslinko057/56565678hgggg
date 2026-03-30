'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell, Zap, Anchor, Clock, Trophy, Swords } from 'lucide-react';

const Container = styled.div`
  background: rgba(30, 30, 40, 0.95);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const SettingInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled.div<{ $color?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => $color || 'rgba(255, 255, 255, 0.1)'};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 18px;
    height: 18px;
    color: #fff;
  }
`;

const SettingLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #fff;
`;

const SettingDescription = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
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

const SliderValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #00c8ff;
`;

const CounterBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 200, 255, 0.1);
  color: #00c8ff;
  border-radius: 10px;
  font-weight: 500;
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00c8ff, #0090ff);
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
    box-shadow: 0 4px 20px rgba(0, 200, 255, 0.3);
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
 * Settings for push notifications:
 * - Toggle notification types
 * - Set thresholds
 * - Rate limit control
 */
export const NotificationSettingsPanel: React.FC<Props> = ({
  wallet,
  initialSettings,
  onSave,
}) => {
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

  useEffect(() => {
    // Fetch current settings
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
    <Container data-testid="notification-settings-panel">
      <Header>
        <Bell size={20} color="#00c8ff" />
        <Title>Push Notifications</Title>
      </Header>

      <Section>
        <SectionTitle>Alert Types</SectionTitle>
        
        <SettingRow>
          <SettingInfo>
            <IconWrapper $color="rgba(156, 39, 176, 0.2)">
              <Zap />
            </IconWrapper>
            <div>
              <SettingLabel>Edge Alerts</SettingLabel>
              <SettingDescription>When edge jumps above threshold</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.edgeAlerts}
            onCheckedChange={() => handleToggle('edgeAlerts')}
            data-testid="toggle-edge-alerts"
          />
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <IconWrapper $color="rgba(255, 193, 7, 0.2)">
              <Anchor />
            </IconWrapper>
            <div>
              <SettingLabel>Whale Alerts</SettingLabel>
              <SettingDescription>Big bets on watched markets</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.whaleAlerts}
            onCheckedChange={() => handleToggle('whaleAlerts')}
            data-testid="toggle-whale-alerts"
          />
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <IconWrapper $color="rgba(255, 87, 87, 0.2)">
              <Clock />
            </IconWrapper>
            <div>
              <SettingLabel>Closing Alerts</SettingLabel>
              <SettingDescription>Before markets close</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.closingAlerts}
            onCheckedChange={() => handleToggle('closingAlerts')}
            data-testid="toggle-closing-alerts"
          />
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <IconWrapper $color="rgba(0, 255, 136, 0.2)">
              <Trophy />
            </IconWrapper>
            <div>
              <SettingLabel>Win Alerts</SettingLabel>
              <SettingDescription>When you win a bet</SettingDescription>
            </div>
          </SettingInfo>
          <Switch
            checked={settings.winAlerts}
            onCheckedChange={() => handleToggle('winAlerts')}
            data-testid="toggle-win-alerts"
          />
        </SettingRow>

        <SettingRow>
          <SettingInfo>
            <IconWrapper $color="rgba(255, 107, 107, 0.2)">
              <Swords />
            </IconWrapper>
            <div>
              <SettingLabel>Rival Alerts</SettingLabel>
              <SettingDescription>Duel challenges and results</SettingDescription>
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
        <SectionTitle>Thresholds</SectionTitle>
        
        <SliderRow>
          <SliderLabel>
            <SettingLabel>Max Daily Notifications</SettingLabel>
            <SliderValue>{settings.maxDailyNotifications}/day</SliderValue>
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
            <SettingLabel>Edge Threshold</SettingLabel>
            <SliderValue>+{settings.edgeThreshold}%</SliderValue>
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
            <SettingLabel>Whale Threshold</SettingLabel>
            <SliderValue>${settings.whaleThreshold}+</SliderValue>
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
      >
        {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
      </SaveButton>
    </Container>
  );
};

export default NotificationSettingsPanel;
