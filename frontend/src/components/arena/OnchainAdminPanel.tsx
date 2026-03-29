'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Shield, Plus, Check, X, Loader2, AlertCircle, 
  ExternalLink, Lock, AlertTriangle, CheckCircle,
  XCircle, RefreshCw, Settings, Users, Eye
} from 'lucide-react';
import { useWallet } from '@/lib/wagmi';
import { usePredictionMarket, MarketStatus, RequestStatus } from '@/lib/contracts';
import * as PredictionMarket from '@/lib/contracts/predictionMarket';
import { CHAIN_CONFIG, MARKET_STATUS_LABELS, MARKET_STATUS_COLORS } from '@/lib/contracts/config';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RoleBadge = styled.span<{ $role: 'owner' | 'admin' | 'resolver' }>`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  
  ${({ $role }) => {
    switch ($role) {
      case 'owner':
        return `background: rgba(139, 92, 246, 0.2); color: #a78bfa;`;
      case 'admin':
        return `background: rgba(59, 130, 246, 0.2); color: #60a5fa;`;
      case 'resolver':
        return `background: rgba(236, 72, 153, 0.2); color: #f472b6;`;
    }
  }}
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  overflow-x: auto;
`;

const Tab = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border: none;
  
  ${({ $active }) => $active ? `
    background: rgba(0, 255, 136, 0.15);
    color: #00ff88;
  ` : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }
  `}
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Form = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #00ff88;
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #00ff88;
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'warning' | 'secondary' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
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
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          &:hover:not(:disabled) { background: rgba(245, 158, 11, 0.25); }
        `;
      case 'secondary':
        return `
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.15); }
        `;
      default:
        return `
          background: linear-gradient(135deg, #00ff88, #00cc66);
          color: #000;
          &:hover:not(:disabled) {
            transform: scale(1.02);
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CardTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  margin: 0;
`;

const CardMeta = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
`;

const StatusBadge = styled.span<{ $color: string }>`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ $color }) => `${$color}20`};
  color: ${({ $color }) => $color};
`;

const LoadingSpinner = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
`;

const Alert = styled.div<{ $type: 'success' | 'error' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 16px;
  
  ${({ $type }) => {
    switch ($type) {
      case 'success':
        return `background: rgba(0, 255, 136, 0.1); color: #00ff88;`;
      case 'error':
        return `background: rgba(239, 68, 68, 0.1); color: #f87171;`;
      case 'warning':
        return `background: rgba(245, 158, 11, 0.1); color: #fbbf24;`;
    }
  }}
`;

const NoAccess = styled.div`
  text-align: center;
  padding: 48px;
  color: rgba(255, 255, 255, 0.5);
  
  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  h3 {
    font-size: 18px;
    color: #fff;
    margin-bottom: 8px;
  }
