import type { User } from './user';


export interface UserStat {
    user: User;
    present: number;
    excused: number;
    unexcused: number;
    total: number;
    presentRate: number;
}

export interface RegisterStat {
    name: string;
    averageAttendance: number;
}

export interface PieChartData {
    name: string; // 'Anwesend', 'Entschuldigt', 'Unentschuldigt'
    value: number;
}

export interface AttendanceSummaryResponse {
    period: {
        start: string;
        end: string;
    };
    userStats: UserStat[];
    pieChartData: PieChartData[];
    registerStats: RegisterStat[];
}
