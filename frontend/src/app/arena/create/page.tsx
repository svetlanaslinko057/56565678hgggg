'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PageWrapper } from '@/projects/Connection/styles';
import BreadCrumbs from '@/global/BreadCrumbs';
import { useArena } from '@/lib/api/ArenaContext';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Calendar, DollarSign, AlertTriangle, Zap, Info } from 'lucide-react';
import EnglishDateTimePicker from '@/components/ui/EnglishDateTimePicker';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #738094;
`;

const StakeNotice = styled.div`
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border: 1px solid #F59E0B;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StakeInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #92400E;
    margin-bottom: 4px;
  }
  
  p {
    font-size: 13px;
    color: #B45309;
  }
`;

const StakeAmount = styled.div`
  background: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #92400E;
`;

const FormCard = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #eef1f5;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #738094;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  background: #fff;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
`;

const OutcomeRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
`;

const OutcomeInput = styled(Input)`
  flex: 1;
`;

const RemoveBtn = styled.button`
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #FEE2E2;
  color: #DC2626;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #FECACA;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AddOutcomeBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px dashed #05A584;
  background: transparent;
  color: #05A584;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #E6F7F3;
  }
`;

const OracleSection = styled.div`
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
`;

const OracleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;
`;

const Button = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${({ $primary }) => $primary ? `
    background: #05A584;
    color: #fff;
    border: none;
    
    &:hover {
      background: #048a6e;
    }
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    
    &:hover {
      border-color: #05A584;
      color: #05A584;
    }
  `}
  
  ${({ $danger }) => $danger && `
    background: #FEE2E2;
    color: #DC2626;
    border: none;
    
    &:hover {
      background: #FECACA;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #DC2626;
  font-size: 13px;
  margin-top: 8px;
`;

const InfoTip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 8px;
  font-size: 13px;
  color: #738094;
  margin-top: 12px;
  
  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

interface Outcome {
  id: string;
  label: string;
}

export default function CreateMarketPage() {
  const router = useRouter();
  const { currentWallet, balance, refreshBalance } = useArena();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState({ creationStake: 100 });

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [type, setType] = useState('single');
  const [closeTime, setCloseTime] = useState('');
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ]);
  const [resolutionType, setResolutionType] = useState('manual');
  const [oracleAsset, setOracleAsset] = useState('BTC');
  const [oracleOperator, setOracleOperator] = useState('>');
  const [oracleValue, setOracleValue] = useState('');

  useEffect(() => {
    // Fetch config
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/config`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setConfig(data.data);
        }
      })
      .catch(() => {});
      
    // Set default close time (7 days from now)
    const defaultClose = new Date();
    defaultClose.setDate(defaultClose.getDate() + 7);
    setCloseTime(defaultClose.toISOString().slice(0, 16));
  }, []);

  const addOutcome = () => {
    const id = `outcome_${Date.now()}`;
    setOutcomes([...outcomes, { id, label: '' }]);
  };

  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter(o => o.id !== id));
  };

  const updateOutcome = (id: string, label: string) => {
    setOutcomes(outcomes.map(o => o.id === id ? { ...o, label } : o));
  };

  const handleSubmit = async (action: 'draft' | 'submit') => {
    setError('');
    
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (outcomes.some(o => !o.label.trim())) {
      setError('All outcomes must have labels');
      return;
    }
    if (!closeTime) {
      setError('Close time is required');
      return;
    }
    if (new Date(closeTime) <= new Date()) {
      setError('Close time must be in the future');
      return;
    }
    if (!currentWallet) {
      setError('Please start a demo session first');
      return;
    }
    
    // For testnet (BSC Testnet chain ID 97), skip balance check
    const isTestnet = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') === 97;
    if (!isTestnet && balance < config.creationStake) {
      setError(`Insufficient balance. Need ${config.creationStake} USDT`);
      return;
    }

    setLoading(true);

    try {
      // Create draft
      const payload: any = {
        title,
        description,
        category,
        type,
        closeTime: new Date(closeTime).toISOString(),
        outcomes,
        resolutionType,
      };

      if (resolutionType === 'oracle' && oracleValue) {
        payload.oracleConfig = {
          source: 'coingecko',
          asset: oracleAsset,
          operator: oracleOperator,
          value: parseFloat(oracleValue),
        };
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': currentWallet,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create draft');
      }

      // If action is submit, also submit for review
      if (action === 'submit') {
        const submitResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/${data.data._id}/submit`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Wallet-Address': currentWallet,
            },
          }
        );
        
        const submitData = await submitResponse.json();
        if (!submitData.success) {
          throw new Error(submitData.message || 'Failed to submit');
        }
      }

      await refreshBalance();
      router.push('/arena/my-markets');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const crumbs = [
    { title: 'Arena', link: '/' },
    { title: 'Create Market', link: '' },
  ];

  if (!currentWallet) {
    return (
      <PageWrapper>
        <Container>
          <Header>
            <Title>Create Prediction Market</Title>
            <Subtitle>Please start a demo session to create markets</Subtitle>
          </Header>
          <Button $primary onClick={() => router.push('/')}>
            Go to Arena
          </Button>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <Container>
        <Header>
          <Title data-testid="create-market-title">Create Prediction Market</Title>
          <Subtitle>Create your own prediction market and earn if it gets approved</Subtitle>
        </Header>

        <StakeNotice>
          <DollarSign size={24} color="#92400E" />
          <StakeInfo>
            <h4>Creation Stake Required</h4>
            <p>Your stake will be returned when your market is approved. May be burned if rejected for spam.</p>
          </StakeInfo>
          <StakeAmount data-testid="stake-amount">${config.creationStake}</StakeAmount>
        </StakeNotice>

        <FormCard>
          <SectionTitle>
            <Zap size={18} color="#05A584" />
            Market Details
          </SectionTitle>

          <FormGroup>
            <Label>Question / Title *</Label>
            <Input
              type="text"
              placeholder="Will BTC reach $150,000 by end of 2026?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="market-title-input"
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              placeholder="Provide additional context about your prediction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="market-description-input"
            />
          </FormGroup>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <FormGroup>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="crypto">Crypto</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="gaming">Gaming</option>
                <option value="ai">AI</option>
                <option value="other">Other</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Close Time *</Label>
              <EnglishDateTimePicker
                value={closeTime}
                onChange={(val) => setCloseTime(val)}
                placeholder="dd.mm.yyyy"
              />
            </FormGroup>
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Outcomes</SectionTitle>
          
          {outcomes.map((outcome, index) => (
            <OutcomeRow key={outcome.id}>
              <OutcomeInput
                placeholder={`Outcome ${index + 1}`}
                value={outcome.label}
                onChange={(e) => updateOutcome(outcome.id, e.target.value)}
                data-testid={`outcome-${index}-input`}
              />
              <RemoveBtn
                onClick={() => removeOutcome(outcome.id)}
                disabled={outcomes.length <= 2}
              >
                <Trash2 size={16} />
              </RemoveBtn>
            </OutcomeRow>
          ))}
          
          <AddOutcomeBtn onClick={addOutcome} data-testid="add-outcome-btn">
            <Plus size={16} />
            Add Outcome
          </AddOutcomeBtn>

          <InfoTip>
            <Info size={16} />
            <span>For Yes/No markets, keep the default outcomes. For multi-outcome markets, add more options.</span>
          </InfoTip>
        </FormCard>

        <FormCard>
          <SectionTitle>Resolution Method</SectionTitle>
          
          <FormGroup>
            <Label>How will this market be resolved?</Label>
            <Select value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
              <option value="manual">Manual (Admin)</option>
              <option value="oracle">Oracle (Automatic)</option>
              <option value="community">Community Vote</option>
            </Select>
          </FormGroup>

          {resolutionType === 'oracle' && (
            <OracleSection>
              <Label>Oracle Configuration</Label>
              <OracleGrid>
                <div>
                  <Label>Asset</Label>
                  <Select value={oracleAsset} onChange={(e) => setOracleAsset(e.target.value)}>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="BNB">BNB</option>
                  </Select>
                </div>
                <div>
                  <Label>Operator</Label>
                  <Select value={oracleOperator} onChange={(e) => setOracleOperator(e.target.value)}>
                    <option value=">">Greater than (&gt;)</option>
                    <option value="<">Less than (&lt;)</option>
                    <option value=">=">Greater or equal (&gt;=)</option>
                    <option value="<=">Less or equal (&lt;=)</option>
                  </Select>
                </div>
                <div>
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="150000"
                    value={oracleValue}
                    onChange={(e) => setOracleValue(e.target.value)}
                  />
                </div>
              </OracleGrid>
            </OracleSection>
          )}
        </FormCard>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonGroup>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button onClick={() => handleSubmit('draft')} disabled={loading}>
            Save as Draft
          </Button>
          <Button $primary onClick={() => handleSubmit('submit')} disabled={loading} data-testid="submit-btn">
            {loading ? 'Submitting...' : `Submit for Review (${config.creationStake} USDT)`}
          </Button>
        </ButtonGroup>
      </Container>
    </PageWrapper>
  );
}
