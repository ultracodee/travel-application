import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ApplicationsPage from '../../src/routes/applications/+page.svelte';

const draftApplication = {
	id: 'APP-DRAFT-001',
	type: 'purchase',
	title: '采购显示器',
	description: '研发设备补充',
	applicant: { id: 'U001', name: '张三', department: '研发部' },
	approverId: 'U002',
	from: '',
	to: '',
	startDate: '2026-09-20',
	endDate: '2026-09-20',
	reason: '研发设备补充',
	transport: '',
	estimatedCost: 3600,
	status: 'draft',
	formData: {
		itemName: '显示器',
		quantity: 2,
		budgetAmount: 3600,
		expectedDate: '2026-09-20',
		purchaseReason: '研发设备补充'
	},
	approvalRecords: [],
	createdAt: '2026-09-01T00:00:00.000Z',
	updatedAt: '2026-09-01T00:00:00.000Z'
};

const pendingApplication = {
	id: 'APP-PENDING-001',
	type: 'travel',
	title: '客户拜访',
	description: '拜访客户',
	applicant: { id: 'U003', name: '王芳', department: '市场部' },
	approverId: 'U002',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-21',
	endDate: '2026-09-22',
	reason: '拜访客户',
	transport: 'train',
	estimatedCost: 1200,
	status: 'pending',
	formData: {
		from: '上海',
		to: '杭州',
		startDate: '2026-09-21',
		endDate: '2026-09-22',
		transport: 'train',
		estimatedCost: 1200
	},
	approvalRecords: [],
	createdAt: '2026-09-01T00:00:00.000Z',
	updatedAt: '2026-09-01T00:00:00.000Z'
};

function mockFetch(user: { id: string; name: string; roles: string[] }, applications: unknown[]) {
	vi.stubGlobal(
		'fetch',
		vi.fn((input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith('/api/auth')) {
				return Promise.resolve(
					new Response(
						JSON.stringify({
							data: user,
							users: []
						})
					)
				);
			}
			return Promise.resolve(
				new Response(
					JSON.stringify({
						data: applications,
						pagination: { page: 1, pageSize: 10, total: applications.length, totalPages: 1 }
					})
				)
			);
		})
	);
}

describe('applications page', () => {
	beforeEach(() =>
		vi.stubGlobal(
			'confirm',
			vi.fn(() => true)
		)
	);
	afterEach(() => vi.unstubAllGlobals());

	it('shows employee view with create, draft edit and delete actions', async () => {
		mockFetch({ id: 'U001', name: '张三', roles: ['employee'] }, [draftApplication]);
		render(ApplicationsPage);

		await expect.element(page.getByRole('heading', { name: '我的申请' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: '＋ 新建申请' })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: '编辑' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '删除' })).toBeInTheDocument();
		await expect.element(page.getByRole('option', { name: '草稿' })).toBeInTheDocument();
	});

	it('shows approver view without create entry and draft status filter', async () => {
		mockFetch({ id: 'U002', name: '李经理', roles: ['approver'] }, [pendingApplication]);
		render(ApplicationsPage);

		await expect.element(page.getByRole('heading', { name: '审批管理' })).toBeInTheDocument();
		await expect.element(page.getByText('查看并处理全部员工的申请。')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: '查看详情' })).toBeInTheDocument();
		expect(page.getByRole('link', { name: '＋ 新建申请' })).not.toBeInTheDocument();
		expect(page.getByRole('option', { name: '草稿' })).not.toBeInTheDocument();
	});
});
