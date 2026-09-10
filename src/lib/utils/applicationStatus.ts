import type { ApplicationStatus } from '$lib/types/application';

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
	draft: ['pending'],
	pending: ['approved', 'rejected'],
	approved: [],
	rejected: ['pending']
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
	return transitions[from].includes(to);
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus): void {
	if (!canTransition(from, to)) {
		throw new Error(`不允许将申请状态从 ${from} 变更为 ${to}`);
	}
}

export function getAvailableActions(status: ApplicationStatus): ApplicationStatus[] {
	return [...transitions[status]];
}
