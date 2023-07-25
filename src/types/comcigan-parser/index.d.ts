declare module 'comcigan-parser' {
    class Timetable {
        _baseUrl = null
        _url = null
        _initialized = false
        _pageSource = null
        _cache = null
        _cacheAt = null
        _schoolCode = -1
        _weekdayString: Weekday = ['일', '월', '화', '수', '목', '금', '토']
        _option: InitOption = {
            maxGrade: 3,
            cache: 0,
        }
        init(option: InitOption): Promise<any>
        search(keyword: string): Promise<Array<SearchData>>
        setSchool(schoolCode: number): void
        getTimetable(): Promise<TimetableData>
        getClassTime(): Promise<ClassTimeData>
        _getData(): Promise<unknown>
        _getClassTimetable(codeConfig, grade: number, classNumber: number): Promise<WeekdayData>
        _isReady(): void
        _isCacheExpired(): boolean
    }
    export = Timetable
}
interface InitOption {
    maxGrade?: number
    cache?: number
}
interface SearchData {
    _: number
    region: string
    name: string
    code: number
}
interface TimetableData {
    [grade: number]: {
        [classNumber: number]: Array<Array<WeekdayData>>
    }
}
interface WeekdayData {
    grade?: number
    class?: number
    weekday?: number
    weekdayString?: Weekday
    classTime: number
    teacher: string
    subject: string
}
type TimetableByWeekday = Array<Array<WeekdayData>>
interface PeriodData {
    start: {
        hour: number
        minute: number
    }
    end: {
        hour: number
        minute: number
    }
    duration: number
}

type Weekday = ['일', '월', '화', '수', '목', '금', '토']
type ClassTimeData = Array<string>
