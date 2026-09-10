import type { Cookies } from '@sveltejs/kit';
import type { User, UserRole } from '$lib/types/user';

export type { User, UserRole } from '$lib/types/user';

export const users: User[] = [
	{ id: 'U001', name: '张三', department: '研发部', position: '前端开发', roles: ['employee'] },
	{ id: 'U002', name: '李经理', department: '研发部', position: '部门负责人', roles: ['approver'] },
	{ id: 'U003', name: '王芳', department: '市场部', position: '市场专员', roles: ['employee'] }
];

export const SESSION_COOKIE = 'travelflow_user';

export function findUser(id: string | undefined): User | undefined {
	return users.find((user) => user.id === id);
}

export function getCurrentUser(cookies: Cookies): User | undefined {
	return findUser(cookies.get(SESSION_COOKIE));
}

export function hasRole(user: User, role: UserRole): boolean {
	return user.roles.includes(role);
}

export function setCurrentUser(cookies: Cookies, userId: string) {
	cookies.set(SESSION_COOKIE, userId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 8
	});
}
