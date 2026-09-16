import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAuthState, hasRole, switchCurrentUser } from '../../src/lib/client/auth';

describe('client auth helpers', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('loads the current user and available users', async () => {
		const state = { data: { id: 'U001' }, users: [{ id: 'U001' }] };
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(JSON.stringify(state))))
		);

		await expect(getAuthState()).resolves.toEqual(state);
		expect(fetch).toHaveBeenCalledWith('/api/auth');
	});

	it('throws when loading auth state fails', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(null, { status: 500 })))
		);

		await expect(getAuthState()).rejects.toThrow('获取当前用户失败');
	});

	it('switches user through the auth endpoint', async () => {
		const user = { id: 'U002', name: '李经理' };
		const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify({ data: user }))));
		vi.stubGlobal('fetch', fetchMock);

		await expect(switchCurrentUser('U002')).resolves.toEqual(user);
		expect(fetchMock).toHaveBeenCalledWith('/api/auth', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ userId: 'U002' })
		});
	});

	it('throws when switching user fails and checks roles safely', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.resolve(new Response(null, { status: 403 })))
		);

		await expect(switchCurrentUser('U999')).rejects.toThrow('切换用户失败');
		expect(hasRole(null, 'approver')).toBe(false);
		expect(hasRole({ id: 'U002', roles: ['approver'] } as never, 'approver')).toBe(true);
	});
});
