import type { TravelApplication, ApplicationStatus } from '$lib/types/application';

export function countByStatus(applications: TravelApplication[]): Record<ApplicationStatus, number> {
	const counts: Record<ApplicationStatus, number> = {
		draft: 0,
		pending: 0,
		approved: 0,
		rejected: 0
	};

	for (const application of applications) counts[application.status] += 1;
	return counts;
}

export function countByDepartment(applications: TravelApplication[]): Record<string, number> {
	return applications.reduce<Record<string, number>>((counts, application) => {
		const department = application.applicant.department;
		counts[department] = (counts[department] ?? 0) + 1;
		return counts;
	}, {});
}
