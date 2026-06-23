'use server'

import { updateTag, revalidatePath } from 'next/cache'

export async function revalidateAfterListing() {
  updateTag('kartlar-listing')
  revalidatePath('/kartlar')
  revalidatePath('/ara')
  revalidatePath('/')
}
