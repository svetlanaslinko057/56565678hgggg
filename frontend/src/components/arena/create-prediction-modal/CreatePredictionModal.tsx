'use client';

import React, { useState, useEffect } from "react";
import { X, Wallet, DollarSign } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { useWallet } from "@/lib/wagmi";
import { env } from "@/lib/web3/env";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  FormSection,
  SectionLabel,
  RadioGroup,
  RadioOption,
  TextInput,
  HintText,
  InfoBox,
  FooterNote,
  ModalFooter,
  CancelButton,
  SubmitButton,
  WalletNotice,
  ConnectWalletBtn,
  StakeNotice,
  StakeInfo,
  StakeAmount,
  ErrorMessage,
} from "./CreatePredictionModal.styles";
import ModalDatePicker from "@/global/common/components_for_modals/modal_date_picker";
import { TextareaWrapper } from "@/global/modals/BuyModal/styles";
import { Textarea } from "@/projects/modals/P2PBuyModal/styles";
import CustomDropdown from "@/UI/CustomDropdown";
import EnglishDateTimePicker from "@/components/ui/EnglishDateTimePicker";

// USDT token address on BSC Testnet
const USDT_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_STABLE_TOKEN || 
  process.env.NEXT_PUBLIC_COLLATERAL_ADDRESS || 
  "0x4EeF2A62E8A63b713C96CBADAc4C6622D1EAB948") as `0x${string}`;

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type PredictionType = "single" | "multi-level" | "tge-ido";

