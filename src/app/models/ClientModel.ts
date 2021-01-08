import {Model} from './Model';

export interface ClientModel extends Model{
  fullName: string;
  active: boolean;
  phone: string;
  email: string;
  dateOfBirth?: any;
  notes?: string;
  requestPasswordChange?: any;
}
