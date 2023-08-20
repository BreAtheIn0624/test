import Timetable = require('comcigan-parser')
import config from 'config'
export default class extends Timetable {
    _classDuration: Array<number> = [45, 50]
    _schoolName: string
    _mobileClass: Set<string>
    constructor() {
        super()
        this._initialized = false
        this._schoolName = config.get('school.name')
        this._mobileClass = new Set(config.get('mobileClass'))
    }
    async getClassTimetable(grade: number, classNumber: number, weekDay: Array<number>): Promise<TimetableByWeekday> {
        if (!this._initialized) await this._reset()
        const timetable = await super.getTimetable()
        const weekDaySet = new Set(weekDay)
        const timetableByWeekday: TimetableByWeekday = []
        timetable[grade][classNumber].forEach((data: Array<WeekdayData>, index) => {
            if (!weekDaySet.has(index)) return
            timetableByWeekday.push(
                data.map((item: WeekdayData) => {
                    return {
                        classTime: item.classTime,
                        teacher: item.teacher,
                        subject: item.subject,
                    }
                }),
            )
        })
        return timetableByWeekday
    }
    async getPeriods(periods: number): Promise<PeriodData> {
        if (!this._initialized) await this._reset()
        const period = (await super.getClassTime())[periods - 1]
        const [hours, minutes] = period.split(/(\(|\))/)[2].split(':')
        const duration = this._schoolName.search('고등학교') === -1 ? this._classDuration[0] : this._classDuration[1]
        const startTime = new Date()
        startTime.setHours(Number(hours))
        startTime.setMinutes(Number(minutes))
        startTime.setSeconds(0)
        startTime.setMilliseconds(0)
        const endTime = Date.parse(startTime.toString()) + duration * 60 * 1000
        return {
            start: startTime.getTime(),
            end: endTime,
            duration,
        }
    }
    async getMobileClass(grade: number, classNumber: number, weekDay: number) {
        const [timetable] = await this.getClassTimetable(grade, classNumber, [weekDay])
        if (timetable === undefined) return []
        return timetable.filter((item: WeekdayData) => {
            if (this.isMobileClass(item.subject)) return true
        })
    }
    isMobileClass(subject: string) {
        return this._mobileClass.has(subject)
    }
    async _reset() {
        const option: InitOption = {
            maxGrade: (config.get('school.highestGrade') as number) || 3,
        }
        await this.init(option)
        this.setSchool(config.get('school.code'))
        this._initialized = true
    }
}
