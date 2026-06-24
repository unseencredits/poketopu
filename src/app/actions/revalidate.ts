'use server'

import { revalidateTag, revalidatePath } from 'next/cache'

export async function revalidateAfterListing() {
  revalidateTag('kartlar-listing')
  revalidatePath('/kartlar')
  revalidatePath('/ara')
  revalidatePath('/')
}
