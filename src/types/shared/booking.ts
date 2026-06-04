/**
 * BOOKING TYPES
 * Types for the professional booking system.
 */

import { BaseEntity } from './base';

export type BookingStatus =
  | 'awaiting_payment'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'awaiting_client_confirmation'
  | 'cancelled'
  | 'completed'
  | 'disputed';

export type BookingPaymentStatus =
  | 'unpaid'
  | 'paid'
  | 'refunded'
  | 'partially_refunded'
  | 'in_dispute'
  | 'released';

export interface BookingService {
  serviceKey: string;
  name: string;
  nameKa?: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  discount: number;
  subtotal: number;
}

export interface Booking extends BaseEntity {
  professional: {
    _id: string;
    id?: string;
    name: string;
    avatar?: string;
    phone?: string;
    accountType?: string;
  };
  client: {
    _id: string;
    id?: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  professionalId?: string;
  clientId?: string;
  date: string;
  startHour: number;
  endHour: number;
  status: BookingStatus;
  note?: string;
  cancelledBy?: string;
  cancelReason?: string;
  hasReview?: boolean;
  services?: BookingService[];
  totalAmount?: number;
  // ISO 4217 currency the totalAmount is denominated in (added 2026-05).
  // Snapshotted at booking time so historical totals remain reproducible
  // regardless of future FX moves.
  currency?: string;
  // ISO 3166-1 alpha-2 country code where the service is performed
  // (added 2026-05). Mirrors the parent job's country.
  country?: string;
  address?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  videos?: string[];
  startedAt?: string;
  completedAt?: string;
  // === Payment fields (added 2026-05) ===
  paymentStatus?: BookingPaymentStatus;
  paymentId?: string;
  escrowId?: string;
  totalAmountMinor?: number;
  clientConfirmedAt?: string;
  disputeId?: string;
  // When the booking entered PENDING (paid, awaiting pro confirmation).
  // Drives the SLA-accept countdown chip on PENDING booking cards.
  // Optional because legacy bookings predate the SLA work.
  pendingSince?: string;
}

export interface TimeSlot {
  hour: number;
  available: boolean;
}

export interface DaySchedule {
  dayOfWeek: number;
  isAvailable: boolean;
  startHour: number;
  endHour: number;
}

export interface ScheduleOverride {
  date: string;
  isBlocked: boolean;
  startHour?: number;
  endHour?: number;
}
