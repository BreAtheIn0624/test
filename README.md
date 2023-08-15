'CONNECTION_INIT': 클라이언트가 웹 소켓 서버에 연결을 요청할 때 사용하는 메시지
ex)
{
'type': 'CONNECTION_INIT',
'data': {
'uuid': 'uuid'
}
}
ss
'CONNECTION_ERROR': 클라이언트와 웹 소켓 서버 사이의 통신 에러가 발생했을 때 사용하는 메시지
ex)
{
'type': 'CONNECTION_ERROR'
}

'LOCKER_OPEN': 웹 소켓 서버가 열어달라고 요청할 때 사용하는 메시지
ex)
{
'type': 'LOCKER_OPEN'
}

'LOCKER_CLOSE': 웹 소켓 서버가 닫아달라고 요청할 때 사용하는 메시지
ex)
{
'type': 'LOCKER_CLOSE'
}

'LOCKER_OPEN_SUCCESS': 클라이언트가 여는 것을 성공했을 때 사용하는 메시지
ex)
{
'type': 'LOCKER_OPEN_SUCCESS'
}

'LOCKER_CLOSE_SUCCESS': 클라이언트가 닫는 것을 성공했을 때 사용하는 메시지
ex)
{
'type': 'LOCKER_CLOSE_SUCCESS'
}

'LOCKER_CLOSE_FAILED': 클라이언트가 닫는 것을 실패했을 때 사용하는 메시지
ex)
{
'type': 'LOCKER_CLOSE_FAILED',
'data': {
'attempt': 1
}
}

'REQ_MOBILE_CLASS': 클라이언트가 이동 수업 정보를 요청할 때 사용하는 메시지
ex)
{
'type': 'REQ_MOBILE_CLASS',
}

'RES_MOBILE_CLASS': 클라이언트가 이동 수업 정보를 요청했을 때 사용하는 메시지
ex)
{
'type': 'RES_MOBILE_CLASS',
'data': {
'mobileClass': [
{
'classTime': 1,
'teacher': 'teacher',
'subject': 'subject'
}
]
}
}

'REQ_TIMEPERIOD': 클라이언트가 시정표를 요청할 때 사용하는 메시지
ex)
{
'type': 'REQ_TIMEPERIOD',
'data': {
'period': 1
}
}

'RES_TIMEPERIOD': 클라이언트가 시정표를 요청했을 때 사용하는 메시지
ex)
{
'type': 'RES_TIMEPERIOD',
'data': {
'period': {
'start': {
'hour': 1,
'minute': 1
},
'end': {
'hour': 1,
'minute': 1
},
'duration': 1
}
}
}
