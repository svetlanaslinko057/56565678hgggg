'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, MessageSquare, Tag, Send, Loader2 } from 'lucide-react';
import { useWallet } from '@/lib/wagmi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ===================== STYLED COMPONENTS =====================

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: ${({ $isOpen }) => ($isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  
  svg {
    color: #05A584;
  }
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #e2e8f0;
  }
  
  svg {
    width: 18px;
    height: 18px;
    color: #64748b;
  }
`;

const Content = styled.div`
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #0f172a;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #05A584;
    box-shadow: 0 0 0 3px rgba(5, 165, 132, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const TextArea = styled.textarea`
  padding: 14px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  color: #0f172a;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #05A584;
    box-shadow: 0 0 0 3px rgba(5, 165, 132, 0.1);
  }
  
  &::placeholder {
    color: #94a3b8;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagButton = styled.button<{ $selected: boolean }>`
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid ${({ $selected }) => $selected ? '#05A584' : '#e2e8f0'};
  background: ${({ $selected }) => $selected ? 'rgba(5, 165, 132, 0.1)' : 'white'};
  color: ${({ $selected }) => $selected ? '#05A584' : '#64748b'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: #05A584;
    color: #05A584;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const HelperText = styled.span`
  font-size: 13px;
  color: #64748b;
`;

const SubmitButton = styled.button<{ $loading?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #05A584;
  color: white;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: ${({ $loading }) => $loading ? 'not-allowed' : 'pointer'};
  opacity: ${({ $loading }) => $loading ? 0.7 : 1};
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #048a6e;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ConnectPrompt = styled.div`
  text-align: center;
  padding: 40px 20px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 8px 0;
  }
  
  p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }
`;

const ErrorMessage = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 14px;
`;

const SuccessMessage = styled.div`
  padding: 12px 16px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  color: #16a34a;
  font-size: 14px;
`;

// ===================== COMPONENT =====================

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Topic {
  id: string;
  name: string;
  color: string;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isConnected, walletAddress } = useWallet();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch topics
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_URL}/api/discussions/topics/list`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setTopics(data.data);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  // Reset form on close
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setSelectedTags([]);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const handleSubmit = async () => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Failed to create discussion');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onClose} data-testid="create-discussion-modal">
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>
            <MessageSquare />
            Create New Discussion
          </Title>
          <CloseButton onClick={onClose} data-testid="close-modal-btn">
            <X />
          </CloseButton>
        </Header>

        <Content>
          {!isConnected ? (
            <ConnectPrompt>
              <h3>Connect Your Wallet</h3>
              <p>Please connect your wallet to create a discussion</p>
            </ConnectPrompt>
          ) : (
            <>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              {success && <SuccessMessage>Discussion created successfully! Redirecting...</SuccessMessage>}
              
              <FormGroup>
                <Label>Title *</Label>
                <Input
                  type="text"
                  placeholder="What do you want to discuss?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={200}
                  data-testid="discussion-title-input"
                />
              </FormGroup>

              <FormGroup>
                <Label>Content</Label>
                <TextArea
                  placeholder="Share your thoughts, analysis, or questions..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  maxLength={5000}
                  data-testid="discussion-content-input"
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  <Tag size={14} style={{ display: 'inline', marginRight: 6 }} />
                  Topics (select up to 3)
                </Label>
                <TagsContainer>
                  {topics.map(topic => (
                    <TagButton
                      key={topic.id}
                      $selected={selectedTags.includes(topic.name)}
                      onClick={() => {
                        if (selectedTags.length < 3 || selectedTags.includes(topic.name)) {
                          toggleTag(topic.name);
                        }
                      }}
                      style={{ 
                        borderColor: selectedTags.includes(topic.name) ? topic.color : undefined,
                        color: selectedTags.includes(topic.name) ? topic.color : undefined,
                        background: selectedTags.includes(topic.name) ? `${topic.color}15` : undefined,
                      }}
                      data-testid={`topic-tag-${topic.name.toLowerCase()}`}
                    >
                      {topic.name}
                    </TagButton>
                  ))}
                </TagsContainer>
              </FormGroup>
            </>
          )}
        </Content>

        <Footer>
          <HelperText>
            {isConnected && `Posting as ${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`}
          </HelperText>
          {isConnected && (
            <SubmitButton
              onClick={handleSubmit}
              disabled={!title.trim() || loading || success}
              $loading={loading}
              data-testid="submit-discussion-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send />
                  Create Discussion
                </>
              )}
            </SubmitButton>
          )}
        </Footer>
      </Modal>
    </Overlay>
  );
};

export default CreateDiscussionModal;
