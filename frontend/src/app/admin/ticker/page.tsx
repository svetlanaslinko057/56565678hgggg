'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TickerAPI, TickerItem } from '@/lib/api/tickerApi';
import { Eye, EyeOff, Trash2, Plus, RefreshCw, GripVertical, Edit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const PageWrapper = styled.div`
  min-height: 100vh;
  background: #f9fafb;
  padding: 32px;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-top: 8px;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  
  &:hover {
    color: #0f172a;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'danger':
        return `
          background: #fee2e2;
          color: #dc2626;
          border: 1px solid #fecaca;
          &:hover { background: #fecaca; }
        `;
      case 'secondary':
        return `
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          &:hover { background: #f8fafc; }
        `;
      default:
        return `
          background: #05A584;
          color: white;
          border: none;
          &:hover { background: #048a6e; }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
`;

const CardHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h2 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
  }
`;

const ItemsList = styled.div`
  padding: 16px;
`;

const ItemRow = styled.div<{ $disabled?: boolean }>`
  display: grid;
  grid-template-columns: 40px 60px 180px 150px 120px 120px 140px;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 8px;
  background: ${({ $disabled }) => $disabled ? '#f8fafc' : '#ffffff'};
  border: 1px solid ${({ $disabled }) => $disabled ? '#e2e8f0' : '#e2e8f0'};
  opacity: ${({ $disabled }) => $disabled ? 0.6 : 1};
  
  &:hover {
    border-color: #cbd5e1;
  }
`;

const DragHandle = styled.div`
  cursor: grab;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #64748b;
  }
`;

const IconPreview = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${({ $color }) => $color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: ${({ $color }) => $color};
`;

const Label = styled.div`
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
`;

const Value = styled.div`
  font-size: 14px;
  color: #0f172a;
  
  .change {
    margin-left: 8px;
    font-weight: 600;
  }
  
  .positive { color: #22c55e; }
  .negative { color: #ef4444; }
`;

const Source = styled.div`
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 6px;
  text-align: center;
`;

const IconButton = styled.button<{ $active?: boolean; $danger?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid ${({ $danger }) => $danger ? '#fecaca' : '#e2e8f0'};
  background: ${({ $active, $danger }) => $danger ? '#fef2f2' : $active ? '#dcfce7' : '#ffffff'};
  color: ${({ $active, $danger }) => $danger ? '#dc2626' : $active ? '#22c55e' : '#64748b'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ $danger }) => $danger ? '#fee2e2' : '#f8fafc'};
    border-color: ${({ $danger }) => $danger ? '#fca5a5' : '#cbd5e1'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Modal = styled.div<{ $isOpen: boolean }>`
  display: ${({ $isOpen }) => $isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #0f172a;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
  }
  
  input, select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #05A584;
    }
    
    &:disabled {
      background: #f9fafb;
      color: #6b7280;
    }
  }
`;

const CheckboxLabel = styled.label`
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  input {
    width: auto !important;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' }>`
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  background: ${({ $type }) => $type === 'success' ? '#dcfce7' : '#fee2e2'};
  color: ${({ $type }) => $type === 'success' ? '#166534' : '#dc2626'};
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  font-size: 18px;
  color: #0f172a;
`;

const ICON_OPTIONS = [
  { value: 'fire', label: '🔥 Fire' },
  { value: 'volume', label: '💵 Volume' },
  { value: 'target', label: '🎯 Target' },
  { value: 'users', label: '👥 Users' },
  { value: 'trophy', label: '🏆 Trophy' },
  { value: 'chart', label: '📈 Chart' },
  { value: 'clock', label: '⏰ Clock' },
  { value: 'star', label: '⭐ Star' },
  { value: 'flame', label: '🌟 Flame' },
];

const COLOR_OPTIONS = [
  { value: '#f97316', label: 'Orange' },
  { value: '#22c55e', label: 'Green' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
];

const SOURCE_OPTIONS = [
  { value: 'hotMarkets', label: 'Hot Markets Count' },
  { value: 'totalVolume', label: 'Total Volume' },
  { value: 'activeBets', label: 'Active Bets Count' },
  { value: 'totalUsers', label: 'Total Users' },
  { value: 'topWin', label: 'Top Win Amount' },
  { value: 'avgWinRate', label: 'Average Win Rate' },
  { value: 'endingSoon', label: 'Ending Soon Count' },
  { value: 'newToday', label: 'New Today Count' },
];

const ICON_EMOJI: Record<string, string> = {
  fire: '🔥',
  volume: '💵',
  target: '🎯',
  users: '👥',
  trophy: '🏆',
  chart: '📈',
  clock: '⏰',
  star: '⭐',
  flame: '🌟',
};

export default function TickerAdminPage() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<TickerItem> | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 3000);
  };

  const fetchItems = async () => {
    try {
      const data = await TickerAPI.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      showStatus('error', 'Failed to load ticker items');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggle = async (key: string) => {
    setActionLoading(true);
    try {
      const result = await TickerAPI.toggleItem(key);
      showStatus('success', `${result.label} ${result.enabled ? 'enabled' : 'disabled'}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to toggle item:', error);
      showStatus('error', 'Failed to toggle item');
    }
    setActionLoading(false);
  };

  const handleDelete = async (key: string, label: string) => {
    if (!confirm(`Delete "${label}" from ticker?`)) return;
    
    setActionLoading(true);
    try {
      await TickerAPI.deleteItem(key);
      showStatus('success', `${label} deleted`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      showStatus('error', 'Failed to delete item');
    }
    setActionLoading(false);
  };

  const handleReset = async () => {
    if (!confirm('Reset all ticker items to default values? This will delete all custom items.')) return;
    
    setActionLoading(true);
    try {
      await TickerAPI.resetToDefaults();
      showStatus('success', 'Ticker reset to defaults');
      fetchItems();
    } catch (error) {
      console.error('Failed to reset items:', error);
      showStatus('error', 'Failed to reset');
    }
    setActionLoading(false);
  };

  const handleSave = async () => {
    if (!editingItem || !editingItem.key || !editingItem.label) {
      showStatus('error', 'Key and Label are required');
      return;
    }
    
    setActionLoading(true);
    try {
      const isExisting = items.find(i => i.key === editingItem.key);
      
      if (isExisting) {
        await TickerAPI.updateItem(editingItem.key, editingItem);
        showStatus('success', `${editingItem.label} updated`);
      } else {
        await TickerAPI.createItem({
          ...editingItem,
          order: items.length + 1,
        });
        showStatus('success', `${editingItem.label} created`);
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error('Failed to save item:', error);
      showStatus('error', 'Failed to save item');
    }
    setActionLoading(false);
  };

  const openEditModal = (item?: TickerItem) => {
    if (item) {
      setEditingItem({ ...item });
    } else {
      setEditingItem({
        key: '',
        label: '',
        icon: 'star',
        color: '#f59e0b',
        enabled: true,
        order: items.length + 1,
        value: '0',
        changeValue: null,
        changePositive: true,
        isDynamic: false,
        dynamicSource: null,
      });
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {actionLoading && <LoadingOverlay>Processing...</LoadingOverlay>}
      
      <Container>
        <Header>
          <div>
            <BackLink href="/">
              <ArrowLeft size={16} />
              Back to Arena
            </BackLink>
            <Title>Ticker Management</Title>
          </div>
          <Actions>
            <Button $variant="secondary" onClick={handleReset} disabled={actionLoading} data-testid="reset-btn">
              <RefreshCw size={16} />
              Reset to Defaults
            </Button>
            <Button onClick={() => openEditModal()} disabled={actionLoading} data-testid="add-item-btn">
              <Plus size={16} />
              Add Item
            </Button>
          </Actions>
        </Header>

        {status && (
          <StatusMessage $type={status.type} data-testid="status-message">
            {status.message}
          </StatusMessage>
        )}

        <Card>
          <CardHeader>
            <h2>Ticker Items ({items.length})</h2>
          </CardHeader>
          <ItemsList>
            {items.map((item) => (
              <ItemRow key={item.key} $disabled={!item.enabled} data-testid={`item-row-${item.key}`}>
                <DragHandle>
                  <GripVertical size={20} />
                </DragHandle>
                
                <IconPreview $color={item.color}>
                  {ICON_EMOJI[item.icon] || '⭐'}
                </IconPreview>
                
                <Label>{item.label}</Label>
                
                <Value>
                  {item.value}
                  {item.changeValue && (
                    <span className={`change ${item.changePositive ? 'positive' : 'negative'}`}>
                      {item.changeValue}
                    </span>
                  )}
                </Value>
                
                <Source>
                  {item.isDynamic ? item.dynamicSource : 'Static'}
                </Source>
                
                <Source>
                  {item.icon}
                </Source>
                
                <ActionButtons>
                  <IconButton 
                    $active={item.enabled} 
                    onClick={() => handleToggle(item.key)}
                    disabled={actionLoading}
                    title={item.enabled ? 'Disable' : 'Enable'}
                    data-testid={`toggle-${item.key}`}
                  >
                    {item.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                  </IconButton>
                  <IconButton 
                    onClick={() => openEditModal(item)}
                    disabled={actionLoading}
                    title="Edit"
                    data-testid={`edit-${item.key}`}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton 
                    $danger 
                    onClick={() => handleDelete(item.key, item.label)}
                    disabled={actionLoading}
                    title="Delete"
                    data-testid={`delete-${item.key}`}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </ActionButtons>
              </ItemRow>
            ))}
          </ItemsList>
        </Card>

        <Modal $isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()} data-testid="edit-modal">
            <ModalTitle>{editingItem?.key && items.find(i => i.key === editingItem.key) ? 'Edit Item' : 'Add New Item'}</ModalTitle>
            
            <FormGroup>
              <label>Key (unique identifier)</label>
              <input
                value={editingItem?.key || ''}
                onChange={e => setEditingItem({ ...editingItem, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., hot_markets"
                disabled={!!items.find(i => i.key === editingItem?.key)}
                data-testid="input-key"
              />
            </FormGroup>
            
            <FormGroup>
              <label>Label (display name)</label>
              <input
                value={editingItem?.label || ''}
                onChange={e => setEditingItem({ ...editingItem, label: e.target.value })}
                placeholder="e.g., Hot Markets"
                data-testid="input-label"
              />
            </FormGroup>
            
            <FormGroup>
              <label>Icon</label>
              <select
                value={editingItem?.icon || 'star'}
                onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })}
                data-testid="select-icon"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </FormGroup>
            
            <FormGroup>
              <label>Color</label>
              <select
                value={editingItem?.color || '#f59e0b'}
                onChange={e => setEditingItem({ ...editingItem, color: e.target.value })}
                data-testid="select-color"
              >
                {COLOR_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>
                ))}
              </select>
            </FormGroup>
            
            <FormGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={editingItem?.isDynamic || false}
                  onChange={e => setEditingItem({ ...editingItem, isDynamic: e.target.checked })}
                  data-testid="checkbox-dynamic"
                />
                Dynamic Value (fetched from stats API)
              </CheckboxLabel>
            </FormGroup>
            
            {editingItem?.isDynamic ? (
              <FormGroup>
                <label>Data Source</label>
                <select
                  value={editingItem?.dynamicSource || ''}
                  onChange={e => setEditingItem({ ...editingItem, dynamicSource: e.target.value })}
                  data-testid="select-source"
                >
                  <option value="">Select source...</option>
                  {SOURCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </FormGroup>
            ) : (
              <>
                <FormGroup>
                  <label>Static Value</label>
                  <input
                    value={editingItem?.value || ''}
                    onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                    placeholder="e.g., $847K or 1,247"
                    data-testid="input-value"
                  />
                </FormGroup>
                <FormGroup>
                  <label>Change Indicator (optional)</label>
                  <input
                    value={editingItem?.changeValue || ''}
                    onChange={e => setEditingItem({ ...editingItem, changeValue: e.target.value || null })}
                    placeholder="e.g., +12% or +89"
                    data-testid="input-change"
                  />
                </FormGroup>
                <FormGroup>
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={editingItem?.changePositive !== false}
                      onChange={e => setEditingItem({ ...editingItem, changePositive: e.target.checked })}
                      data-testid="checkbox-positive"
                    />
                    Positive change (green color)
                  </CheckboxLabel>
                </FormGroup>
              </>
            )}
            
            <ModalActions>
              <Button $variant="secondary" onClick={() => setIsModalOpen(false)} data-testid="btn-cancel">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={actionLoading} data-testid="btn-save">
                {actionLoading ? 'Saving...' : 'Save'}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      </Container>
    </PageWrapper>
  );
}
