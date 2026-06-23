'use server'

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { createClient } from '@/lib/supabase/server'

function formatPhone(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, '')
  if (cleaned.startsWith('+')) return cleaned
  return `+90${cleaned.replace(/^0/, '')}`
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendPhoneOtp(rawPhone: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  const phone = formatPhone(rawPhone)
  const code = generateCode()

  // Önceki kodu sil, yenisini ekle
  await supabase.from('phone_verifications').delete().eq('user_id', user.id)
  const { error: dbErr } = await supabase.from('phone_verifications').insert({
    user_id: user.id,
    phone,
    code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })
  if (dbErr) return { ok: false, error: 'Veritabanı hatası.' }

  // AWS SNS ile SMS gönder
  const sns = new SNSClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })

  try {
    await sns.send(new PublishCommand({
      PhoneNumber: phone,
      Message: `Poketopu doğrulama kodunuz: ${code}`,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' },
      },
    }))
    return { ok: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'SMS gönderilemedi.'
    console.error('SNS error:', msg)
    // SMS başarısız olursa DB kaydını sil
    await supabase.from('phone_verifications').delete().eq('user_id', user.id)
    return { ok: false, error: 'SMS gönderilemedi. AWS ayarlarını kontrol et.' }
  }
}

export async function verifyPhoneOtp(rawPhone: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum bulunamadı.' }

  const phone = formatPhone(rawPhone)

  const { data: record } = await supabase
    .from('phone_verifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('phone', phone)
    .single()

  if (!record) return { ok: false, error: 'Kod bulunamadı. Tekrar SMS gönder.' }
  if (new Date(record.expires_at) < new Date()) {
    await supabase.from('phone_verifications').delete().eq('id', record.id)
    return { ok: false, error: 'Kodun süresi doldu. Tekrar SMS gönder.' }
  }
  if (record.attempts >= 5) {
    await supabase.from('phone_verifications').delete().eq('id', record.id)
    return { ok: false, error: 'Çok fazla yanlış deneme. Tekrar SMS gönder.' }
  }
  if (record.code !== code.trim()) {
    await supabase.from('phone_verifications').update({ attempts: record.attempts + 1 }).eq('id', record.id)
    return { ok: false, error: `Kod hatalı. ${4 - record.attempts} deneme hakkın kaldı.` }
  }

  // Başarılı — kodu sil, telefonu kaydet
  await supabase.from('phone_verifications').delete().eq('id', record.id)
  await supabase.from('profiles').update({ phone }).eq('id', user.id)

  return { ok: true }
}
