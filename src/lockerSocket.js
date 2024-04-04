'use strict'
var __awaiter =
    (this && this.__awaiter) ||
    function (thisArg, _arguments, P, generator) {
        function adopt(value) {
            return value instanceof P
                ? value
                : new P(function (resolve) {
                      resolve(value)
                  })
        }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value))
                } catch (e) {
                    reject(e)
                }
            }
            function rejected(value) {
                try {
                    step(generator['throw'](value))
                } catch (e) {
                    reject(e)
                }
            }
            function step(result) {
                result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected)
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next())
        })
    }
Object.defineProperty(exports, '__esModule', { value: true })
exports.lockerSocketMessageType = void 0
const ws_1 = require('ws')
const LockerDB_1 = require('./api/LockerDB')
const lockerConnectionHandler_1 = require('./handler/lockerConnectionHandler')
const wss = new ws_1.WebSocketServer({ port: 8080 })
var lockerSocketMessageType
;(function (lockerSocketMessageType) {
    lockerSocketMessageType['CONNECTION_INIT'] = 'CONNECTION_INIT'
    lockerSocketMessageType['CONNECTION_REQUEST'] = 'CONNECTION_REQUEST'
    lockerSocketMessageType['CONNECTION_AUTH_INIT'] = 'CONNECTION_AUTH_INIT'
    lockerSocketMessageType['CONNECTION_AUTH_RESPONSE'] = 'CONNECTION_AUTH_RESPONSE'
    lockerSocketMessageType['CONNECTION_FAILED'] = 'CONNECTION_FAILED'
    lockerSocketMessageType['CONNECTION_SUCCESS'] = 'CONNECTION_SUCCESS'
    lockerSocketMessageType['LOCKER_OPEN'] = 'LOCKER_OPEN'
    lockerSocketMessageType['LOCKER_CLOSE'] = 'LOCKER_CLOSE'
})(lockerSocketMessageType || (exports.lockerSocketMessageType = lockerSocketMessageType = {}))
wss.on('connection', (ws) => {
    ws.on('error', console.error)
    ws.on('open', function open() {
        ws.send('CONNECTION_INIT')
    })
    ws.on('message', (data) =>
        __awaiter(void 0, void 0, void 0, function* () {
            var _a
            const res = JSON.parse(data.toString())
            let wsMessage
            try {
                switch (res.type) {
                    case lockerSocketMessageType.CONNECTION_REQUEST:
                        const uuid = (_a = res.data) === null || _a === void 0 ? void 0 : _a.uuid
                        const lockerData = yield (0, LockerDB_1.getLockerData)(uuid)
                        yield (0, lockerConnectionHandler_1.lockerConnectionRequest)(ws, res, lockerData)
                    /*if (lockerData.isRegistered) {
                        await setLockerData(uuid, { isAwaken: true })
                         wsMessage = {
                            type: lockerSocketMessageType.CONNECTION_SUCCESS,
                        }
                        ws.send(JSON.stringify(wsMessage))
                        return
                    } else {

                    }*/
                    //case lockerSocketMessageType.CONNECTION_AUTH_RESPONSE:
                }
            } catch (error) {
                wsMessage = {
                    type: lockerSocketMessageType.CONNECTION_FAILED,
                }
                ws.send(JSON.stringify(wsMessage))
            }
        }),
    )
})
