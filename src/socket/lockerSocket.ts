import expressWs from 'express-ws'
import { getLockerData, setLockerData } from '../api/LockerDB'
import Crypto from 'crypto-js'

export enum lockerSocketMessageType {
    CONNECTION_INIT = 'CONNECTION_INIT',
    CONNECTION_REQUEST = 'CONNECTION_REQUEST',
    CONNECTION_AUTH_INIT = 'CONNECTION_AUTH_INIT',
    CONNECTION_AUTH_RESPONSE = 'CONNECTION_AUTH_RESPONSE',
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    CONNECTION_SUCCESS = 'CONNECTION_SUCCESS',
    LOCKER_OPEN = 'LOCKER_OPEN',
    LOCKER_CLOSE = 'LOCKER_CLOSE',
    LOCKER_OPEN_SUCCESS = 'LOCKER_OPEN_SUCCESS',
    //LOCKER_OPEN_FAILED = 'LOCKER_OPEN_FAILED',
    LOCKER_CLOSE_SUCCESS = 'LOCKER_CLOSE_SUCCESS',
    LOCKER_CLOSE_FAILED = 'LOCKER_CLOSE_FAILED',
}
export interface lockerSocketMessage {
    type: lockerSocketMessageType
    data?: { [key: string]: any }
}
export default function (app: expressWs.Application) {
    expressWs(app)
    app.ws('/api/lockerSocket', (ws) => {
        ws.on('error', console.error)
        ws.on('open', function open() {
            ws.send('CONNECTION_INIT')
        })
        ws.on('message', async (data) => {
            const res = JSON.parse(data.toString()) as lockerSocketMessage
            let wsMessage: lockerSocketMessage
            try {
                const uuid = res.data?.uuid
                const lockerData = await getLockerData(uuid)
                switch (res.type) {
                    case lockerSocketMessageType.CONNECTION_REQUEST:
                        const rand = Crypto.lib.WordArray.random(16).toString()
                        const encrypt = Crypto.AES.encrypt(rand, res.data?.secretKey).toString()
                        wsMessage = {
                            type: lockerSocketMessageType.CONNECTION_AUTH_INIT,
                            data: {
                                auth_key: encrypt,
                            },
                        }
                        await setLockerData(lockerData.uuid, { auth_key: encrypt })
                        ws.send(JSON.stringify(wsMessage))
                        return
                    case lockerSocketMessageType.CONNECTION_AUTH_RESPONSE:
                        const decrypt = Crypto.AES.decrypt(res.data?.auth_key, lockerData.secretKey).toString(
                            Crypto.enc.Utf8,
                        )
                        if (decrypt === lockerData.auth_key) {
                            if (!lockerData.isRegistered) {
                                await setLockerData(lockerData.uuid, { isRegistered: true, nickname: lockerData.uuid })
                            }
                            wsMessage = {
                                type: lockerSocketMessageType.CONNECTION_SUCCESS,
                            }
                            await setLockerData(lockerData.uuid, { isAwaken: true })
                            ws.send(JSON.stringify(wsMessage))
                        } else {
                            wsMessage = {
                                type: lockerSocketMessageType.CONNECTION_FAILED,
                            }
                            ws.send(JSON.stringify(wsMessage))
                            ws.close()
                        }
                        return
                    case lockerSocketMessageType.LOCKER_OPEN_SUCCESS:
                        await setLockerData(lockerData.uuid, { isLocked: false })
                        return
                    case lockerSocketMessageType.LOCKER_CLOSE_SUCCESS:
                        await setLockerData(lockerData.uuid, { isLocked: true })
                        return
                    case lockerSocketMessageType.LOCKER_CLOSE_FAILED:
                        await setLockerData(lockerData.uuid, { isLocked: false })
                        if (res.data?.attempt <= 2) {
                            wsMessage = {
                                type: lockerSocketMessageType.LOCKER_CLOSE,
                                data: {
                                    attempt: res.data?.attempt + 1 || 1,
                                },
                            }
                            ws.send(JSON.stringify(wsMessage))
                        } else {
                            await setLockerData(lockerData.uuid, { isLocked: false })
                        }
                        return
                }
            } catch (error) {
                wsMessage = {
                    type: lockerSocketMessageType.CONNECTION_FAILED,
                }
                ws.send(JSON.stringify(wsMessage))
            }
        })
    })
}
