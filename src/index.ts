import express from 'express'
import { createServer } from 'http'
import { initSocket, lockerSocketMessageType } from './lockerSocket'
import { WebSocket } from 'ws'
import { getLockerData, LockerData, lockerDataProperties, scanLockerData } from './api/LockerDB'
import morgan from 'morgan'

const app = express()
const server = createServer(app)
const wss = initSocket(server)
const lockerClient = new Map<string, WebSocket>()

app.use(morgan('dev'))
app.use(express.json())
app.use((req, res, next) => {
    console.log(lockerClient.keys())
    next()
})
app.use('/api/:resource/:uuid', async (req, res, next) => {
    const uuid = req.params.uuid
    const locker = await getLockerData(uuid)
    //detect 'locker' has only and every property of LockerData using lockerDataProperties
    if (locker && Object.keys(locker).every((key) => lockerDataProperties.includes(key))) {
        next()
        return
    }
    res.status(400).json({ error: 'invalid locker' })
    res.end()
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
    switch (task) {
        case 'open':
            if (locker.isLocked) {
                const response = {
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
                const response = {
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
    }
})

server.listen(80)

export { wss as lockerWss, lockerClient }
