import { auth } from '@clerk/tanstack-react-start/server'
import {
  createUploadthing,
  UploadThingError,
  type FileRouter,
} from 'uploadthing/server'

const f = createUploadthing()

export const uploadRouter = {
  agentSprite: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new UploadThingError('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
