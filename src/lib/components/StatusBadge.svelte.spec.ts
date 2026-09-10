import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StatusBadge from './StatusBadge.svelte';

describe('StatusBadge.svelte', () => {
	it.each([
		['draft', '草稿', 'status-draft'],
		['pending', '审批中', 'status-pending'],
		['approved', '已通过', 'status-approved'],
		['rejected', '已驳回', 'status-rejected']
	] as const)('renders %s status', async (status, label, className) => {
		render(StatusBadge, { status });

		const badge = page.getByText(label);
		await expect.element(badge).toBeInTheDocument();
		await expect.element(badge).toHaveClass(className);
	});
});