`;

const OutcomeInputs = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const OutcomeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const RemoveButton = styled.button`
  background: rgba(239, 68, 68, 0.15);
  border: none;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: #f87171;
  
  &:hover {
    background: rgba(239, 68, 68, 0.25);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

type TabType = 'create' | 'requests' | 'resolve' | 'roles';

interface AdminPanelProps {
  onMarketCreated?: (marketId: number) => void;
}

export const OnchainAdminPanel: React.FC<AdminPanelProps> = ({ onMarketCreated }) => {
  const { isAuthenticated, walletAddress } = useWallet();
  const { 
    roles, 
    config,
    marketAddress,
    createMarket,
    approveMarketRequest,
    rejectMarketRequest,
    lockMarket,
    disputeMarket,
    resolveMarket,
    cancelMarket,
    setAdmin,
    setResolver,
    loading,
    error,
    refresh
  } = usePredictionMarket();
  
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Create Market Form
  const [question, setQuestion] = useState('');
  const [outcomes, setOutcomes] = useState(['Yes', 'No']);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // Resolve Market Form
  const [resolveMarketId, setResolveMarketId] = useState('');
  const [resolveOutcome, setResolveOutcome] = useState('0');

  // Role Management Form
  const [roleAddress, setRoleAddress] = useState('');

  const hasAccess = roles.isOwner || roles.isAdmin || roles.isResolver;

  const showAlert = (type: 'success' | 'error' | 'warning', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleCreateMarket = async () => {
    if (!question || outcomes.length < 2 || !endDate || !endTime) {
      showAlert('error', 'Please fill all required fields');
      return;
    }

    const endTimestamp = Math.floor(new Date(`${endDate}T${endTime}`).getTime() / 1000);
    if (endTimestamp <= Math.floor(Date.now() / 1000)) {
      showAlert('error', 'End time must be in the future');
      return;
    }

    setActionLoading(true);
    const result = await createMarket(endTimestamp, question, outcomes);
    
    if (result.ok) {
      const marketIdResult = await PredictionMarket.extractCreatedMarketId(marketAddress, result.receipt);
      const marketId = marketIdResult.ok ? marketIdResult.data : 0;
      showAlert('success', `Market #${marketId} created successfully!`);
      onMarketCreated?.(marketId);
      // Reset form
      setQuestion('');
      setOutcomes(['Yes', 'No']);
      setEndDate('');
      setEndTime('');
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleLockMarket = async () => {
    if (!resolveMarketId) return;
    setActionLoading(true);
    const result = await lockMarket(parseInt(resolveMarketId));
    if (result.ok) {
      showAlert('success', `Market #${resolveMarketId} locked`);
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleResolveMarket = async () => {
    if (!resolveMarketId) return;
    setActionLoading(true);
    const result = await resolveMarket(parseInt(resolveMarketId), parseInt(resolveOutcome));
    if (result.ok) {
      showAlert('success', `Market #${resolveMarketId} resolved with outcome ${resolveOutcome}`);
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleDisputeMarket = async () => {
    if (!resolveMarketId) return;
    setActionLoading(true);
    const result = await disputeMarket(parseInt(resolveMarketId));
    if (result.ok) {
      showAlert('success', `Market #${resolveMarketId} disputed`);
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleCancelMarket = async () => {
    if (!resolveMarketId) return;
    setActionLoading(true);
    const result = await cancelMarket(parseInt(resolveMarketId));
    if (result.ok) {
      showAlert('success', `Market #${resolveMarketId} cancelled`);
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleSetAdmin = async (allowed: boolean) => {
    if (!roleAddress) return;
    setActionLoading(true);
    const result = await setAdmin(roleAddress, allowed);
    if (result.ok) {
      showAlert('success', `Admin ${allowed ? 'added' : 'removed'}: ${roleAddress.slice(0, 10)}...`);
      setRoleAddress('');
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const handleSetResolver = async (allowed: boolean) => {
    if (!roleAddress) return;
    setActionLoading(true);
    const result = await setResolver(roleAddress, allowed);
    if (result.ok) {
      showAlert('success', `Resolver ${allowed ? 'added' : 'removed'}: ${roleAddress.slice(0, 10)}...`);
      setRoleAddress('');
    } else {
      showAlert('error', 'error' in result ? result.error : 'Unknown error');
    }
    setActionLoading(false);
  };

  const addOutcome = () => {
    if (outcomes.length < 10) {
      setOutcomes([...outcomes, '']);
    }
  };

  const removeOutcome = (index: number) => {
    if (outcomes.length > 2) {
      setOutcomes(outcomes.filter((_, i) => i !== index));
    }
  };

  const updateOutcome = (index: number, value: string) => {
    const newOutcomes = [...outcomes];
    newOutcomes[index] = value;
    setOutcomes(newOutcomes);
  };

  if (!isAuthenticated) {
    return (
      <Container>
        <NoAccess>
          <Shield size={48} />
          <h3>Connect Wallet</h3>
          <p>Connect your wallet to access admin functions</p>
        </NoAccess>
      </Container>
    );
  }

  if (!hasAccess) {
    return (
      <Container>
        <NoAccess>
          <AlertTriangle size={48} />
          <h3>Access Denied</h3>
          <p>You don't have admin, resolver, or owner permissions</p>
        </NoAccess>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={24} color="#00ff88" />
          Smart Contract Admin
        </Title>
        <div style={{ display: 'flex', gap: '8px' }}>
          {roles.isOwner && <RoleBadge $role="owner">Owner</RoleBadge>}
          {roles.isAdmin && <RoleBadge $role="admin">Admin</RoleBadge>}
          {roles.isResolver && <RoleBadge $role="resolver">Resolver</RoleBadge>}
        </div>
      </Header>

      {alert && (
        <Alert $type={alert.type}>
          {alert.type === 'success' && <CheckCircle size={16} />}
          {alert.type === 'error' && <XCircle size={16} />}
          {alert.type === 'warning' && <AlertTriangle size={16} />}
          {alert.message}
        </Alert>
      )}

      <TabsContainer>
        {(roles.isAdmin || roles.isOwner) && (
          <Tab $active={activeTab === 'create'} onClick={() => setActiveTab('create')}>
            <Plus size={16} />
            Create Market
          </Tab>
        )}
        {(roles.isAdmin || roles.isOwner) && (
          <Tab $active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
            <Eye size={16} />
            Requests
          </Tab>
        )}
        {(roles.isResolver || roles.isOwner) && (
          <Tab $active={activeTab === 'resolve'} onClick={() => setActiveTab('resolve')}>
            <CheckCircle size={16} />
            Resolve
          </Tab>
        )}
        {roles.isOwner && (
          <Tab $active={activeTab === 'roles'} onClick={() => setActiveTab('roles')}>
            <Users size={16} />
            Roles
          </Tab>
        )}
      </TabsContainer>

      {/* Create Market Tab */}
      {activeTab === 'create' && (roles.isAdmin || roles.isOwner) && (
        <Section>
          <SectionTitle>
            <Plus size={18} />
            Create New Market
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Label>Question *</Label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Will Bitcoin reach $100k by end of 2026?"
              />
            </FormGroup>

            <FormGroup>
              <Label>Outcomes *</Label>
              <OutcomeInputs>
                {outcomes.map((outcome, index) => (
                  <OutcomeRow key={index}>
                    <Input
                      value={outcome}
                      onChange={(e) => updateOutcome(index, e.target.value)}
                      placeholder={`Outcome ${index + 1}`}
                    />
                    {outcomes.length > 2 && (
                      <RemoveButton onClick={() => removeOutcome(index)}>
                        <X size={14} />
                      </RemoveButton>
                    )}
                  </OutcomeRow>
                ))}
                {outcomes.length < 10 && (
                  <AddButton onClick={addOutcome}>
                    <Plus size={14} />
                    Add Outcome
                  </AddButton>
                )}
              </OutcomeInputs>
            </FormGroup>

            <FormGroup>
              <Label>End Date & Time *</Label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </FormGroup>

            <Button 
              onClick={handleCreateMarket} 
              disabled={actionLoading || !question || outcomes.length < 2 || !endDate || !endTime}
            >
              {actionLoading ? <LoadingSpinner size={16} /> : <Plus size={16} />}
              Create Market
            </Button>
          </Form>
        </Section>
      )}

      {/* Resolve Tab */}
      {activeTab === 'resolve' && (roles.isResolver || roles.isOwner) && (
        <Section>
          <SectionTitle>
            <CheckCircle size={18} />
            Market Resolution
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Label>Market ID</Label>
              <Input
                type="number"
                value={resolveMarketId}
                onChange={(e) => setResolveMarketId(e.target.value)}
                placeholder="Enter market ID"
              />
            </FormGroup>

            <FormGroup>
              <Label>Winning Outcome Index</Label>
              <Input
                type="number"
                value={resolveOutcome}
                onChange={(e) => setResolveOutcome(e.target.value)}
                placeholder="0 for first outcome, 1 for second, etc."
                min="0"
              />
            </FormGroup>

            <ButtonRow>
              <Button 
                $variant="warning"
                onClick={handleLockMarket}
                disabled={actionLoading || !resolveMarketId}
              >
                {actionLoading ? <LoadingSpinner size={16} /> : <Lock size={16} />}
                Lock Market
              </Button>
              
              <Button 
                onClick={handleResolveMarket}
                disabled={actionLoading || !resolveMarketId}
              >
                {actionLoading ? <LoadingSpinner size={16} /> : <Check size={16} />}
                Resolve
              </Button>
              
              <Button 
                $variant="danger"
                onClick={handleDisputeMarket}
                disabled={actionLoading || !resolveMarketId}
              >
                {actionLoading ? <LoadingSpinner size={16} /> : <AlertTriangle size={16} />}
                Dispute
              </Button>
              
              <Button 
                $variant="secondary"
                onClick={handleCancelMarket}
                disabled={actionLoading || !resolveMarketId}
              >
                {actionLoading ? <LoadingSpinner size={16} /> : <XCircle size={16} />}
                Cancel
              </Button>
            </ButtonRow>
          </Form>
        </Section>
      )}

      {/* Roles Tab (Owner Only) */}
      {activeTab === 'roles' && roles.isOwner && (
        <Section>
          <SectionTitle>
            <Users size={18} />
            Role Management
          </SectionTitle>
          
          <Form>
            <FormGroup>
              <Label>Wallet Address</Label>
              <Input
                value={roleAddress}
                onChange={(e) => setRoleAddress(e.target.value)}
                placeholder="0x..."
              />
            </FormGroup>

            <ButtonRow>
              <Button 
                onClick={() => handleSetAdmin(true)}
                disabled={actionLoading || !roleAddress}
              >
                Add Admin
              </Button>
              <Button 
                $variant="danger"
                onClick={() => handleSetAdmin(false)}
                disabled={actionLoading || !roleAddress}
              >
                Remove Admin
              </Button>
              <Button 
                $variant="warning"
                onClick={() => handleSetResolver(true)}
                disabled={actionLoading || !roleAddress}
              >
                Add Resolver
              </Button>
              <Button 
                $variant="secondary"
                onClick={() => handleSetResolver(false)}
                disabled={actionLoading || !roleAddress}
              >
                Remove Resolver
              </Button>
            </ButtonRow>
          </Form>

          <Card>
            <CardTitle>Contract Configuration</CardTitle>
            <CardMeta>
              {config && (
                <>
                  <p>Min Bet: {config.minBetFormatted} USDT</p>
                  <p>Claim Fee: {config.claimFeeBps / 100}%</p>
                  <p>Fee Recipient: {config.feeRecipient.slice(0, 10)}...</p>
                  <p>User Requests: {config.userMarketRequestsEnabled ? 'Enabled' : 'Disabled'}</p>
                </>
              )}
            </CardMeta>
          </Card>
        </Section>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (roles.isAdmin || roles.isOwner) && (
        <Section>
          <SectionTitle>
            <Eye size={18} />
            Market Requests
          </SectionTitle>
          <Card>
            <CardTitle>Pending Requests</CardTitle>
            <CardMeta>
              Approve or reject user market requests here.
              (Implementation depends on backend integration to fetch pending requests)
            </CardMeta>
          </Card>
        </Section>
      )}
    </Container>
  );
};

export default OnchainAdminPanel;
