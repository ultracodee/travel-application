import type { User, UserRole } from '$lib/types/user';

export interface AuthState {
	data: User | null;
	users: User[];
}

export async function getAuthState(): Promise<AuthState> {
	const response = await fetch('/api/auth');
	if (!response.ok) throw new Error('获取当前用户失败');
	return response.json() as Promise<AuthState>;
}

export async function switchCurrentUser(userId: string): Promise<User> {
	const response = await fetch('/api/auth', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ userId })
	});
	if (!response.ok) throw new Error('切换用户失败');
	return (await response.json()).data as User;
}

export function hasRole(user: User | null, role: UserRole): boolean {
	return user?.roles.includes(role) ?? false;
}
