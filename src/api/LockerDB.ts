import AWS = require('aws-sdk')
AWS.config.getCredentials(function (err) {
    if (err) console.log(err.stack)
})
AWS.config.update({ region: 'ap-northeast-2' })

const dynamoDB = new AWS.DynamoDB.DocumentClient()

export const lockerDataProperties = ['uuid', 'nickname', 'isLocked', 'grade', 'classNumber']
export interface LockerData {
    uuid: string
    nickname: string | null
    isLocked: boolean
    grade: number
    classNumber: number
}

type SetLockerData = { [Property in keyof LockerData]?: LockerData[Property] }
export async function getLockerData(uuid: string) {
    const data = (
        await dynamoDB
            .get({
                TableName: 'seda_locker',
                Key: {
                    uuid,
                },
            })
            .promise()
    )?.Item
    if (data?.uuid) {
        return data as LockerData
    }
    return null
}

export async function scanLockerData() {
    const data = (
        await dynamoDB
            .scan({
                TableName: 'seda_locker',
            })
            .promise()
    )?.Items
    if (data) {
        return data as LockerData[]
    }
    return []
}

export async function setLockerData(uuid: string, data: SetLockerData) {
    const updateExpression = []
    const updateAttributeValues: { [key: string]: any } = {}
    for (const key in data) {
        updateExpression.push(`${key} = :${key}`)
        //@ts-ignore
        updateAttributeValues[`:${key}`] = data[key]
    }

    const params = {
        TableName: 'seda_locker',
        Key: {
            uuid,
        },
        UpdateExpression: 'set ' + updateExpression.join(', '),
        ExpressionAttributeValues: updateAttributeValues,
    }
    try {
        await dynamoDB.update(params).promise()
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}
