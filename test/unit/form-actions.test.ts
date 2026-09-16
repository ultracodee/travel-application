import { describe, expect, it } from 'vitest';
import { actions } from '../../src/routes/apply/+page.server';

function cookies(userId?: string) {
	return {
		get: (name: string) => (name === 'travelflow_user' ? userId : undefined)
	} as never;
}

function request(payload: unknown, id?: string) {
	const form = new FormData();
	form.set('payload', JSON.stringify(payload));
	if (id) form.set('id', id);
	return new Request('http://localhost/apply', { method: 'POST', body: form });
}

function actionResult(value: unknown) {
	return value as { status?: number; data?: { message?: string; errors?: Record<string, string> } };
}

const travel = {
	type: 'travel',
	title: '客户拜访',
	description: '拜访客户',
	from: '上海',
	to: '杭州',
	startDate: '2026-09-20',
	endDate: '2026-09-21',
	transport: 'train',
	estimatedCost: 1200,
	formData: {}
};

describe('申请表单 actions', () => {
	it('未登录和审批人不能保存申请', async () => {
		const event = { request: request(travel), cookies: cookies() } as never;
		expect(actionResult(await actions.save(event)).status).toBe(401);

		const approverEvent = { request: request(travel), cookies: cookies('U002') } as never;
		expect(actionResult(await actions.save(approverEvent)).status).toBe(403);
	});

	it('校验失败时返回字段错误', async () => {
		const result = await actions.save({
			request: request({ ...travel, title: '' }),
			cookies: cookies('U001')
		} as never);
		expect(actionResult(result).status).toBe(400);
		expect(actionResult(result).data?.message).toBe('表单校验失败');
		expect(actionResult(result).data?.errors).toHaveProperty('title');
	});

	it('员工可以保存草稿并提交审批', async () => {
		const saved = await actions.save({ request: request(travel), cookies: cookies('U003') } as never);
		expect(saved).toEqual({ success: true });

		try {
			await actions.submit({
				request: request({ ...travel, title: '提交审批的客户拜访' }),
				cookies: cookies('U003')
			} as never);
			expect.fail('提交审批应当重定向');
		} catch (error) {
			expect(error).toMatchObject({ status: 303 });
		}
	});

	it('无效请求体返回保存失败', async () => {
		const form = new FormData();
		form.set('payload', '{invalid');
		const result = await actions.save({
			request: new Request('http://localhost/apply', { method: 'POST', body: form }),
			cookies: cookies('U001')
		} as never);
		expect(actionResult(result).status).toBe(400);
		expect(actionResult(result).data?.message).toBe('草稿保存失败');
	});
});
