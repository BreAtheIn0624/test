import Timetable = require('comcigan-parser');
export default class extends Timetable {
    classDuration: number[];
    _schoolName: string;
    constructor();
    getClassTimetable(grade: number, classNumber: number, weekDay: Array<number>): Promise<TimetableByWeekday>;
    getPeriods(periods: number): Promise<PeriodData>;
    _reset(): Promise<void>;
}
