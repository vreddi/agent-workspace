import { auth } from '@clerk/tanstack-react-start/server'
import {
  createUploadthing,
  UploadThingError,
  type FileRouter,
} from 'uploadthing/server'

const f = createUploadthing()

export const uploadRouter = {
  groupIcon: f({
    image: { maxFileSize: '2MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new UploadThingError('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Returned to the client so the form can persist the URL via Convex.
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),
} satisfies FileRouter

export type UploadRouter = typeof uploadRouter
