import { afterEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { Snippet } from 'svelte';
import Layout from '../../src/routes/+layout.svelte';

const employee = { id: 'U001', name: '张三', department: '研发部', position: '工程师', roles: ['employee'] };
const approver = { id: 'U002', name: '李经理', department: '研发部', position: '部门经理', roles: ['approver'] };
const children = (() => {}) as Snippet;

function mockAuth(user: typeof employee) {
	vi.stubGlobal(
		'fetch',
		vi.fn(() =>
			Promise.resolve(
				new Response(
					JSON.stringify({
						data: user,
						users: [employee, approver]
					})
				)
			)
		)
	);
}

describe('application layout', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('shows employee navigation and current user identity', async () => {
		mockAuth(employee);
		render(Layout, { children });

		await expect.element(page.getByText('张三', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('研发部 · 工程师')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /发起申请/ })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /我的申请/ })).toBeInTheDocument();
		expect(page.getByRole('link', { name: /审批管理/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('combobox', { name: '切换演示用户' })).toHaveValue('U001');
	});

	it('shows approver navigation and avatar after auth loads', async () => {
		mockAuth(approver);
		render(Layout, { children });

		await expect.element(page.getByText('李经理', { exact: true })).toBeInTheDocument();
		await expect.element(page.getByText('研发部 · 部门经理')).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /审批管理/ })).toBeInTheDocument();
		await expect.element(page.getByRole('link', { name: /数据统计/ })).toBeInTheDocument();
		expect(page.getByRole('link', { name: /发起申请/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('combobox', { name: '切换演示用户' })).toHaveValue('U002');
	});
});
