declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EMAIL_SERVER: string
      EMAIL_FROM: string
      MONGODB_URI: string
      ADMIN_EMAILS: string
    }
  }
}

export {}