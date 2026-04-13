/**
 * BOOKING TYPES
 * Types for the professional booking system.
 */

import { BaseEntity } from './base';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'completed';

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
  address?: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  videos?: string[];
  startedAt?: string;
  completedAt?: string;
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
