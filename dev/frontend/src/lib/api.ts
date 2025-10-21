import { getAuthHeaders } from '@/contexts/AuthContext';
import type { Config, ValidationResult, QueueStats } from '@/types';

const API_BASE = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers
    }
  });
  
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Session expirée');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Configuration
  getConfig: () => fetchAPI<Config>('/config'),
  
  updateConfig: (config: Config) => 
    fetchAPI<{ success: boolean; warnings: any[] }>('/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    }),
  
  validateConfig: (config: Config) =>
    fetchAPI<ValidationResult>('/config/validate', {
      method: 'POST',
      body: JSON.stringify(config)
    }),
  
  // Logs
  listLogs: () => fetchAPI<{ files: string[] }>('/logs'),
  
  downloadLog: async (filename: string): Promise<string> => {
    const response = await fetch(`${API_BASE}/logs/${filename}`);
    if (!response.ok) throw new Error('Failed to download log');
    return response.text();
  },
  
  // Tests
  testWebhook: (webhook: string, message: string) =>
    fetchAPI<{ success: boolean; error?: string }>('/test/webhook', {
      method: 'POST',
      body: JSON.stringify({ webhook, message })
    }),
  
  testTemplate: (template: string, sampleEvent: any, webhookType: 'public' | 'admin') =>
    fetchAPI<{ result: string }>('/test/template', {
      method: 'POST',
      body: JSON.stringify({ template, sampleEvent, webhookType })
    }),
  
  // Stats
  getStats: () => fetchAPI<QueueStats>('/stats'),
  
  // Health
  getHealth: () => fetchAPI<{ status: string; timestamp: string }>('/health')
};