<script lang="ts">
	import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from '$lib/types/application';

	let { status }: { status: ApplicationStatus } = $props();
</script>

<span class={`status status-${status}`}>{APPLICATION_STATUS_LABEL[status]}</span>

<style>
	.status {
		display: inline-flex;
		padding: 5px 9px;
		border-radius: 999px;
		font-size: 11px;
		font-style: normal;
		font-weight: 650;
	}
	.status-draft {
		color: #667085;
		background: #f0f2f5;
	}
	.status-pending {
		color: #946b16;
		background: #fff5d8;
	}
	.status-approved {
		color: #237a52;
		background: #e8f8ef;
	}
	.status-rejected {
		color: #b54855;
		background: #ffedf0;
	}
</style>
