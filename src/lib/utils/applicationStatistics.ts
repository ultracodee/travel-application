import type { TravelApplication, ApplicationStatus, ApplicationType } from '$lib/types/application';
import { getApplicationAmount, getApplicationBusinessDate } from './applicationDisplay';

export type SubmittedApplicationStatus = Exclude<ApplicationStatus, 'draft'>;

export interface DepartmentMonthlyTrend {
	department: string;
	data: number[];
}

export interface MonthlyTrend {
	months: string[];
	data: number[];
}

export function countByApplicationType(applications: TravelApplication[]): Record<ApplicationType, number> {
	const counts: Record<ApplicationType, number> = { travel: 0, purchase: 0, expense: 0, overtime: 0 };
	for (const application of applications) counts[application.type] += 1;
	return counts;
}

export function countBySubmittedApplicationType(applications: TravelApplication[]): Record<ApplicationType, number> {
	return countByApplicationType(getSubmittedApplications(applications));
}

export type StatisticsRange = 'year' | 'halfYear' | 'quarter' | 'currentYear';

export function getSubmittedApplications(applications: TravelApplication[]): TravelApplication[] {
	return applications.filter((application) => application.status !== 'draft');
}

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

export function countBySubmittedStatus(applications: TravelApplication[]): Record<SubmittedApplicationStatus, number> {
	const counts: Record<SubmittedApplicationStatus, number> = {
		pending: 0,
		approved: 0,
		rejected: 0
	};

	for (const application of applications) {
		if (application.status !== 'draft') counts[application.status] += 1;
	}
	return counts;
}

export function countByDepartment(applications: TravelApplication[]): Record<string, number> {
	return applications.reduce<Record<string, number>>((counts, application) => {
		const department = application.applicant.department;
		counts[department] = (counts[department] ?? 0) + 1;
		return counts;
	}, {});
}

export function countBySubmittedDepartment(applications: TravelApplication[]): Record<string, number> {
	return countByDepartment(getSubmittedApplications(applications));
}

export function getRecentMonths(referenceDate: Date | string = new Date(), monthCount = 12): string[] {
	if (!Number.isInteger(monthCount) || monthCount <= 0) return [];

	const date = new Date(referenceDate);
	if (Number.isNaN(date.getTime())) throw new Error('无效的参考日期');

	const currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
	return Array.from({ length: monthCount }, (_, index) => {
		const month = new Date(currentMonth);
		month.setMonth(currentMonth.getMonth() - (monthCount - 1 - index));
		return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
	});
}

export function getMonthsByRange(referenceDate: Date | string = new Date(), range: StatisticsRange = 'year'): string[] {
	const date = new Date(referenceDate);
	if (Number.isNaN(date.getTime())) throw new Error('无效的参考日期');

	if (range === 'currentYear') {
		return getRecentMonths(date, date.getMonth() + 1).slice(0, date.getMonth() + 1);
	}

	const monthCount = range === 'halfYear' ? 6 : range === 'quarter' ? 3 : 12;
	return getRecentMonths(date, monthCount);
}

export function filterApplicationsByRange(
	applications: TravelApplication[],
	referenceDate: Date | string = new Date(),
	range: StatisticsRange = 'year'
): TravelApplication[] {
	const months = new Set(getMonthsByRange(referenceDate, range));
	return getSubmittedApplications(applications).filter((application) =>
		months.has(getApplicationBusinessDate(application).slice(0, 7))
	);
}

export function countByDepartmentMonthlyTrend(
	applications: TravelApplication[],
	referenceDate: Date | string = new Date(),
	monthCount: number | StatisticsRange = 12
): { months: string[]; series: DepartmentMonthlyTrend[] } {
	const months =
		typeof monthCount === 'number'
			? getRecentMonths(referenceDate, monthCount)
			: getMonthsByRange(referenceDate, monthCount);
	const monthIndex = new Map(months.map((month, index) => [month, index]));
	const values = new Map<string, number[]>();

	for (const application of getSubmittedApplications(applications)) {
		const month = getApplicationBusinessDate(application).slice(0, 7);
		const index = monthIndex.get(month);
		if (index === undefined) continue;

		const department = application.applicant.department;
		const data = values.get(department) ?? Array.from({ length: months.length }, () => 0);
		data[index] += 1;
		values.set(department, data);
	}

	return {
		months,
		series: [...values.entries()]
			.sort(([left], [right]) => left.localeCompare(right, 'zh-CN'))
			.map(([department, data]) => ({ department, data }))
	};
}

export function sumByMonth(
	applications: TravelApplication[],
	referenceDate: Date | string = new Date(),
	monthCount: number | StatisticsRange = 12
): MonthlyTrend {
	const months =
		typeof monthCount === 'number'
			? getRecentMonths(referenceDate, monthCount)
			: getMonthsByRange(referenceDate, monthCount);
	const monthIndex = new Map(months.map((month, index) => [month, index]));
	const data = Array.from({ length: months.length }, () => 0);

	for (const application of getSubmittedApplications(applications)) {
		const index = monthIndex.get(getApplicationBusinessDate(application).slice(0, 7));
		const amount = getApplicationAmount(application);
		if (index !== undefined && amount !== undefined) data[index] += amount;
	}

	return { months, data };
}
