'use client';

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, DollarSign, Zap, Info, Wallet } from "lucide-react";
import styled from "styled-components";
import { useAccount, useBalance } from "wagmi";
import { useWallet } from "@/lib/wagmi";
import { env } from "@/lib/web3/env";
import EnglishDateTimePicker from "@/components/ui/EnglishDateTimePicker";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #eef1f5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
  
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #738094;
  transition: all 0.15s;
  
  &:hover {
    background: #f5f7fa;
    color: #0f172a;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

/* Stake Notice - neutral gray style matching system design */
const StakeNotice = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StakeInfo = styled.div`
  flex: 1;
  
  h4 {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 2px;
  }
  
  p {
    font-size: 12px;
    color: #64748b;
  }
`;

const StakeAmount = styled.div`
  background: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  border: 1px solid #e2e8f0;
`;

/* Wallet Notice - subtle style */
const WalletNotice = styled.div<{ $connected?: boolean }>`
  background: ${({ $connected }) => $connected ? '#f0fdf4' : '#f8fafc'};
  border: 1px solid ${({ $connected }) => $connected ? '#bbf7d0' : '#e2e8f0'};
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: ${({ $connected }) => $connected ? '#22c55e' : '#64748b'};
  }
  
  span {
    flex: 1;
    font-size: 13px;
    color: ${({ $connected }) => $connected ? '#166534' : '#64748b'};
  }
`;

/* Connect Button - black like header */
const ConnectButton = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: #1e293b;
  }
