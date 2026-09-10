import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import EChart from '$lib/components/EChart.svelte';

describe('EChart.svelte', () => {
	it('renders an accessible chart container with the configured height', async () => {
		render(EChart, {
			option: {
				title: { text: '测试图表' },
				series: [{ type: 'pie', data: [{ value: 1, name: '测试' }] }]
			},
			height: '320px',
			ariaLabel: '测试统计图'
		});

		const chart = page.getByRole('img', { name: '测试统计图' });
		await expect.element(chart).toBeInTheDocument();
		await expect.element(chart).toHaveStyle('height: 320px');
	});
});
