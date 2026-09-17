<script lang="ts">
	import { onMount } from 'svelte';
	import ChartCard from '$lib/components/ChartCard.svelte';
	import EChart from '$lib/components/EChart.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import type { TravelApplication } from '$lib/types/application';
	import type { StatisticsRange } from '$lib/utils/applicationStatistics';
	import {
		createCostOption,
		createDepartmentOption,
		createDepartmentTrendOption,
		createStatusOption,
		createApplicationTypeOption
	} from '$lib/utils/statisticsOptions';
	import { getAuthState, hasRole } from '$lib/client/auth';
	import { getApplicationAmount } from '$lib/utils/applicationDisplay';

	let isApprover = $state(false);
	let loading = $state(true);
	let selectedRange = $state<StatisticsRange>('year');
	let submittedApplications = $state<TravelApplication[]>([]);
	let statusCounts = $state({ pending: 0, approved: 0, rejected: 0 });
	let typeCounts = $state({ travel: 0, purchase: 0, expense: 0, overtime: 0 });
	let departmentCounts = $state<Record<string, number>>({});
	let monthlyTrend = $state({ months: [] as string[], series: [] as { department: string; data: number[] }[] });
	let monthlyCost = $state({ months: [] as string[], data: [] as number[] });
	let totalSubmitted = $state(0);
	let totalCost = $state(0);
	let completedCount = $state(0);
	let approvalRate = $state(0);
	let currentMonth = $derived(monthlyTrend.months.at(-1) ?? '');
	let currentMonthCount = $derived(monthlyTrend.series.reduce((sum, item) => sum + (item.data.at(-1) ?? 0), 0));
	let amountApplications = $derived(submittedApplications.filter((item) => getApplicationAmount(item) !== undefined));
	let averageAmount = $derived(amountApplications.length ? totalCost / amountApplications.length : 0);
	let maxAmount = $derived(
		amountApplications.length ? Math.max(...amountApplications.map((item) => getApplicationAmount(item) ?? 0)) : 0
	);

	let statusOption = $derived(createStatusOption(statusCounts));
	let typeOption = $derived(createApplicationTypeOption(typeCounts));
	let departmentOption = $derived(createDepartmentOption(departmentCounts));
	let trendOption = $derived(createDepartmentTrendOption(monthlyTrend));
	let costOption = $derived(createCostOption(monthlyCost));

	async function loadStatistics() {
		loading = true;
		const response = await fetch(`/api/statistics?range=${selectedRange}`);
		if (response.ok) {
			const payload = (await response.json()).data;
			submittedApplications = payload.applications;
			statusCounts = payload.statusCounts;
			typeCounts = payload.typeCounts;
			departmentCounts = payload.departmentCounts;
			monthlyTrend = payload.monthlyTrend;
			monthlyCost = payload.monthlyCost;
			totalSubmitted = payload.totalSubmitted;
			totalCost = payload.totalCost;
			completedCount = payload.completedCount;
			approvalRate = payload.approvalRate;
		}
		loading = false;
	}

	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		if (!isApprover) loading = false;
	});

	$effect(() => {
		if (isApprover) void loadStatistics();
	});
</script>

<svelte:head><title>数据统计 - 申请管理</title></svelte:head>
<PageHeader title="数据统计" description="从申请量、审批状态和金额趋势了解各部门申请情况。">
	<select
		class="h-10 min-w-32 rounded-lg border border-[#dfe5ee] bg-white px-3 text-[#44516a] outline-none focus:border-[#3975f6] focus:shadow-[0_0_0_3px_#3975f61c]"
		aria-label="统计时间范围"
		bind:value={selectedRange}
		><option value="year">最近一年</option><option value="halfYear">最近半年</option><option value="quarter"
			>最近三月</option
		><option value="currentYear">今年</option></select
	>
