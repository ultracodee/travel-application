<script lang="ts">
	import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from '$lib/types/application';

	let { status }: { status: ApplicationStatus } = $props();
</script>

<span
	class={`status-${status} inline-flex rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${
		status === 'draft'
			? 'bg-[#f0f2f5] text-[#667085]'
			: status === 'pending'
				? 'bg-[#fff5d8] text-[#946b16]'
				: status === 'approved'
					? 'bg-[#e8f8ef] text-[#237a52]'
					: 'bg-[#ffedf0] text-[#b54855]'
	}`}>{APPLICATION_STATUS_LABEL[status]}</span
>
