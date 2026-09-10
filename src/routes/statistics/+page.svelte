<script lang="ts">
	import { onMount } from 'svelte';
	import { APPLICATION_STATUS_LABEL, type TravelApplication } from '$lib/types/application';
	import { countByDepartment, countByStatus } from '$lib/utils/applicationStatistics';

	let applications = $state<TravelApplication[]>([]);
	let statusCounts = $derived(countByStatus(applications));
	let departmentCounts = $derived(countByDepartment(applications));
	let maxDepartment = $derived(Math.max(1, ...Object.values(departmentCounts)));
	let isApprover = $state(false);
	let loading = $state(true);
	onMount(async () => {
		const auth = await fetch('/api/auth');
		if (auth.ok) isApprover = (await auth.json()).data?.roles?.includes('approver') ?? false;
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
	<div class="panel chart-card"><div class="card-heading"><h2>申请状态分布</h2><span>全部申请</span></div><div class="donut"><div class="donut-center"><strong>{applications.length}</strong><small>总申请</small></div></div><div class="legend">{#each Object.entries(APPLICATION_STATUS_LABEL) as [key, label]}<span><i class={`dot dot-${key}`}></i>{label}<b>{statusCounts[key as keyof typeof statusCounts]}</b></span>{/each}</div></div>
	<div class="panel chart-card"><div class="card-heading"><h2>部门申请量</h2><span>按申请数量</span></div><div class="bars">{#each Object.entries(departmentCounts) as [department, count]}<div class="bar-row"><span>{department}</span><div class="bar-track"><i style={`width: ${(count / maxDepartment) * 100}%`}></i></div><b>{count}</b></div>{/each}{#if Object.keys(departmentCounts).length === 0}<p class="empty">暂无数据</p>{/if}</div></div>
</section>
<section class="panel insight"><h2>数据概览</h2><div><span>平均预计费用</span><strong>¥ {applications.length ? (applications.reduce((sum, item) => sum + item.estimatedCost, 0) / applications.length).toFixed(2) : '0.00'}</strong></div><div><span>最高单笔费用</span><strong>¥ {applications.length ? Math.max(...applications.map((item) => item.estimatedCost)).toFixed(2) : '0.00'}</strong></div><div><span>审批通过率</span><strong>{applications.length ? Math.round((statusCounts.approved / applications.length) * 100) : 0}%</strong></div></section>{/if}

<style>
	.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; } .chart-card { min-height: 320px; padding: 24px; } .card-heading { display: flex; justify-content: space-between; align-items: center; } .card-heading h2, .insight h2 { margin: 0; font-size: 17px; } .card-heading span { color: #9aa4b5; font-size: 11px; }
	.donut { width: 150px; height: 150px; margin: 25px auto 18px; display: grid; place-items: center; border-radius: 50%; background: conic-gradient(#3975f6 0 25%, #e6b83f 25% 50%, #36ae73 50% 75%, #d65b68 75% 100%); position: relative; } .donut::before { content: ''; position: absolute; width: 94px; height: 94px; border-radius: 50%; background: white; } .donut-center { z-index: 1; display: grid; justify-items: center; } .donut-center strong { font-size: 25px; color: #34415a; } .donut-center small { color: #9aa4b5; font-size: 11px; }
	.legend { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; } .legend span { display: flex; align-items: center; gap: 7px; color: #68758b; font-size: 12px; } .legend b { margin-left: auto; color: #34415a; } .dot { width: 8px; height: 8px; border-radius: 50%; } .dot-draft { background: #9aa4b5; } .dot-pending { background: #e6b83f; } .dot-approved { background: #36ae73; } .dot-rejected { background: #d65b68; }
	.bars { display: grid; gap: 20px; margin-top: 32px; } .bar-row { display: grid; grid-template-columns: 70px 1fr 24px; align-items: center; gap: 10px; color: #68758b; font-size: 12px; } .bar-row b { color: #34415a; text-align: right; } .bar-track { height: 10px; overflow: hidden; border-radius: 99px; background: #edf1f7; } .bar-track i { display: block; height: 100%; border-radius: inherit; background: #3975f6; } .empty { color: #9aa4b5; text-align: center; }
	.insight { display: grid; grid-template-columns: 1.2fr repeat(3, 1fr); gap: 18px; align-items: center; padding: 22px 24px; } .insight > div { padding-left: 18px; border-left: 1px solid #edf0f5; } .insight span, .insight strong { display: block; } .insight span { color: #8a95a8; font-size: 12px; } .insight strong { margin-top: 8px; color: #34415a; font-size: 19px; }
	.loading, .denied { min-height: 220px; display: grid; place-content: center; justify-items: center; gap: 8px; color: #8a95a8; } .denied strong { color: #44516a; font-size: 16px; }
	@media (max-width: 700px) { .stats-grid { grid-template-columns: 1fr; } .insight { grid-template-columns: 1fr 1fr; } .insight h2 { grid-column: 1 / -1; } } @media (max-width: 430px) { .insight { grid-template-columns: 1fr; } .insight > div { padding: 10px 0 0; border-left: 0; border-top: 1px solid #edf0f5; } }
</style>
