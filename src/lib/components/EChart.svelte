<script lang="ts">
	import { onMount } from 'svelte';
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
	let chart: import('echarts/core').ECharts | undefined;

	$effect(() => {
		if (chart) chart.setOption(option, true);
	});

	onMount(() => {
		let resizeObserver: ResizeObserver | undefined;
		let disposed = false;

		void (async () => {
			const [
				echarts,
				{ BarChart, LineChart, PieChart },
				{ GridComponent, LegendComponent, TitleComponent, TooltipComponent },
				{ CanvasRenderer }
			] = await Promise.all([
				import('echarts/core'),
				import('echarts/charts'),
				import('echarts/components'),
				import('echarts/renderers')
			]);
			if (!container || disposed) return;

			echarts.use([
				BarChart,
				LineChart,
				PieChart,
				GridComponent,
				LegendComponent,
				TitleComponent,
				TooltipComponent,
				CanvasRenderer
			]);
			chart = echarts.init(container);
			chart.setOption(option, true);

			resizeObserver = new ResizeObserver(() => chart?.resize());
			resizeObserver.observe(container);
		})();

		return () => {
			disposed = true;
			resizeObserver?.disconnect();
			chart?.dispose();
			chart = undefined;
		};
	});
</script>

<div bind:this={container} class="min-h-[180px] w-full" style:height role="img" aria-label={ariaLabel}></div>
