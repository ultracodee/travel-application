import type { EChartsOption } from 'echarts';
import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from '$lib/types/application';
import type { DepartmentMonthlyTrend, MonthlyTrend } from './applicationStatistics';

const statusColors: Record<Exclude<ApplicationStatus, 'draft'>, string> = {
	pending: '#e6b83f',
	approved: '#36ae73',
	rejected: '#d65b68'
};
const departmentColors = ['#3975f6', '#e6b83f', '#36ae73'];

export function createStatusOption(counts: Record<Exclude<ApplicationStatus, 'draft'>, number>): EChartsOption {
	return {
		tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
		legend: { bottom: 0, icon: 'circle', textStyle: { color: '#68758b', fontSize: 12 } },
		series: [
			{
				type: 'pie',
				radius: ['48%', '72%'],
				center: ['50%', '44%'],
				itemStyle: { borderColor: '#fff', borderWidth: 3 },
				label: { show: false },
				data: (Object.keys(statusColors) as Array<Exclude<ApplicationStatus, 'draft'>>).map((status) => ({
					name: APPLICATION_STATUS_LABEL[status],
					value: counts[status],
					itemStyle: { color: statusColors[status] }
				}))
			}
		]
	};
}

export function createDepartmentOption(counts: Record<string, number>): EChartsOption {
	return {
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		grid: { left: 12, right: 24, top: 16, bottom: 16, containLabel: true },
		xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#edf1f7' } } },
		yAxis: {
			type: 'category',
			data: Object.keys(counts),
			axisLine: { show: false },
			axisTick: { show: false },
			axisLabel: { color: '#68758b' }
		},
		series: [
			{
				type: 'bar',
				data: Object.values(counts),
				barMaxWidth: 22,
				itemStyle: { color: '#3975f6', borderRadius: [0, 6, 6, 0] },
				label: { show: true, position: 'right', color: '#34415a' }
			}
		]
	};
}

export function createDepartmentTrendOption(trend: {
	months: string[];
	series: DepartmentMonthlyTrend[];
}): EChartsOption {
	return {
		tooltip: { trigger: 'axis' },
		legend: { top: 0, right: 0, icon: 'circle', textStyle: { color: '#68758b', fontSize: 12 } },
		grid: { left: 12, right: 20, top: 38, bottom: 16, containLabel: true },
		xAxis: {
			type: 'category',
			data: trend.months,
			axisLabel: { color: '#68758b', formatter: (value: string) => value.slice(2) }
		},
		yAxis: {
			type: 'value',
			minInterval: 1,
			splitLine: { lineStyle: { color: '#edf1f7' } },
			axisLabel: { color: '#68758b' }
		},
		series: trend.series.map((item, index) => ({
			name: item.department,
			type: 'bar',
			stack: 'total',
			barMaxWidth: 34,
			data: item.data,
			itemStyle: {
				color: departmentColors[index % departmentColors.length],
				borderRadius: index === trend.series.length - 1 ? [5, 5, 0, 0] : 0
			}
		}))
	};
}

export function createCostOption(cost: MonthlyTrend): EChartsOption {
	return {
		tooltip: { trigger: 'axis', valueFormatter: (value) => `¥ ${Number(value).toLocaleString()}` },
		grid: { left: 12, right: 20, top: 16, bottom: 16, containLabel: true },
		xAxis: {
			type: 'category',
			data: cost.months,
			axisLabel: { color: '#68758b', formatter: (value: string) => value.slice(2) }
		},
		yAxis: {
			type: 'value',
			axisLabel: { color: '#68758b', formatter: (value: number) => `¥${Math.round(value / 1000)}k` },
			splitLine: { lineStyle: { color: '#edf1f7' } }
		},
		series: [
			{ type: 'bar', data: cost.data, barMaxWidth: 24, itemStyle: { color: '#8b7cf6', borderRadius: [6, 6, 0, 0] } }
		]
	};
}
