import { Model } from './Model';

export interface ParentPackageModel extends Model {
    title: string;
    children?: string[] | null;
}
