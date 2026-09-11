<script lang="ts">
	import { onMount } from 'svelte';
	import EChart from '$lib/components/EChart.svelte';
	import MetricCard from '$lib/components/MetricCard.svelte';
	import { APPLICATION_STATUS_LABEL, type TravelApplication } from '$lib/types/application';
	import {
		countByDepartmentMonthlyTrend,
		countBySubmittedDepartment,
		countBySubmittedStatus,
		filterApplicationsByRange,
		type StatisticsRange,
		sumByMonth
	} from '$lib/utils/applicationStatistics';
	import { createCostOption, createDepartmentOption, createDepartmentTrendOption, createStatusOption } from '$lib/utils/statisticsOptions';
	import { getAuthState, hasRole } from '$lib/client/auth';

	let applications = $state<TravelApplication[]>([]);
	let isApprover = $state(false);
	let loading = $state(true);
	let selectedRange = $state<StatisticsRange>('year');
	let submittedApplications = $derived(filterApplicationsByRange(applications, new Date(), selectedRange));
	let statusCounts = $derived(countBySubmittedStatus(submittedApplications));
	let departmentCounts = $derived(countBySubmittedDepartment(submittedApplications));
	let monthlyTrend = $derived(countByDepartmentMonthlyTrend(submittedApplications, new Date(), selectedRange));
	let monthlyCost = $derived(sumByMonth(submittedApplications, new Date(), selectedRange));
	let totalSubmitted = $derived(submittedApplications.length);
	let currentMonth = $derived(monthlyTrend.months.at(-1) ?? '');
	let currentMonthCount = $derived(monthlyTrend.series.reduce((sum, item) => sum + (item.data.at(-1) ?? 0), 0));
	let totalCost = $derived(submittedApplications.reduce((sum, item) => sum + item.estimatedCost, 0));
	let completedCount = $derived(statusCounts.approved + statusCounts.rejected);
	let approvalRate = $derived(completedCount ? Math.round((statusCounts.approved / completedCount) * 100) : 0);

	let statusOption = $derived(createStatusOption(statusCounts));
	let departmentOption = $derived(createDepartmentOption(departmentCounts));
	let trendOption = $derived(createDepartmentTrendOption(monthlyTrend));
	let costOption = $derived(createCostOption(monthlyCost));

	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		const response = await fetch('/api/applications');
		if (response.ok) applications = (await response.json()).data;
		loading = false;
	});
</script>

<svelte:head><title>数据统计 - 差旅管理</title></svelte:head>
<div class="page-heading"><div><h1>数据统计</h1><p>从申请量、审批状态和费用趋势了解各部门出差情况。</p></div><select class="range-select" aria-label="统计时间范围" bind:value={selectedRange}><option value="year">最近一年</option><option value="halfYear">最近半年</option><option value="quarter">最近三月</option><option value="currentYear">今年</option></select></div>
{#if loading}<section class="panel loading">正在加载统计数据…</section>
{:else if !isApprover}<section class="panel denied"><strong>数据统计仅对审批人开放</strong><span>请切换到李经理账号查看差旅统计。</span></section>
{:else}<section class="metric-grid">
	<MetricCard label="已提交申请" value={totalSubmitted} hint="不含草稿" />
	<MetricCard label={`${currentMonth.slice(0, 4)}年${currentMonth.slice(5)}月申请`} value={currentMonthCount} hint="按出发日期统计" />
	<MetricCard label="审批通过率" value={`${approvalRate}%`} hint="仅统计已完成审批" />
	<MetricCard label="总预计费用" value={`¥ ${totalCost.toLocaleString()}`} hint="已提交申请预计费用" />
</section>
<section class="panel insight"><h2>费用概览</h2><div><span>平均预计费用</span><strong>¥ {totalSubmitted ? (totalCost / totalSubmitted).toFixed(2) : '0.00'}</strong></div><div><span>最高单笔费用</span><strong>¥ {totalSubmitted ? Math.max(...submittedApplications.map((item) => item.estimatedCost)).toFixed(2) : '0.00'}</strong></div><div><span>完成审批量</span><strong>{completedCount}</strong></div></section>
<section class="panel trend-card"><div class="card-heading"><div><h2>部门月度出差趋势</h2><p>按出发日期所在月份统计，{selectedRange === 'currentYear' ? '今年' : selectedRange === 'halfYear' ? '最近 6 个月' : selectedRange === 'quarter' ? '最近 3 个月' : '最近 12 个月'}</p></div><span>堆叠申请单量 · 不含草稿</span></div>{#key selectedRange}<EChart option={trendOption} height="350px" ariaLabel="部门月度出差趋势堆叠柱状图" />{/key}</section>
<section class="panel cost-card"><div class="card-heading"><div><h2>月度预计费用</h2><p>按出发月份汇总所选范围内已提交申请的预计费用</p></div><span>人民币</span></div>{#key selectedRange}<EChart option={costOption} height="260px" ariaLabel="月度预计费用柱状图" />{/key}</section>
<section class="stats-grid">
	<div class="panel chart-card"><div class="card-heading"><h2>申请状态分布</h2><span>所选范围 · 已提交申请</span></div>{#key selectedRange}<EChart option={statusOption} height="280px" ariaLabel="申请状态分布环形图" />{/key}</div>
	<div class="panel chart-card"><div class="card-heading"><h2>部门申请单量</h2><span>所选范围 · 已提交申请</span></div>{#key selectedRange}<EChart option={departmentOption} height="280px" ariaLabel="部门申请单量柱状图" />{/key}</div>
</section>
{/if}

<style>
	.metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
	.range-select { min-width: 128px; height: 40px; padding: 0 12px; border: 1px solid #dfe5ee; border-radius: 8px; background: #fff; color: #44516a; outline: none; } .range-select:focus { border-color: #3975f6; box-shadow: 0 0 0 3px #3975f61c; }
	.trend-card, .cost-card { margin-bottom: 18px; padding: 24px; } .cost-card { padding-bottom: 18px; } .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; } .chart-card { min-height: 340px; padding: 24px; } .card-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; } .card-heading h2, .insight h2 { margin: 0; font-size: 17px; } .card-heading p { margin: 7px 0 0; color: #9aa4b5; font-size: 12px; } .card-heading > span { color: #9aa4b5; font-size: 11px; white-space: nowrap; }
	.insight { display: grid; grid-template-columns: 1.2fr repeat(3, 1fr); gap: 18px; align-items: center; margin-bottom: 18px; padding: 22px 24px; } .insight > div { padding-left: 18px; border-left: 1px solid #edf0f5; } .insight span, .insight strong { display: block; } .insight span { color: #8a95a8; font-size: 12px; } .insight strong { margin-top: 8px; color: #34415a; font-size: 19px; }
	.loading, .denied { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #8a95a8; } .denied strong { color: #44516a; font-size: 16px; }
	@media (max-width: 900px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 700px) { .stats-grid { grid-template-columns: 1fr; } .insight { grid-template-columns: 1fr 1fr; } .insight h2 { grid-column: 1 / -1; } } @media (max-width: 430px) { .metric-grid { grid-template-columns: 1fr; } .insight { grid-template-columns: 1fr; } .insight > div { padding: 10px 0 0; border-left: 0; border-top: 1px solid #edf0f5; } }
</style>
