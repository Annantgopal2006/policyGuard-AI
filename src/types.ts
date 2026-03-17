export interface Transaction {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  timestamp: string;
  location: string;
  category: string;
  isSuspicious?: boolean;
  riskScore?: number;
  reason?: string;
}

export interface QRMetadata {
  source: string;
  user: string;
  timestamp: string;
  type: string;
  payload: string;
}

export interface DetectionResult {
  isAI: boolean;
  probability: number;
  explanation: string;
}
