import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ApplicationDetailPage from '../../src/routes/applications/[id]/+page.svelte';

const application = {
	id: 'APP-PENDING-DETAIL',
	type: 'travel',
	title: '客户拜访',
	description: '拜访客户',
	applicant: { id: 'U001', name: '张三', department: '研发部', position: '前端开发' },
	approverId: 'U002',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-21',
	endDate: '2026-09-22',
	reason: '拜访客户',
	transport: 'train',
	estimatedCost: 1200,
	formData: {
		from: '上海',
		to: '杭州',
		startDate: '2026-09-21',
		endDate: '2026-09-22',
		transport: 'train',
		estimatedCost: 1200
	},
	status: 'pending',
	approvalRecords: [],
	createdAt: '2026-09-01T00:00:00.000Z',
	updatedAt: '2026-09-01T00:00:00.000Z'
};

function mockFetch(user: { id: string; name: string; roles: string[] }, patchResponse = application) {
	vi.stubGlobal(
		'fetch',
		vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
			const url = String(input);
			if (url.endsWith('/api/auth')) {
				return Promise.resolve(new Response(JSON.stringify({ data: user, users: [] })));
			}
			if (init?.method === 'PATCH') {
				return Promise.resolve(new Response(JSON.stringify({ data: patchResponse })));
			}
			return Promise.resolve(new Response(JSON.stringify({ data: application })));
		})
	);
}

describe('application detail page', () => {
	beforeEach(() => {
		window.history.pushState({}, '', `/applications/${application.id}`);
	});

	afterEach(() => vi.unstubAllGlobals());

	it('员工查看审批中申请时不显示审批处理按钮', async () => {
		mockFetch({ id: 'U001', name: '张三', roles: ['employee'] });
		render(ApplicationDetailPage);

		await expect.element(page.getByRole('heading', { name: '申请详情' })).toBeInTheDocument();
		await expect.element(page.getByText('客户拜访')).toBeInTheDocument();
		expect(page.getByRole('button', { name: '通过' })).not.toBeInTheDocument();
		expect(page.getByRole('button', { name: '驳回' })).not.toBeInTheDocument();
	});

	it('审批人可以处理审批中申请并看到成功提示', async () => {
		mockFetch({ id: 'U002', name: '李经理', roles: ['approver'] }, { ...application, status: 'approved' });
		render(ApplicationDetailPage);

		await expect.element(page.getByRole('button', { name: '通过' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: '驳回' })).toBeInTheDocument();
		await page.getByRole('button', { name: '通过' }).click();
		await expect.element(page.getByText('已通过')).toBeInTheDocument();
	});
});