</PageHeader>
{#if loading}<Panel><EmptyState description="正在加载统计数据…" /></Panel>
{:else if !isApprover}<Panel>
		<EmptyState title="数据统计仅对审批人开放" description="请切换到李经理账号查看申请统计。" />
	</Panel>
{:else}<section class="mb-[18px] grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[430px]:grid-cols-1">
		<MetricCard label="已提交申请" value={totalSubmitted} hint="不含草稿" />
		<MetricCard
			label={`${currentMonth.slice(0, 4)}年${currentMonth.slice(5)}月申请`}
			value={currentMonthCount}
			hint="按业务日期统计"
		/>
		<MetricCard label="审批通过率" value={`${approvalRate}%`} hint="仅统计已完成审批" />
		<MetricCard label="金额合计" value={`¥ ${totalCost.toLocaleString()}`} hint="仅统计有金额字段的申请" />
	</section>
	<Panel
		class="mb-[18px] grid grid-cols-[1.2fr_repeat(3,1fr)] items-center gap-[18px] px-6 py-[22px] max-[700px]:grid-cols-2 max-[430px]:grid-cols-1"
	>
		<h2 class="m-0 text-[17px] max-[700px]:col-span-full max-[430px]:col-auto">费用概览</h2>
		<div
			class="border-l border-[#edf0f5] pl-[18px] max-[430px]:border-t max-[430px]:border-l-0 max-[430px]:pt-2.5 max-[430px]:pl-0"
		>
			<span class="block text-xs text-[#8a95a8]">平均申请金额</span><strong
				class="mt-2 block text-[19px] text-[#34415a]">¥ {averageAmount.toFixed(2)}</strong
			>
		</div>
		<div
			class="border-l border-[#edf0f5] pl-[18px] max-[430px]:border-t max-[430px]:border-l-0 max-[430px]:pt-2.5 max-[430px]:pl-0"
		>
			<span class="block text-xs text-[#8a95a8]">最高单笔费用</span><strong
				class="mt-2 block text-[19px] text-[#34415a]">¥ {maxAmount.toFixed(2)}</strong
			>
		</div>
		<div
			class="border-l border-[#edf0f5] pl-[18px] max-[430px]:border-t max-[430px]:border-l-0 max-[430px]:pt-2.5 max-[430px]:pl-0"
		>
			<span class="block text-xs text-[#8a95a8]">完成审批量</span><strong class="mt-2 block text-[19px] text-[#34415a]"
				>{completedCount}</strong
			>
		</div>
	</Panel>
	<ChartCard
		title="部门月度申请趋势"
		description={`按业务日期所在月份统计，${
			selectedRange === 'currentYear'
				? '今年'
				: selectedRange === 'halfYear'
					? '最近 6 个月'
					: selectedRange === 'quarter'
						? '最近 3 个月'
						: '最近 12 个月'
		}`}
		meta="堆叠申请单量 · 不含草稿"
	>
		{#key selectedRange}<EChart option={trendOption} height="350px" ariaLabel="部门月度申请趋势堆叠柱状图" />{/key}
	</ChartCard>
	<ChartCard
		title="月度预计费用"
		description="按业务日期月份汇总所选范围内有金额字段的申请"
		meta="人民币"
		class="pt-6 pb-[18px]"
	>
		{#key selectedRange}<EChart option={costOption} height="260px" ariaLabel="月度预计费用柱状图" />{/key}
	</ChartCard>
	<section class="mb-[18px] grid grid-cols-2 gap-[18px] max-[700px]:grid-cols-1">
		<ChartCard title="申请状态分布" meta="所选范围 · 已提交申请" class="min-h-[340px]">
			{#key selectedRange}<EChart option={statusOption} height="280px" ariaLabel="申请状态分布环形图" />{/key}
		</ChartCard>
		<ChartCard title="申请类型分布" meta="所选范围 · 已提交申请" class="min-h-[340px]">
			{#key selectedRange}<EChart option={typeOption} height="280px" ariaLabel="申请类型分布环形图" />{/key}
		</ChartCard>
		<ChartCard title="部门申请单量" meta="所选范围 · 已提交申请" class="min-h-[340px]">
			{#key selectedRange}<EChart option={departmentOption} height="280px" ariaLabel="部门申请单量柱状图" />{/key}
		</ChartCard>
	</section>
{/if}
