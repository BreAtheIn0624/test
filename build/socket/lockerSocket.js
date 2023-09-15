"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.lockerSocketMessageType = void 0;
const LockerDB_1 = require("../api/LockerDB");
const ws_1 = require("ws");
var lockerSocketMessageType;
(function (lockerSocketMessageType) {
    lockerSocketMessageType["CONNECTION_INIT"] = "CONNECTION_INIT";
    lockerSocketMessageType["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    lockerSocketMessageType["LOCKER_OPEN"] = "LOCKER_OPEN";
    lockerSocketMessageType["LOCKER_CLOSE"] = "LOCKER_CLOSE";
    lockerSocketMessageType["LOCKER_OPEN_SUCCESS"] = "LOCKER_OPEN_SUCCESS";
    lockerSocketMessageType["LOCKER_CLOSE_SUCCESS"] = "LOCKER_CLOSE_SUCCESS";
    lockerSocketMessageType["LOCKER_CLOSE_FAILED"] = "LOCKER_CLOSE_FAILED";
})(lockerSocketMessageType || (exports.lockerSocketMessageType = lockerSocketMessageType = {}));
function initSocket(app) {
    const wss = new ws_1.WebSocket.Server({ server: app });
    wss.on('connection', function connection(ws) {
        ws.on('error', console.error);
        ws.on('open', function open() { });
        ws.on('message', (data) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const res = JSON.parse(data.toString());
            let wsMessage;
            try {
                const uuid = (_a = res.data) === null || _a === void 0 ? void 0 : _a.uuid;
                const lockerData = yield (0, LockerDB_1.getLockerData)(uuid);
                switch (res.type) {
                    case lockerSocketMessageType.LOCKER_OPEN_SUCCESS:
                        yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { isLocked: false });
                        return;
                    case lockerSocketMessageType.LOCKER_CLOSE_SUCCESS:
                        yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { isLocked: true });
                        return;
                    case lockerSocketMessageType.LOCKER_CLOSE_FAILED:
                        yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { isLocked: false });
                        if (((_b = res.data) === null || _b === void 0 ? void 0 : _b.attempt) <= 2) {
                            wsMessage = {
                                type: lockerSocketMessageType.LOCKER_CLOSE,
                                data: {
                                    attempt: ((_c = res.data) === null || _c === void 0 ? void 0 : _c.attempt) + 1 || 1,
                                },
                            };
                            ws.send(JSON.stringify(wsMessage));
                        }
                        else {
                            yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { isLocked: false });
                        }
                        return;
                }
            }
            catch (error) {
                wsMessage = {
                    type: lockerSocketMessageType.CONNECTION_ERROR,
                };
                ws.send(JSON.stringify(wsMessage));
                console.error(error);
            }
        }));
    });
    return wss;
}
exports.initSocket = initSocket;
// 웹 소켓 서버 URL
