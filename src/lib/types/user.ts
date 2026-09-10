import type { Applicant } from './application';

export type UserRole = 'employee' | 'approver';

export interface User extends Applicant {
	roles: UserRole[];
}
