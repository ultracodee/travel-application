<script lang="ts">
	import { onMount } from 'svelte';
	import type { EChartsOption } from 'echarts';
	import EChart from '$lib/components/EChart.svelte';
	import { APPLICATION_STATUS_LABEL, type TravelApplication } from '$lib/types/application';
	import {
		countByDepartmentMonthlyTrend,
		countBySubmittedDepartment,
		countBySubmittedStatus,
		getSubmittedApplications
	} from '$lib/utils/applicationStatistics';
	import { getAuthState, hasRole } from '$lib/client/auth';

	const statusColors = { pending: '#e6b83f', approved: '#36ae73', rejected: '#d65b68' } as const;
	const lineColors = ['#3975f6', '#e6b83f', '#36ae73'];

	let applications = $state<TravelApplication[]>([]);
	let isApprover = $state(false);
	let loading = $state(true);
	let submittedApplications = $derived(getSubmittedApplications(applications));
	let statusCounts = $derived(countBySubmittedStatus(applications));
	let departmentCounts = $derived(countBySubmittedDepartment(applications));
	let monthlyTrend = $derived(countByDepartmentMonthlyTrend(applications));
	let totalSubmitted = $derived(submittedApplications.length);
	let averageCost = $derived(totalSubmitted ? (submittedApplications.reduce((sum, item) => sum + item.estimatedCost, 0) / totalSubmitted).toFixed(2) : '0.00');
	let highestCost = $derived(totalSubmitted ? Math.max(...submittedApplications.map((item) => item.estimatedCost)).toFixed(2) : '0.00');
	let approvalRate = $derived(totalSubmitted ? Math.round((statusCounts.approved / totalSubmitted) * 100) : 0);

	let statusOption = $derived<EChartsOption>({
		tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
		legend: { bottom: 0, icon: 'circle', textStyle: { color: '#68758b', fontSize: 12 } },
		series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '45%'], itemStyle: { borderColor: '#fff', borderWidth: 3 }, label: { show: false }, data: (Object.keys(statusColors) as Array<keyof typeof statusColors>).map((status) => ({ name: APPLICATION_STATUS_LABEL[status], value: statusCounts[status], itemStyle: { color: statusColors[status] } })) }]
	});

	let departmentOption = $derived<EChartsOption>({
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		grid: { left: 12, right: 24, top: 16, bottom: 16, containLabel: true },
		xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#edf1f7' } } },
		yAxis: { type: 'category', data: Object.keys(departmentCounts), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#68758b' } },
		series: [{ type: 'bar', data: Object.values(departmentCounts), barMaxWidth: 22, itemStyle: { color: '#3975f6', borderRadius: [0, 6, 6, 0] }, label: { show: true, position: 'right', color: '#34415a' } }]
	});

	let trendOption = $derived<EChartsOption>({
		tooltip: { trigger: 'axis' },
		legend: { top: 0, right: 0, icon: 'circle', textStyle: { color: '#68758b', fontSize: 12 } },
		grid: { left: 12, right: 20, top: 38, bottom: 16, containLabel: true },
		xAxis: { type: 'category', boundaryGap: false, data: monthlyTrend.months, axisLabel: { color: '#68758b', formatter: (value: string) => value.slice(2) } },
		yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#edf1f7' } }, axisLabel: { color: '#68758b' } },
		series: monthlyTrend.series.map((item, index) => ({ name: item.department, type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, data: item.data, lineStyle: { width: 3, color: lineColors[index % lineColors.length] }, itemStyle: { color: lineColors[index % lineColors.length] }, areaStyle: { opacity: 0.06 } }))
	});

	onMount(async () => {
		const auth = await getAuthState();
		isApprover = hasRole(auth.data, 'approver');
		const response = await fetch('/api/applications');
		if (response.ok) applications = (await response.json()).data;
		loading = false;
	});
</script>

<svelte:head><title>数据统计 - 差旅管理</title></svelte:head>
<div class="page-heading"><div><h1>数据统计</h1><p>从状态、部门和时间维度分析差旅申请。</p></div></div>
{#if loading}<section class="panel loading">正在加载统计数据…</section>
{:else if !isApprover}<section class="panel denied"><strong>数据统计仅对审批人开放</strong><span>请切换到李经理账号查看差旅统计。</span></section>
{:else}<section class="stats-grid">
	<div class="panel chart-card"><div class="card-heading"><h2>申请状态分布</h2><span>已提交申请</span></div><div class="chart-wrap"><EChart option={statusOption} height="280px" ariaLabel="申请状态分布环形图" />{#if totalSubmitted === 0}<span class="chart-empty">暂无已提交申请</span>{/if}</div></div>
	<div class="panel chart-card"><div class="card-heading"><h2>部门申请量</h2><span>已提交申请</span></div><div class="chart-wrap"><EChart option={departmentOption} height="280px" ariaLabel="部门申请量柱状图" />{#if totalSubmitted === 0}<span class="chart-empty">暂无已提交申请</span>{/if}</div></div>
</section>
<section class="panel trend-card"><div class="card-heading"><div><h2>部门月度出差趋势</h2><p>按出发日期所在月份统计，最近 12 个月</p></div><span>不含草稿</span></div><div class="chart-wrap"><EChart option={trendOption} height="340px" ariaLabel="部门月度出差趋势折线图" />{#if totalSubmitted === 0}<span class="chart-empty">暂无已提交申请</span>{/if}</div></section>
<section class="panel insight"><h2>数据概览</h2><div><span>平均预计费用</span><strong>¥ {averageCost}</strong></div><div><span>最高单笔费用</span><strong>¥ {highestCost}</strong></div><div><span>审批通过率</span><strong>{approvalRate}%</strong></div></section>{/if}

<style>
	.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; } .chart-card { min-height: 340px; padding: 24px; } .trend-card { margin-bottom: 18px; padding: 24px; } .card-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; } .card-heading h2, .insight h2 { margin: 0; font-size: 17px; } .card-heading p { margin: 7px 0 0; color: #9aa4b5; font-size: 12px; } .card-heading > span { color: #9aa4b5; font-size: 11px; white-space: nowrap; }
	.chart-wrap { position: relative; } .chart-empty { position: absolute; inset: 0; display: grid; place-items: center; color: #9aa4b5; font-size: 12px; pointer-events: none; }
	.insight { display: grid; grid-template-columns: 1.2fr repeat(3, 1fr); gap: 18px; align-items: center; padding: 22px 24px; } .insight > div { padding-left: 18px; border-left: 1px solid #edf0f5; } .insight span, .insight strong { display: block; } .insight span { color: #8a95a8; font-size: 12px; } .insight strong { margin-top: 8px; color: #34415a; font-size: 19px; }
	.loading, .denied { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #8a95a8; } .denied strong { color: #44516a; font-size: 16px; }
	@media (max-width: 700px) { .stats-grid { grid-template-columns: 1fr; } .insight { grid-template-columns: 1fr 1fr; } .insight h2 { grid-column: 1 / -1; } } @media (max-width: 430px) { .insight { grid-template-columns: 1fr; } .insight > div { padding: 10px 0 0; border-left: 0; border-top: 1px solid #edf0f5; } }
</style>
