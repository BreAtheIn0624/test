// @ts-ignorenn
import Timetable = require('comcigan-parser')
import config from 'config'
export default class extends Timetable {
    classDuration = [45, 50]
    _schoolName: string = ''
    constructor() {
        super()
        this._initialized = false
        this._schoolName = config.get('school.name')
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
        const endTime = new Date()
        const duration = this._schoolName.search('고등학교') === -1 ? this.classDuration[0] : this.classDuration[1]
        endTime.setHours(Number(hours))
        endTime.setMinutes(Number(minutes) + duration)
        return {
            start: {
                hour: Number(hours),
                minute: Number(minutes),
            },
            end: {
                hour: endTime.getHours(),
                minute: endTime.getMinutes(),
            },
            duration,
        }
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
