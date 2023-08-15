import { getLockerData, LockerData, setLockerData } from './api/LockerDB'
import { WebSocket } from 'ws'
import { Server } from 'http'
import { lockerClient, timeTable } from './index'

export enum lockerSocketMessageType {
    CONNECTION_INIT = 'CONNECTION_INIT',
    CONNECTION_ERROR = 'CONNECTION_ERROR',
    LOCKER_OPEN = 'LOCKER_OPEN',
    LOCKER_CLOSE = 'LOCKER_CLOSE',
    LOCKER_OPEN_SUCCESS = 'LOCKER_OPEN_SUCCESS',
    LOCKER_CLOSE_SUCCESS = 'LOCKER_CLOSE_SUCCESS',
    LOCKER_CLOSE_FAILED = 'LOCKER_CLOSE_FAILED',
    REQ_MOBILE_CLASS = 'REQ_MOBILE_CLASS',
    RES_MOBILE_CLASS = 'RES_MOBILE_CLASS',
    REQ_TIMEPERIOD = 'REQ_TIMEPERIOD',
    RES_TIMEPERIOD = 'RES_TIMEPERIOD',
    REQ_SYNC = 'REQ_SYNC',
    RES_SYNC = 'RES_SYNC',
}
export interface lockerSocketMessage {
    type: lockerSocketMessageType
    data?: { [key: string]: any }
}
export function initSocket(app: Server) {
    const wss = new WebSocket.Server({ server: app })
    wss.on('connection', function connection(ws) {
        ws.on('error', console.error)
        ws.on('open', function open() {
            console.log(1)
        })
        ws.on('close', () => {
            lockerClient.forEach((value, key) => {
                if (value === ws) lockerClient.delete(key)
                return
            })
        })
        ws.on('message', async (data) => {
            let wsMessage: lockerSocketMessage
            try {
                const res = JSON.parse(data.toString()) as lockerSocketMessage
                const uuid = res.data?.uuid
                switch (res.type) {
                    case lockerSocketMessageType.CONNECTION_INIT:
                        if (lockerClient.has(uuid)) {
                            switch (lockerClient.get(uuid)?.readyState) {
                                case WebSocket.OPEN:
                                    lockerClient.get(uuid)?.close()
                                    return
                                case WebSocket.CLOSED || undefined:
                                    lockerClient.set(uuid, ws)
                                    return
                            }
                        }
                        lockerClient.set(uuid, ws)
                        wsMessage = {
                            type: lockerSocketMessageType.REQ_SYNC,
                        }
                        ws.send(JSON.stringify(wsMessage))
                        return
                    case lockerSocketMessageType.LOCKER_OPEN_SUCCESS:
                        await setLockerData(uuid, { isLocked: false })
                        return
                    case lockerSocketMessageType.LOCKER_CLOSE_SUCCESS:
                        await setLockerData(uuid, { isLocked: true })
                        return
                    case lockerSocketMessageType.LOCKER_CLOSE_FAILED:
                        await setLockerData(uuid, { isLocked: false })
                        if (res.data?.attempt <= 2) {
                            wsMessage = {
                                type: lockerSocketMessageType.LOCKER_CLOSE,
                                data: {
                                    attempt: res.data?.attempt + 1 || 1,
                                },
                            }
                            ws.send(JSON.stringify(wsMessage))
                        }
                        return
                    case lockerSocketMessageType.REQ_MOBILE_CLASS || lockerSocketMessageType.REQ_TIMEPERIOD:
                        let { grade, classNumber } = (await getLockerData(uuid)) as LockerData
                        const weekday = new Date().getDay() - 1
                        if (res.type === lockerSocketMessageType.REQ_MOBILE_CLASS) {
                            const timetable = await timeTable.getMobileClass(grade, classNumber, weekday)
                            wsMessage = {
                                type: lockerSocketMessageType.RES_MOBILE_CLASS,
                                data: {
                                    mobileClass: timetable,
                                },
                            }
                            ws.send(JSON.stringify(wsMessage))
                            return
                        } else {
                            const period = await timeTable.getPeriods(res.data?.period)
                            wsMessage = {
                                type: lockerSocketMessageType.RES_TIMEPERIOD,
                                data: {
                                    period: {
                                        period: res.data?.period,
                                        start: period.start,
                                        end: period.end,
                                        duration: period.duration,
                                    },
                                },
                            }
                            ws.send(JSON.stringify(wsMessage))
                            return
                        }
                    case lockerSocketMessageType.RES_SYNC:
                        let now = Date.now()
                        await setLockerData(uuid, { lastSync: now })
                        return
                }
            } catch (error) {
                wsMessage = {
                    type: lockerSocketMessageType.CONNECTION_ERROR,
                }
                ws.send(JSON.stringify(wsMessage))
                console.error(error)
            }
        })
    })
    return wss
}
// 웹 소켓 서버 URL
