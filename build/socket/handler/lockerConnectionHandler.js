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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lockerAuthResponse = exports.lockerConnectionRequest = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const LockerDB_1 = require("../../api/LockerDB");
const lockerSocket_1 = require("../lockerSocket");
function lockerConnectionRequest(ws, lockerResponse, lockerData) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const rand = crypto_js_1.default.lib.WordArray.random(16).toString();
        const encrypt = crypto_js_1.default.AES.encrypt(rand, (_a = lockerResponse.data) === null || _a === void 0 ? void 0 : _a.secretKey).toString();
        const wsMessage = {
            type: lockerSocket_1.lockerSocketMessageType.CONNECTION_AUTH_INIT,
            data: {
                auth_key: encrypt,
            },
        };
        yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { auth_key: encrypt });
        ws.send(JSON.stringify(wsMessage));
    });
}
exports.lockerConnectionRequest = lockerConnectionRequest;
function lockerAuthResponse(ws, lockerResponse, lockerData) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const decrypt = crypto_js_1.default.AES.decrypt((_a = lockerResponse.data) === null || _a === void 0 ? void 0 : _a.auth_key, lockerData.secretKey).toString(crypto_js_1.default.enc.Utf8);
        if (decrypt === lockerData.auth_key) {
            if (!lockerData.isRegistered) {
            }
            const wsMessage = {
                type: lockerSocket_1.lockerSocketMessageType.CONNECTION_SUCCESS,
            };
            yield (0, LockerDB_1.setLockerData)(lockerData.uuid, { isAwaken: true });
            ws.send(JSON.stringify(wsMessage));
        }
        else {
            const wsMessage = {
                type: lockerSocket_1.lockerSocketMessageType.CONNECTION_FAILED,
            };
            ws.send(JSON.stringify(wsMessage));
        }
    });
}
exports.lockerAuthResponse = lockerAuthResponse;