export const CreatePredictionModal: React.FC<CreatePredictionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { address, isConnected } = useAccount();
  const { connectWallet } = useWallet();
  
  // Get USDT balance (collateral token for staking)
  const { data: usdtBalance, isLoading: isBalanceLoading } = useBalance({
    address,
    token: USDT_TOKEN_ADDRESS,
  });
  
  // Also get native BNB balance for display
  const { data: bnbBalance } = useBalance({
    address,
  });
  
  const [predictionType, setPredictionType] = useState<PredictionType>("single");
  const [predictionQuestion, setPredictionQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("crypto");
  const [closeTime, setCloseTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creationStake] = useState(100);
  
  // Resolution Engine V1 state
  const [resolutionMode, setResolutionMode] = useState<'oracle' | 'admin'>('oracle');
  const [oracleAsset, setOracleAsset] = useState('bitcoin');
  const [oracleMetric, setOracleMetric] = useState<'price' | 'fdv' | 'market_cap' | 'volume_24h'>('price');
  const [oracleOperator, setOracleOperator] = useState<'>=' | '>' | '<=' | '<' | '=='>('>=');
  const [oracleTargetValue, setOracleTargetValue] = useState<number | ''>('');
  const [adminInstructions, setAdminInstructions] = useState('');
  
  // Calculate user's USDT balance
  const userUsdtBalance = usdtBalance ? parseFloat(usdtBalance.formatted) : 0;
  const hasEnoughBalance = userUsdtBalance >= creationStake;

  // Multi-level state
  const [multiLevelOptions, setMultiLevelOptions] = useState<string[]>([
    "",
    "",
    "",
  ]);

  // TGE/IDO state
  const [selectedProject, setSelectedProject] = useState("");
  const [tgeDate, setTgeDate] = useState("");

  // Project options for dropdown
  const projectOptions = [
    { value: "project1", label: "Project 1" },
    { value: "project2", label: "Project 2" },
    { value: "project3", label: "Project 3" },
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError("");
      // Set default close time to 7 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setCloseTime(defaultDate.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setError("");
    
    // Validation
    if (!isConnected || !address) {
      setError("Please connect your wallet first");
      return;
    }
    
    // For testnet (BSC Testnet chain ID 97), skip balance check
    const isTestnet = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') === 97;
    if (!isTestnet && !hasEnoughBalance) {
      setError(`Insufficient USDT balance. Need ${creationStake} USDT, you have ${userUsdtBalance.toFixed(2)} USDT`);
      return;
    }
    
    setLoading(true);
    
    try {
      // Build resolution config based on mode
      const resolutionConfig = resolutionMode === 'oracle' 
        ? {
            mode: 'oracle',
            metric: oracleMetric,
            asset: oracleAsset,
            source: 'coingecko',
            operator: oracleOperator,
            targetValue: Number(oracleTargetValue),
            evaluationTime: closeTime ? new Date(closeTime).toISOString() : undefined,
            status: 'pending',
          }
        : {
            mode: 'admin',
            instructions: adminInstructions,
            adminNotesRequired: true,
            status: 'pending',
          };

      const payload = {
        type: predictionType === "tge-ido" ? "single" : predictionType,
        title: predictionQuestion,
        description: description || predictionQuestion,
        category: category,
        closeTime: closeTime ? new Date(closeTime).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        outcomes: predictionType === "single" 
          ? [{ id: 1, label: "Yes" }, { id: 2, label: "No" }]
          : predictionType === "multi-level"
          ? multiLevelOptions.filter(opt => opt.trim()).map((opt, i) => ({ id: i + 1, label: opt }))
          : [{ id: 1, label: "Bullish" }, { id: 2, label: "Bearish" }],
        ...(predictionType === "tge-ido" && { project: selectedProject, tgeDate }),
        creatorAddress: address,
        stake: creationStake,
        resolution: resolutionConfig,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": address,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to create prediction");
      }
      
      // Submit for review
      const submitResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/markets/drafts/${data.data._id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": address,
          },
        }
      );
      
      const submitData = await submitResponse.json();
      if (!submitData.success) {
        throw new Error(submitData.message || "Failed to submit for review");
      }
      
      // Success
      onSuccess?.();
      onClose();
      
      // Reset form
      setPredictionQuestion("");
      setMultiLevelOptions(["", "", ""]);
      setSelectedProject("");
      setTgeDate("");
      
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateMultiLevelOption = (index: number, value: string) => {
    const newOptions = [...multiLevelOptions];
    newOptions[index] = value;

    // If user is typing in the last empty input and there are less than 4 options, add a new empty one
    if (
      index === multiLevelOptions.length - 1 &&
      value.trim() &&
      multiLevelOptions.length < 4
    ) {
      newOptions.push("");
    }

    setMultiLevelOptions(newOptions);
  };

  const handleMultiLevelBlur = () => {
    // Remove trailing empty options, but keep at least 3 options (2 fields + 1 "Add another")
    const filledCount = multiLevelOptions.filter((opt) => opt.trim()).length;

    if (filledCount >= 2) {
      // Keep only filled options plus one empty "Add another" at the end
      const filled = multiLevelOptions.filter((opt) => opt.trim());
      if (filled.length < 4) {
        setMultiLevelOptions([...filled, ""]);
      } else {
        setMultiLevelOptions(filled);
      }
    } else {
      // Keep at least 3 empty slots if less than 2 are filled
      setMultiLevelOptions(["", "", ""]);
    }
  };

  const isFormValid = () => {
    // closeTime is required for all types
    if (!closeTime) return false;
    
    if (predictionType === "single" && !predictionQuestion.trim()) return false;
    if (predictionType === "multi-level" && 
        (!predictionQuestion.trim() || multiLevelOptions.filter((opt) => opt.trim()).length < 2)) return false;
    if (predictionType === "tge-ido" && (!selectedProject || !tgeDate)) return false;
    return true;
  };

  return (
    <ModalOverlay onClick={handleOverlayClick} data-testid="create-prediction-modal">
      <ModalContent>
        <ModalHeader>
          <h2>Create Prediction</h2>
          <CloseButton onClick={onClose} data-testid="close-modal-btn">
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {/* Wallet Status */}
          <WalletNotice $connected={isConnected}>
            <Wallet size={18} />
            {!isConnected ? (
              <>
                <span>Connect your wallet to create a prediction</span>
                <ConnectWalletBtn onClick={connectWallet} data-testid="connect-wallet-btn">
                  Connect Wallet
                </ConnectWalletBtn>
              </>
            ) : (
              <span>
                {address?.slice(0, 6)}...{address?.slice(-4)}
                {usdtBalance && ` • ${userUsdtBalance.toFixed(2)} USDT`}
                {bnbBalance && ` • ${parseFloat(bnbBalance.formatted).toFixed(4)} BNB`}
              </span>
            )}
          </WalletNotice>
          
          {/* Stake Notice */}
          <StakeNotice>
            <DollarSign size={18} />
            <StakeInfo>
              <strong>Creation Stake Required</strong>
              <span>Returned when approved. May be burned if rejected for spam.</span>
            </StakeInfo>
            <StakeAmount>${creationStake}</StakeAmount>
          </StakeNotice>

          <FormSection>
            <SectionLabel>Prediction type</SectionLabel>
            <RadioGroup>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="single"
                  checked={predictionType === "single"}
                  onChange={() => setPredictionType("single")}
                  data-testid="prediction-type-single"
                />
                <span>
                  <span className="option-label">Single</span>
                  <span className="option-description">(Yes/No)</span>
                </span>
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="multi-level"
                  checked={predictionType === "multi-level"}
                  onChange={() => setPredictionType("multi-level")}
                  data-testid="prediction-type-multi"
                />
                <span>
                  <span className="option-label">Multi-Level</span>
                  <span className="option-description">(Yes/No)</span>
                </span>
              </RadioOption>
              <RadioOption>
                <input
                  type="radio"
                  name="prediction-type"
                  value="tge-ido"
                  checked={predictionType === "tge-ido"}
                  onChange={() => setPredictionType("tge-ido")}
                  data-testid="prediction-type-tge"
                />
                <span>
                  <span className="option-label">TGE / IDO / Launch</span>
                  <span className="option-description">(Bull/Bear)</span>
                </span>
              </RadioOption>
            </RadioGroup>
          </FormSection>

          {predictionType === "single" && (
            <>
              <FormSection>
                <SectionLabel>Prediction question</SectionLabel>
                <TextareaWrapper>
                  <Textarea
                    placeholder="Enter prediction question"
                    value={predictionQuestion}
                    onChange={(e) => setPredictionQuestion(e.target.value)}
                    data-testid="prediction-question-input"
                  />
                </TextareaWrapper>
                <HintText>
                  The question must be specific, verifiable, and have a clear
                  resolution source.
                </HintText>
              </FormSection>
              
              {/* Event Date */}
              <FormSection>
                <SectionLabel>Event Date *</SectionLabel>
                <EnglishDateTimePicker
                  value={closeTime}
                  onChange={(val) => setCloseTime(val)}
                  placeholder="dd.mm.yyyy"
                />
                <HintText>When the event occurs. Market closes automatically and goes to admin for resolution confirmation.</HintText>
              </FormSection>
              
              {/* Category */}
              <FormSection>
                <SectionLabel>Category</SectionLabel>
                <CustomDropdown
                  options={[
                    { value: "crypto", label: "Crypto" },
                    { value: "defi", label: "DeFi" },
                    { value: "nft", label: "NFT" },
                    { value: "ai", label: "AI" },
                    { value: "gaming", label: "Gaming" },
                    { value: "other", label: "Other" },
                  ]}
                  value={category}
                  onChange={(value) => setCategory(value as string)}
                  placeholder="Select category"
                  searchable={false}
                  isShowSuccess={false}
                />
              </FormSection>
              
              <FormSection>
                <SectionLabel>Outcome</SectionLabel>
                <InfoBox>This prediction has a single Yes/No outcome.</InfoBox>
              </FormSection>

              {/* Resolution Mode */}
              <FormSection>
                <SectionLabel>How will this market be resolved?</SectionLabel>
                <RadioGroup>
                  <RadioOption 
                    $active={resolutionMode === 'oracle'}
                    onClick={() => setResolutionMode('oracle')}
                    data-testid="resolution-mode-oracle"
                  >
                    <input type="radio" checked={resolutionMode === 'oracle'} readOnly />
                    <div>
                      <strong>Automatic (Oracle)</strong>
                      <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>BTC/ETH price, FDV, market cap</span>
                    </div>
                  </RadioOption>
                  <RadioOption 
                    $active={resolutionMode === 'admin'}
                    onClick={() => setResolutionMode('admin')}
                    data-testid="resolution-mode-admin"
                  >
                    <input type="radio" checked={resolutionMode === 'admin'} readOnly />
                    <div>
                      <strong>Manual (Admin)</strong>
                      <span style={{ display: 'block', fontSize: 12, opacity: 0.7 }}>ETF approval, elections, partnerships</span>
                    </div>
                  </RadioOption>
                </RadioGroup>
              </FormSection>

              {resolutionMode === 'oracle' && (
                <>
                  <FormSection>
                    <SectionLabel>Asset</SectionLabel>
                    <CustomDropdown
                      options={[
                        { value: "bitcoin", label: "BTC" },
                        { value: "ethereum", label: "ETH" },
                        { value: "solana", label: "SOL" },
                        { value: "binancecoin", label: "BNB" },
                      ]}
                      value={oracleAsset}
                      onChange={(value) => setOracleAsset(value as string)}
                      placeholder="Select asset"
                      searchable={true}
                      isShowSuccess={false}
                    />
                  </FormSection>
                  <FormSection style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Condition</SectionLabel>
                      <CustomDropdown
                        options={[
                          { value: ">=", label: ">=" },
                          { value: ">", label: ">" },
                          { value: "<=", label: "<=" },
                          { value: "<", label: "<" },
                        ]}
                        value={oracleOperator}
                        onChange={(value) => setOracleOperator(value as any)}
                        placeholder="Operator"
                        searchable={false}
                        isShowSuccess={false}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <SectionLabel>Target (USD)</SectionLabel>
                      <TextInput
                        type="number"
                        placeholder="100000"
                        value={oracleTargetValue}
                        onChange={(e) => setOracleTargetValue(e.target.value ? Number(e.target.value) : '')}
                        data-testid="oracle-target-value"
                      />
                    </div>
                  </FormSection>
                  <InfoBox style={{ background: '#dbeafe', border: '1px solid #3b82f6', color: '#1e40af' }}>
                    Auto-resolve: {oracleAsset.toUpperCase()} {oracleOperator} ${Number(oracleTargetValue || 0).toLocaleString()}
                  </InfoBox>
                </>
              )}

              {resolutionMode === 'admin' && (
                <FormSection>
                  <SectionLabel>Resolution Instructions</SectionLabel>
                  <TextareaWrapper>
                    <Textarea
                      placeholder="YES: [condition]&#10;NO: [condition]&#10;Source: [url]"
                      value={adminInstructions}
                      onChange={(e) => setAdminInstructions(e.target.value)}
                      style={{ minHeight: 80 }}
                    />
                  </TextareaWrapper>
                </FormSection>
              )}
            </>
          )}

          {predictionType === "multi-level" && (
            <>
              <FormSection>
                <SectionLabel>Prediction question</SectionLabel>
                <TextInput
                  type="text"
                  placeholder="Enter prediction question"
                  value={predictionQuestion}
                  onChange={(e) => setPredictionQuestion(e.target.value)}
                  data-testid="prediction-question-input"
                />
                <HintText>
                  The question must be specific, verifiable, and have a clear
                  resolution source.
                </HintText>
              </FormSection>
              
              {/* Event Date */}
              <FormSection>
                <SectionLabel>Event Date *</SectionLabel>
                <EnglishDateTimePicker
                  value={closeTime}
                  onChange={(val) => setCloseTime(val)}
                  placeholder="dd.mm.yyyy"
                />
                <HintText>When the event occurs. Market closes automatically and goes to admin for resolution confirmation.</HintText>
              </FormSection>
              
              {/* Category */}
              <FormSection>
                <SectionLabel>Category</SectionLabel>
                <CustomDropdown
                  options={[
                    { value: "crypto", label: "Crypto" },
                    { value: "defi", label: "DeFi" },
                    { value: "nft", label: "NFT" },
                    { value: "ai", label: "AI" },
                    { value: "gaming", label: "Gaming" },
                    { value: "other", label: "Other" },
                  ]}
                  value={category}
                  onChange={(value) => setCategory(value as string)}
                  placeholder="Select category"
                  searchable={false}
                  isShowSuccess={false}
                />
              </FormSection>

              <FormSection>
                <SectionLabel>Levels (2-4)</SectionLabel>
                <RadioGroup>
                  {multiLevelOptions.map((option, index) => (
                    <TextInput
                      key={index}
                      type="text"
                      placeholder={
                        index === multiLevelOptions.length - 1 &&
                        multiLevelOptions.length < 4
                          ? "Add another option..."
                          : `Option ${index + 1}`
                      }
                      value={option}
                      onChange={(e) =>
                        updateMultiLevelOption(index, e.target.value)
                      }
                      onBlur={handleMultiLevelBlur}
                      data-testid={`level-option-${index}`}
                    />
                  ))}
                </RadioGroup>
              </FormSection>
            </>
          )}

          {predictionType === "tge-ido" && (
            <>
              <FormSection>
                <SectionLabel>Select a project</SectionLabel>
                <CustomDropdown
                  options={projectOptions}
                  value={selectedProject}
                  onChange={(value) => setSelectedProject(value as string)}
                  placeholder="Select a project"
                  searchable={true}
                  isShowSuccess={false}
                />
              </FormSection>

              <FormSection>
                <SectionLabel>TGE Date</SectionLabel>
                <div className="date-picker">
                  <ModalDatePicker
                    date={tgeDate ? new Date(tgeDate) : null}
                    onChange={(date) => {
                      const isoDate = date instanceof Date ? date.toISOString() : date;
                      setTgeDate(isoDate);
                      // Also set closeTime to TGE date if not set
                      if (!closeTime && isoDate) {
                        setCloseTime(isoDate.slice(0, 16));
                      }
                    }}
                    type="default"
                    isSuccessIcon={!!tgeDate}
                  />
                </div>
              </FormSection>
              
              {/* Event Date */}
              <FormSection>
                <SectionLabel>TGE/Launch Date *</SectionLabel>
                <TextInput
                  type="datetime-local"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  data-testid="close-time-input-tge"
                  min={new Date().toISOString().slice(0, 16)}
                />
                <HintText>When the TGE/Launch happens. Market closes automatically on this date.</HintText>
              </FormSection>
            </>
          )}

          {error && <ErrorMessage data-testid="error-message">{error}</ErrorMessage>}

          <FooterNote>
            *Predictions are reviewed before being published.
          </FooterNote>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose}>Cancel</CancelButton>
          <SubmitButton
            onClick={handleSubmit}
            disabled={!isFormValid() || loading || !isConnected}
            data-testid="submit-prediction-btn"
          >
            {loading ? "Submitting..." : "Submit for review"}
          </SubmitButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};