`;

const FormSection = styled.div`
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
  padding: 12px 14px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  transition: all 0.15s;
  
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
  padding: 12px 14px;
  border: 1px solid #eef1f5;
  border-radius: 10px;
  font-size: 14px;
  color: #0f172a;
  resize: vertical;
  min-height: 80px;
  
  &:focus {
    outline: none;
    border-color: #05A584;
  }
  
  &::placeholder {
    color: #9CA3AF;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
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

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const OutcomeRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
`;

const OutcomeInput = styled(Input)`
  flex: 1;
`;

const IconBtn = styled.button<{ $danger?: boolean }>`
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: ${({ $danger }) => $danger ? '#FEE2E2' : '#E6F7F3'};
  color: ${({ $danger }) => $danger ? '#DC2626' : '#05A584'};
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: ${({ $danger }) => $danger ? '#FECACA' : '#D1F5EC'};
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px dashed #05A584;
  background: transparent;
  color: #05A584;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  
  &:hover {
    background: #E6F7F3;
  }
`;

const InfoTip = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #F5F7FA;
  border-radius: 8px;
  font-size: 12px;
  color: #738094;
  margin-top: 12px;
  
  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

const ErrorMsg = styled.div`
  color: #DC2626;
  font-size: 13px;
  margin-top: 8px;
  padding: 10px;
  background: #FEF2F2;
  border-radius: 8px;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #eef1f5;
  position: sticky;
  bottom: 0;
  background: #fff;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  
  ${({ $primary }) => $primary ? `
    background: #05A584;
    color: #fff;
    border: none;
    
    &:hover:not(:disabled) {
      background: #048a6e;
    }
  ` : `
    background: #fff;
    color: #738094;
    border: 1px solid #eef1f5;
    
    &:hover:not(:disabled) {
      border-color: #d1d5db;
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Outcome {
  id: string;
  label: string;
}

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWallet();
  const { data: balance } = useBalance({
    address,
    token: env.COLLATERAL_TOKEN as `0x${string}`,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creationStake] = useState(100); // Default stake amount
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [closeTime, setCloseTime] = useState('');
  const [outcomes, setOutcomes] = useState<Outcome[]>([
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ]);
  
  useEffect(() => {
    // Set default close time (7 days from now)
    const defaultClose = new Date();
    defaultClose.setDate(defaultClose.getDate() + 7);
    setCloseTime(defaultClose.toISOString().slice(0, 16));
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const handleConnect = () => {
    // Use the real wallet connection from WalletContext
    connectWallet();
  };
  
  const addOutcome = () => {
    if (outcomes.length >= 4) return;
    setOutcomes([...outcomes, { id: `outcome_${Date.now()}`, label: '' }]);
  };
  
  const removeOutcome = (id: string) => {
    if (outcomes.length <= 2) return;
    setOutcomes(outcomes.filter(o => o.id !== id));
  };
  
  const updateOutcome = (id: string, label: string) => {
    setOutcomes(outcomes.map(o => o.id === id ? { ...o, label } : o));
  };
  
  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!title.trim()) {
      setError('Question is required');
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
    if (!isConnected || !address) {
      setError('Please connect your wallet first');
      return;
    }
    
    // For testnet (BSC Testnet chain ID 97), skip balance check
    // In production, enable real balance validation
    const isTestnet = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') === 97;
    const userBalance = balance ? parseFloat(balance.formatted) : 0;
    
    if (!isTestnet && userBalance < creationStake) {
      setError(`Insufficient balance. Need ${creationStake} USDT, you have ${userBalance.toFixed(2)} USDT`);
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        title,
        description,
        category,
        type: outcomes.length === 2 ? 'single' : 'multi',
        closeTime: new Date(closeTime).toISOString(),
        outcomes: outcomes.map((o, i) => ({ id: i + 1, label: o.label })),
        creatorAddress: address,
        stake: creationStake,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': address,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create market');
      }
      
      // Submit for review
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/${data.data._id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': address,
          },
        }
      );
      
      const submitData = await submitResponse.json();
      if (!submitData.success) {
        throw new Error(submitData.message || 'Failed to submit for review');
      }
      
      // Success
      onSuccess?.();
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
      setOutcomes([{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }]);
      
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ModalOverlay onClick={handleOverlayClick} data-testid="create-market-modal">
      <ModalContent>
        <ModalHeader>
          <h2>
            <Zap size={20} color="#05A584" />
            Create Prediction Market
          </h2>
          <CloseButton onClick={onClose} data-testid="close-modal-btn">
            <X size={20} />
          </CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {/* Wallet Status */}
          {!isConnected ? (
            <WalletNotice $connected={false}>
              <Wallet size={20} />
              <span>Connect your wallet to create a market</span>
              <ConnectButton onClick={handleConnect} data-testid="connect-wallet-btn">
                Connect Wallet
              </ConnectButton>
            </WalletNotice>
          ) : (
            <WalletNotice $connected={true}>
              <Wallet size={20} />
              <span>
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)} 
                {balance && ` • ${parseFloat(balance.formatted).toFixed(2)} ${balance.symbol}`}
              </span>
            </WalletNotice>
          )}
          
          {/* Stake Notice - neutral gray design */}
          <StakeNotice>
            <DollarSign size={20} color="#64748b" />
            <StakeInfo>
              <h4>Creation Stake Required</h4>
              <p>Returned when approved. May be burned if rejected for spam.</p>
            </StakeInfo>
            <StakeAmount data-testid="stake-amount">${creationStake}</StakeAmount>
          </StakeNotice>
          
          {/* Question */}
          <FormSection>
            <Label>Prediction Question *</Label>
            <TextArea
              placeholder="Will BTC reach $150,000 by end of 2026?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="market-question-input"
            />
          </FormSection>
          
          {/* Description */}
          <FormSection>
            <Label>Description (optional)</Label>
            <TextArea
              placeholder="Additional context about your prediction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: '60px' }}
              data-testid="market-description-input"
            />
          </FormSection>
          
          {/* Category & Close Time */}
          <GridRow>
            <FormSection>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="crypto">Crypto</option>
                <option value="defi">DeFi</option>
                <option value="nft">NFT</option>
                <option value="ai">AI</option>
                <option value="gaming">Gaming</option>
                <option value="other">Other</option>
              </Select>
            </FormSection>
            
            <FormSection>
              <Label>Close Time *</Label>
              <EnglishDateTimePicker
                value={closeTime}
                onChange={(val) => setCloseTime(val)}
                placeholder="dd.mm.yyyy"
              />
            </FormSection>
          </GridRow>
          
          {/* Outcomes */}
          <FormSection>
            <Label>Outcomes (2-4)</Label>
            {outcomes.map((outcome, index) => (
              <OutcomeRow key={outcome.id}>
                <OutcomeInput
                  placeholder={`Outcome ${index + 1}`}
                  value={outcome.label}
                  onChange={(e) => updateOutcome(outcome.id, e.target.value)}
                  data-testid={`outcome-${index}-input`}
                />
                <IconBtn
                  $danger
                  onClick={() => removeOutcome(outcome.id)}
                  disabled={outcomes.length <= 2}
                >
                  <Trash2 size={16} />
                </IconBtn>
              </OutcomeRow>
            ))}
            
            {outcomes.length < 4 && (
              <AddBtn onClick={addOutcome} data-testid="add-outcome-btn">
                <Plus size={14} />
                Add Outcome
              </AddBtn>
            )}
            
            <InfoTip>
              <Info size={14} />
              <span>For Yes/No markets, keep the default outcomes. For multi-outcome, add more options.</span>
            </InfoTip>
          </FormSection>
          
          {error && <ErrorMsg data-testid="error-message">{error}</ErrorMsg>}
        </ModalBody>
        
        <ModalFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            $primary
            onClick={handleSubmit}
            disabled={loading || !isConnected}
            data-testid="submit-market-btn"
          >
            {loading ? 'Submitting...' : `Submit (${creationStake} USDT)`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateMarketModal;
