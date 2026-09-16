import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import ApplyPage from '../../src/routes/apply/+page.svelte';

function mockAuth(user: { id: string; name: string; department: string; roles: string[] }) {
	vi.stubGlobal(
		'fetch',
		vi.fn((input: RequestInfo | URL) => {
			if (String(input).endsWith('/api/auth')) {
				return Promise.resolve(new Response(JSON.stringify({ data: user, users: [] })));
			}
			return Promise.resolve(new Response(JSON.stringify({ data: null }), { status: 404 }));
		})
	);
}

describe('apply page', () => {
	beforeEach(() => {
		mockAuth({ id: 'U001', name: '张三', department: '研发部', roles: ['employee'] });
	});

	afterEach(() => vi.unstubAllGlobals());

	it('员工可以看到公共字段和差旅字段，出发日期默认今天', async () => {
		render(ApplyPage);

		await expect.element(page.getByRole('heading', { name: '发起申请' })).toBeInTheDocument();
		await expect.element(page.getByLabelText('申请标题 *')).toBeInTheDocument();
		await expect.element(page.getByLabelText('出发地 *')).toBeInTheDocument();
		await expect.element(page.getByLabelText('返回日期 *')).toBeInTheDocument();
		const startDate = page.getByLabelText('出发日期 *');
		await expect.element(startDate).toHaveValue('2026-09-16');
	});

	it('切换申请类型后展示对应业务字段', async () => {
		render(ApplyPage);
		const typeSelect = page.getByLabelText('申请类型 *');
		await typeSelect.selectOptions('purchase');

		await expect.element(page.getByText('采购申请信息')).toBeInTheDocument();
		await expect.element(page.getByRole('textbox', { name: /采购物品/ })).toBeInTheDocument();
		await expect.element(page.getByRole('spinbutton', { name: /采购数量/ })).toBeInTheDocument();
		expect(page.getByLabelText('出发地 *')).not.toBeInTheDocument();
	});

	it('审批人进入发起页时显示无权发起提示', async () => {
		mockAuth({ id: 'U002', name: '李经理', department: '研发部', roles: ['approver'] });
		render(ApplyPage);

		await expect.element(page.getByText('专职审批角色无需发起申请')).toBeInTheDocument();
		expect(page.getByRole('button', { name: '保存草稿' })).not.toBeInTheDocument();
	});
});
