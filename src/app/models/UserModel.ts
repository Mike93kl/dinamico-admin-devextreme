import {Model} from './Model';

export interface UserModel extends Model{
  fullName: string;
  phone: string;
  email?: string;
  active: boolean;
  password?: string;
  requestPasswordChange?: boolean;
  createdAt?: string;
  identification?: string;

  // claims
  claims?: {
    role: string;
    admin?: boolean;
    manager?: boolean;
  };
}
