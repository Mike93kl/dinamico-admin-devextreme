import {ParentPackageModel} from '../ParentPackageModel';
import {PackageModel} from '../PackageModel';
import {FnResponse} from './FnResponse_v1';

export interface GetPackagesFnResponseData {
  parent: ParentPackageModel;
  children: PackageModel[];
}

export interface GetPackagesFnResponse extends FnResponse<GetPackagesFnResponseData[]> {
}
