import express from 'express'
import { createServer } from 'http'
import { initSocket, lockerSocketMessage, lockerSocketMessageType } from './lockerSocket'
import { WebSocket } from 'ws'
import { getLockerData, LockerData, lockerDataProperties, scanLockerData, setLockerData } from './api/LockerDB'
import morgan from 'morgan'
import Timetable from './api/ClassTimetable'
import cors from 'cors'

const app = express()
const server = createServer(app)
const wss = initSocket(server)
const lockerClient = new Map<string, WebSocket>()
const timeTable = new Timetable(3600000)

app.use(morgan('dev'))
app.use(express.json())
app.use(cors())

app.use('/api/:resource/:uuid', async (req, res, next) => {
    console.time('vaildation')
    const uuid = req.params.uuid
    const locker = await getLockerData(uuid)
    if (locker && Object.keys(locker).every((key) => lockerDataProperties.includes(key))) {
        next()
        console.timeEnd('vaildation')
        return
    }
    res.status(400).json({ error: 'invalid locker' })
    res.end()
    console.timeEnd('vaildation')
})

app.get('/api/lockerState', async (req, res) => {
    const states = await scanLockerData()
    res.json(states)
    res.end()
})
app.get('/api/lockerState/:uuid', async (req, res) => {
    const uuid = req.params.uuid
    const state = await getLockerData(uuid)
    res.json(state)
    res.end()
})

app.put('/api/orderLocker/:uuid', async (req, res) => {
    const uuid = req.params.uuid
    const task = req.body.task
    const locker = (await getLockerData(uuid)) as LockerData
    const ws = lockerClient.get(uuid)
    if (!ws) {
        res.status(400).json({ error: 'locker not found' })
        res.end()
        return
    }
    let response: lockerSocketMessage
    switch (task) {
        case 'open':
            if (locker.isLocked) {
                response = {
                    type: lockerSocketMessageType.LOCKER_OPEN,
                }
                ws.send(JSON.stringify(response))
                res.status(200).json({ message: 'ordered success' })
                res.end()
            } else {
                res.status(400).json({ error: 'locker is already open' })
                res.end()
            }
            return
        case 'close':
            if (!locker.isLocked) {
                response = {
                    type: lockerSocketMessageType.LOCKER_CLOSE,
                }
                ws.send(JSON.stringify(response))
                res.status(200).json({ message: 'ordered success' })
                res.end()
            } else {
                res.status(400).json({ error: 'locker is already closed' })
                res.end()
                return
            }
            return
        case 'onSchedule':
            response = {
                type: lockerSocketMessageType.LOCKER_ON_SCHEDULE,
            }
            ws.send(JSON.stringify(response))
            response = {
                type: lockerSocketMessageType.REQ_SYNC,
            }
            ws.send(JSON.stringify(response))
            await setLockerData(uuid, { onSchedule: true })
            res.status(200).json({ message: 'ordered success' })
            res.end()
            return
        case 'offSchedule':
            response = {
                type: lockerSocketMessageType.LOCKER_OFF_SCHEDULE,
            }
            ws.send(JSON.stringify(response))
            await setLockerData(uuid, { onSchedule: false })
            res.status(200).json({ message: 'ordered success' })
            res.end()
            return
        case 'sync':
            response = {
                type: lockerSocketMessageType.REQ_SYNC,
            }
            ws.send(JSON.stringify(response))
            res.status(200).json({ message: 'ordered success' })
            res.end()
            return
    }
})
app.get('/api/timetable/:uuid', async (req, res) => {
    const locker = (await getLockerData(req.params.uuid)) as LockerData
    const grade = Number(locker.grade)
    const classNumber = Number(locker.classNumber)
    const timetable = await timeTable.getClassTimetable(grade, classNumber, [0, 1, 2, 3, 4])
    res.json(
        timetable.map((item) =>
            item.map((item) => {
                return {
                    isMobile: timeTable.isMobileClass(item.subject),
                    teacher: item.teacher,
                    subject: item.subject,
                }
            }),
        ),
    )
    res.end()
})
const modifiableProperties = ['nickname', 'grade', 'classNumber']
app.patch('/api/lockerState/:uuid', async (req, res) => {
    const uuid = req.params.uuid
    const data = req.body
    //remove data properties that are not in modifiableProperties
    for (const key in data) {
        if (!modifiableProperties.includes(key)) {
            delete data[key]
        }
    }
    try {
        await setLockerData(uuid, data)
        res.status(200)
        res.end()
    } catch (error: Error | any) {
        res.status(500).json({ error: error.message })
        res.end()
    }
})

server.listen(80)

export { app, wss as lockerWss, lockerClient, timeTable }
