import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StatisticsPage from '../../src/routes/statistics/+page.svelte';

const application = {
	id: 'TRV-TEST-STAT-001',
	applicant: { id: 'U001', name: '张三', department: '研发部' },
	approverId: 'U002',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-01',
	endDate: '2026-09-03',
	reason: '客户现场支持',
	transport: 'train',
	estimatedCost: 1200,
	status: 'approved',
	approvalRecords: [],
	createdAt: '2026-08-01T00:00:00.000Z',
	updatedAt: '2026-08-03T00:00:00.000Z'
};

describe('statistics page', () => {
	beforeEach(() => {
		vi.stubGlobal(
			'fetch',
			vi.fn((input: RequestInfo | URL) => {
				const url = String(input);
				if (url.endsWith('/api/auth')) {
					return Promise.resolve(
						new Response(
							JSON.stringify({
								data: { id: 'U002', name: '李经理', department: '研发部', roles: ['approver'] },
								users: []
							})
						)
					);
				}
				return Promise.resolve(
					new Response(
						JSON.stringify({
							data: {
								applications: [application],
								statusCounts: { pending: 0, approved: 1, rejected: 0 },
								departmentCounts: { 研发部: 1 },
								monthlyTrend: { months: ['2026-09'], series: [{ department: '研发部', data: [1] }] },
								monthlyCost: { months: ['2026-09'], data: [1200] },
								totalSubmitted: 1,
								totalCost: 1200,
								completedCount: 1,
								approvalRate: 100
							}
						})
					)
				);
			})
		);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('shows approver statistics and range selector', async () => {
		render(StatisticsPage);
		await expect.element(page.getByText('数据统计')).toBeInTheDocument();
		await expect.element(page.getByLabelText('统计时间范围')).toBeInTheDocument();
		await expect.element(page.getByText('部门月度出差趋势')).toBeInTheDocument();
		await expect.element(page.getByText('月度预计费用')).toBeInTheDocument();
	});
});
