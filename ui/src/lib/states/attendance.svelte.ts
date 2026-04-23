import { pb } from '$lib/pocketbase';
import { branchesState } from './branches.svelte';

export interface AttendanceRecord {
	id: string;
	user: string;
	clock_in: string;
	clock_out: string;
	branch: string;
	notes: string;
	created: string;
	updated: string;
	expand?: {
		user?: { id: string; name: string; email: string; avatar: string; role: string };
		branch?: { id: string; name: string };
	};
}

class AttendanceState {
	todayRecords = $state<AttendanceRecord[]>([]);
	userHistory = $state<AttendanceRecord[]>([]);
	loading = $state(false);

	constructor() {
		if (typeof window !== 'undefined') {
			pb.collection('attendance').subscribe('*', () => {
				this.fetchToday();
			}).catch(err => console.error('Attendance subscription error:', err));
		}
	}

	async fetchToday() {
		const branchId = branchesState.selectedBranchId;
		const now = new Date();
		const startOfDay = new Date(now);
		startOfDay.setHours(0, 0, 0, 0);
		let filter = `clock_in >= '${startOfDay.toISOString().replace('T', ' ').split('.')[0]}'`;
		if (branchId) filter += ` && branch = '${branchId}'`;

		const records = await pb.collection('attendance').getFullList<AttendanceRecord>({
			filter,
			expand: 'user,branch',
			sort: '-clock_in',
			requestKey: 'attendance-today'
		});
		this.todayRecords = records;
	}

	async fetchUserHistory(userId: string) {
		const records = await pb.collection('attendance').getFullList<AttendanceRecord>({
			filter: `user = '${userId}'`,
			expand: 'branch',
			sort: '-clock_in',
			requestKey: `attendance-history-${userId}`
		});
		this.userHistory = records;
	}

	async clockIn(userId: string, branchId?: string) {
		const activeBranchId = branchId || branchesState.selectedBranchId;
		const now = new Date().toISOString().replace('T', ' ').split('.')[0];
		const data: Record<string, any> = { user: userId, clock_in: now };
		if (activeBranchId) data.branch = activeBranchId;
		const record = await pb.collection('attendance').create<AttendanceRecord>(data, {
			expand: 'user,branch'
		});
		this.todayRecords = [record, ...this.todayRecords];
		return record;
	}

	async clockOut(recordId: string) {
		const now = new Date().toISOString().replace('T', ' ').split('.')[0];
		const record = await pb.collection('attendance').update<AttendanceRecord>(
			recordId,
			{ clock_out: now },
			{ expand: 'user,branch' }
		);
		this.todayRecords = this.todayRecords.map((r) => (r.id === recordId ? record : r));
		return record;
	}

	getTodayRecordForUser(userId: string): AttendanceRecord | undefined {
		return this.todayRecords.find((r) => r.user === userId && !r.clock_out);
	}

	hasClockedInToday(userId: string): boolean {
		return this.todayRecords.some((r) => r.user === userId);
	}

	isClockedIn(userId: string): boolean {
		return this.todayRecords.some((r) => r.user === userId && !r.clock_out);
	}
}

export const attendanceState = new AttendanceState();

// Reactive auto-reload for Attendance when branch switches
$effect.root(() => {
	$effect(() => {
		attendanceState.fetchToday();
	});
});

export function formatDuration(clockIn: string, clockOut?: string): string {
	const start = new Date(clockIn);
	const end = clockOut ? new Date(clockOut) : new Date();
	const diffMs = end.getTime() - start.getTime();
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
	if (hours === 0) return `${minutes}m`;
	return `${hours}h ${minutes}m`;
}

export function formatTime(dateStr: string): string {
	return new Date(dateStr).toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}
