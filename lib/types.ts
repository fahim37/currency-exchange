export type Locale = "bn" | "en";
export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
export interface MethodView {
  id: string;
  name: string;
  currency: string;
  kind: string;
  network: string | null;
  color: string;
  reserve: string;
  enabled: boolean;
  decimals: number;
}
export interface PairView {
  id: string;
  fromId: string;
  toId: string;
  rate: string;
  feePercent: string;
  min: string;
  max: string;
  enabled: boolean;
}
export interface ActivityView {
  id: string;
  user: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  status: OrderStatus;
  createdAt: string;
}
export interface PublicData {
  methods: MethodView[];
  pairs: PairView[];
  activity: ActivityView[];
  online: boolean;
  notice: string;
  noticeEn: string;
  serviceHours: string;
  demo: boolean;
  configured: boolean;
  acceptingOrders: boolean;
  completedCount: number;
}
export interface OrderView {
  id: string;
  number: string;
  status: OrderStatus;
  fromName: string;
  toName: string;
  fromCurrency: string;
  toCurrency: string;
  sendAmount: string;
  receiveAmount: string;
  fee: string;
  rate: string;
  destination: string;
  senderAccount: string;
  paymentTrxId: string;
  payoutReference: string | null;
  cancellationReason: string | null;
  refundStatus: string;
  refundReference: string | null;
  reviewRequired: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { name: string; email: string };
}
