<script lang="ts">
	import { onMount } from 'svelte';
	import * as echarts from 'echarts';
	import type { EChartsOption } from 'echarts';

	let {
		option,
		height = '280px',
		ariaLabel = '统计图表'
	}: {
		option: EChartsOption;
		height?: string;
		ariaLabel?: string;
	} = $props();

	let container = $state<HTMLDivElement>();
	let chart: echarts.ECharts | undefined;

	$effect(() => {
		if (chart) chart.setOption(option, true);
	});

	onMount(() => {
		if (!container) return;

		chart = echarts.init(container);
		chart.setOption(option, true);

		const resizeObserver = new ResizeObserver(() => chart?.resize());
		resizeObserver.observe(container);

		return () => {
			resizeObserver.disconnect();
			chart?.dispose();
			chart = undefined;
		};
	});
</script>

<div
	bind:this={container}
	class="echart"
	style:height
	role="img"
	aria-label={ariaLabel}
></div>

<style>
	.echart {
		width: 100%;
		min-height: 180px;
	}
</style>
