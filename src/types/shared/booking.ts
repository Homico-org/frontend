/**
 * BOOKING TYPES
 * Types for the professional booking system.
 */

import { BaseEntity } from './base';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking extends BaseEntity {
  professional: {
    _id: string;
    name: string;
    avatar?: string;
    phone?: string;
    accountType?: string;
  };
  client: {
    _id: string;
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
