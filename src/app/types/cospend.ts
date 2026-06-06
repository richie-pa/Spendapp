export interface CospendLink {
  host: string;
  token: string;
  password: string;
}

export interface Member {
  id: number;
  name: string;
  weight: number;
  activated: boolean;
  userid: string | null;
  color: { r: number; g: number; b: number };
}

export interface Bill {
  id: number;
  amount: number;
  what: string;
  comment: string;
  timestamp: number;
  date: string;
  payer_id: number;
  owers: Member[];
  owerIds: number[];
  categoryid: number;
  paymentmodeid: number;
  deleted: number;
  repeatallactive?: number;
  repeatuntil?: string | null;
  repeatfreq?: number;
  repeat?: string;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface PaymentMode {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  members: Member[];
  categories?: Category[];
  paymentmodes?: PaymentMode[];
  currencyname?: string;
}

export interface Statistics {
  totalSpent: number;
  totalBills: number;
  balances: Record<number, number>;
}

export interface Settlement {
  balances?: Record<number, number>;
  transactions: Array<{
    from: number;
    to: number;
    amount: number;
  }>;
}

export interface CreateBillPayload {
  amount: number;
  what: string;
  comment: string;
  payer: number;
  payedFor: string;
  categoryId?: number;
  paymentModeId?: number;
  repeat: string;
  repeatAllActive: number;
  repeatFreq: number;
  repeatUntil: string | null;
  timestamp: number;
}
