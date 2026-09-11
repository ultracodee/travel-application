import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import MetricCard from '$lib/components/MetricCard.svelte';

describe('MetricCard.svelte', () => {
	it('renders the label, value and hint', async () => {
		render(MetricCard, {
			label: '已提交申请',
			value: 28,
			hint: '不含草稿'
		});

		await expect.element(page.getByText('已提交申请')).toBeInTheDocument();
		await expect.element(page.getByText('28')).toBeInTheDocument();
		await expect.element(page.getByText('不含草稿')).toBeInTheDocument();
	});

	it('supports formatted string values', async () => {
		render(MetricCard, {
			label: '总预计费用',
			value: '¥ 35,600',
			hint: '已提交申请预计费用'
		});

		await expect.element(page.getByText('¥ 35,600')).toBeInTheDocument();
	});
});
