import { existsSync } from 'fs'
import path from 'path'

const CANDIDATE_UPLOAD_ROOTS = [
  '../CAN-RAG-BackEnd/app/storage/uploads',
  '../../CAN-RAG-BackEnd/app/storage/uploads',
  '../can-rag-backend/app/storage/uploads',
]

/** Resolve backend LOCAL_UPLOAD_ROOT for dev local upload mode. */
export function resolveDevUploadRoot(): string {
  const configured = process.env.DEV_UPLOAD_ROOT?.trim()
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured)
  }

  for (const relative of CANDIDATE_UPLOAD_ROOTS) {
    const candidate = path.resolve(process.cwd(), relative)
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return path.join(process.cwd(), 'storage', 'uploads')
}
