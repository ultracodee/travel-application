import { json } from '@sveltejs/kit';
import { createApplication, listApplicationsPage } from '$lib/server/applicationRepository';
import { validateTravelApplication } from '$lib/utils/applicationValidation';
import type { ApplicationStatus, TravelApplicationInput } from '$lib/types/application';
import { getCurrentUser, hasRole } from '$lib/server/auth';
import { approver } from '$lib/server/applicationRepository';

const statusValues: Array<'all' | ApplicationStatus> = ['all', 'draft', 'pending', 'approved', 'rejected'];

function parsePositiveInt(value: string | null): number | undefined {
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseStatus(value: string | null): 'all' | ApplicationStatus {
	return statusValues.includes(value as 'all' | ApplicationStatus) ? (value as 'all' | ApplicationStatus) : 'all';
}

export function GET({ cookies, url }) {
	const user = getCurrentUser(cookies);
	if (!user) return json({ message: '请先登录' }, { status: 401 });

	const page = parsePositiveInt(url.searchParams.get('page'));
	const pageSize = parsePositiveInt(url.searchParams.get('pageSize'));
	const status = parseStatus(url.searchParams.get('status'));
	const keyword = url.searchParams.get('keyword') ?? '';
	const excludeDraft = hasRole(user, 'approver');
	const applicantId = hasRole(user, 'approver') ? undefined : user.id;

	if (page || pageSize || keyword || status !== 'all') {
		return json(listApplicationsPage({ page, pageSize, keyword, status, applicantId, excludeDraft }));
	}

	const data = listApplicationsPage({ applicantId, excludeDraft, pageSize: Number.MAX_SAFE_INTEGER }).data;
	return json({ data });
}

export async function POST({ request, cookies }) {
	try {
		const user = getCurrentUser(cookies);
		if (!user) return json({ message: '请先登录' }, { status: 401 });
		if (!hasRole(user, 'employee')) return json({ message: '当前用户没有提交申请权限' }, { status: 403 });
		const body = (await request.json()) as TravelApplicationInput & { status?: 'draft' | 'pending' };
		const { status = 'draft', ...input } = body;
		if (!['draft', 'pending'].includes(status)) {
			return json({ message: '不支持的创建状态' }, { status: 400 });
		}
		const errors = validateTravelApplication(input);

		if (Object.keys(errors).length > 0) {
			return json({ message: '表单校验失败', errors }, { status: 400 });
		}

		return json({ data: createApplication(input, user, approver.id, status) }, { status: 201 });
	} catch {
		return json({ message: '请求体格式无效' }, { status: 400 });
	}
}
