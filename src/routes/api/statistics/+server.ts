import { json } from '@sveltejs/kit';
import { getCurrentUser, hasRole } from '$lib/server/auth';
import { getApplicationsForUser } from '$lib/server/applicationRepository';
import {
	countBySubmittedDepartment,
	countBySubmittedApplicationType,
	countBySubmittedStatus,
	countByDepartmentMonthlyTrend,
	filterApplicationsByRange,
	sumByMonth,
	type StatisticsRange
} from '$lib/utils/applicationStatistics';

const ranges: StatisticsRange[] = ['year', 'halfYear', 'quarter', 'currentYear'];

export function GET({ cookies, url }) {
	const user = getCurrentUser(cookies);
	if (!user) return json({ message: '请先登录' }, { status: 401 });
	if (!hasRole(user, 'approver')) return json({ message: '数据统计仅对审批人开放' }, { status: 403 });

	const requested = url.searchParams.get('range') as StatisticsRange | null;
	const range = requested && ranges.includes(requested) ? requested : 'year';
	const applications = filterApplicationsByRange(getApplicationsForUser(user), new Date(), range);
	const statusCounts = countBySubmittedStatus(applications);
	const departmentCounts = countBySubmittedDepartment(applications);
	const monthlyTrend = countByDepartmentMonthlyTrend(applications, new Date(), range);
	const monthlyCost = sumByMonth(applications, new Date(), range);
	const typeCounts = countBySubmittedApplicationType(applications);
	const totalSubmitted = applications.length;
	const totalCost = monthlyCost.data.reduce((sum, amount) => sum + amount, 0);
	const completedCount = statusCounts.approved + statusCounts.rejected;

	return json({
		data: {
			applications,
			statusCounts,
			departmentCounts,
			typeCounts,
			monthlyTrend,
			monthlyCost,
			totalSubmitted,
			totalCost,
			completedCount,
			approvalRate: completedCount ? Math.round((statusCounts.approved / completedCount) * 100) : 0
		}
	});
}
