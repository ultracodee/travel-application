import { json } from '@sveltejs/kit';
import { findUser, getCurrentUser, setCurrentUser } from '$lib/server/auth';

export function GET({ cookies }) {
	const current = getCurrentUser(cookies) ?? findUser('U001');
	if (current && !getCurrentUser(cookies)) setCurrentUser(cookies, current.id);
	return json({ data: current, users: [findUser('U001'), findUser('U002')] });
}

export async function POST({ request, cookies }) {
	try {
		const { userId } = (await request.json()) as { userId?: string };
		const user = findUser(userId);
		if (!user) return json({ message: '用户不存在' }, { status: 400 });
		setCurrentUser(cookies, user.id);
		return json({ data: user });
	} catch {
		return json({ message: '请求体格式无效' }, { status: 400 });
	}
}
