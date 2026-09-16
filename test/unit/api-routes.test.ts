import { describe, expect, it } from 'vitest';
import { GET as getApplications, POST as postApplications } from '../../src/routes/api/applications/+server';
import { GET as getStatistics } from '../../src/routes/api/statistics/+server';

function cookies(userId?: string) {
	return { get: (name: string) => (name === 'travelflow_user' ? userId : undefined) } as never;
}

const validTravel = {
	type: 'travel',
	applicant: { id: 'U003', name: '王芳', department: '市场部', position: '市场专员', roles: ['employee'] },
	title: '客户拜访',
	description: '拜访客户',
	reason: '拜访客户',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-20',
	endDate: '2026-09-21',
	transport: 'train',
	estimatedCost: 1200,
	formData: {
		from: '上海',
		to: '杭州',
		startDate: '2026-09-20',
		endDate: '2026-09-21',
		transport: 'train',
		estimatedCost: 1200
	}
};

describe('申请 API', () => {
	it('未登录请求返回 401', async () => {
		const response = await getApplications({
			cookies: cookies(),
			url: new URL('http://localhost/api/applications')
		} as never);
		expect(response.status).toBe(401);
	});

	it('员工列表只返回自己的数据并支持分页筛选', async () => {
		const response = await getApplications({
			cookies: cookies('U001'),
			url: new URL('http://localhost/api/applications?page=1&pageSize=2&status=all')
		} as never);
		const body = await response.json();
		expect(response.status).toBe(200);
		expect(body.data.every((item: { applicant: { id: string } }) => item.applicant.id === 'U001')).toBe(true);
		expect(body.pagination.page).toBe(1);
	});

	it('员工可以创建草稿，非法状态和非法字段会被拒绝', async () => {
		const draftResponse = await postApplications({
			cookies: cookies('U003'),
			request: new Request('http://localhost/api/applications', {
				method: 'POST',
				body: JSON.stringify({ ...validTravel, status: 'draft' }),
				headers: { 'content-type': 'application/json' }
			})
		} as never);
		expect(draftResponse.status).toBe(201);
		expect((await draftResponse.json()).data.status).toBe('draft');

		const invalidResponse = await postApplications({
			cookies: cookies('U003'),
			request: new Request('http://localhost/api/applications', {
				method: 'POST',
				body: JSON.stringify({ ...validTravel, status: 'unknown' }),
				headers: { 'content-type': 'application/json' }
			})
		} as never);
		expect(invalidResponse.status).toBe(400);
	});

	it('审批人列表排除草稿，审批人不能创建申请', async () => {
		const listResponse = await getApplications({
			cookies: cookies('U002'),
			url: new URL('http://localhost/api/applications')
		} as never);
		const body = await listResponse.json();
		expect(body.data.every((item: { status: string }) => item.status !== 'draft')).toBe(true);

		const response = await postApplications({
			cookies: cookies('U002'),
			request: new Request('http://localhost/api/applications', {
				method: 'POST',
				body: JSON.stringify(validTravel),
				headers: { 'content-type': 'application/json' }
			})
		} as never);
		expect(response.status).toBe(403);
	});
});

describe('统计 API', () => {
	it('仅审批人可访问，并接受固定时间范围', async () => {
		const employeeResponse = await getStatistics({
			cookies: cookies('U001'),
			url: new URL('http://localhost/api/statistics?range=halfYear')
		} as never);
		expect(employeeResponse.status).toBe(403);

		const approverResponse = await getStatistics({
			cookies: cookies('U002'),
			url: new URL('http://localhost/api/statistics?range=quarter')
		} as never);
		const body = await approverResponse.json();
		expect(approverResponse.status).toBe(200);
		expect(body.data.monthlyTrend.months).toHaveLength(3);
	});
});
