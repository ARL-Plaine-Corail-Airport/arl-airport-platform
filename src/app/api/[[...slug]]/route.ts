import config from '@payload-config'
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'

const restGet = REST_GET(config)
const restPost = REST_POST(config)
const restPatch = REST_PATCH(config)
const restDelete = REST_DELETE(config)
const restPut = REST_PUT(config)

export const GET = restGet
export const POST = restPost
export const PATCH = restPatch
export const DELETE = restDelete
export const PUT = restPut
