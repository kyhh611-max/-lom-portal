import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pwouxkfmudjizivtagkb.supabase.co'
const SERVICE_ROLE_KEY = 'sb_secret_Fh5FNxofiWf8QJSXBq5MJg__gTwuejQ'
const DEFAULT_PASSWORD = 'Yatsushiro2026!'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Excelから抽出した全メンバー
// email は仮のもの（後で実メールアドレスに更新が必要）
// position: 役職（アプリで定義済みのもののみ）
// department: 所属委員会（アプリで定義済みのもののみ）
const members = [
  // ── 常任理事 ──
  { name: '柳口 崇',      position: '理事長',   department: null,             phone: '090-4356-0027' },
  { name: '山田 朝日',    position: null,       department: null,             phone: '090-7580-5594' },
  { name: '宮﨑 慎也',    position: '監事',     department: null,             phone: '090-8395-1679' },
  { name: '桑原 啓彰',    position: '監事',     department: null,             phone: '090-5921-4725' },
  { name: '髙本 正彦',    position: '副理事長', department: null,             phone: '080-3991-7119' },
  { name: '今井 弘一郎',  position: '副理事長', department: null,             phone: '080-5273-4458' },
  { name: '岩橋 遼',      position: '副理事長', department: null,             phone: '080-1784-0107' },
  { name: '濱田 鈴ら',    position: '専務',     department: null,             phone: '080-5270-5891' },
  { name: '木下 雄一朗',  position: '財政局長', department: null,             phone: '090-5486-3457' },
  { name: '益田 振伍',    position: '室長',     department: null,             phone: '090-5383-5210' },
  { name: '丸塚 晃平',    position: '室長',     department: null,             phone: '090-3882-8550' },
  { name: '宮川 武也',    position: '室長',     department: null,             phone: '090-4512-9174' },
  { name: '筑間 将太',    position: '室長',     department: null,             phone: '090-5299-0087' },
  { name: '櫻井 力助',    position: '室長',     department: null,             phone: '090-1701-3353' },
  // ── BL大会実行委員会 ──
  { name: '菊池 芳信',    position: '委員長',   department: null,             phone: '080-6439-0220' },
  // ── 拡大委員会 ──
  { name: '宮本 真明',    position: '委員長',   department: '拡大委員会',     phone: '090-5021-7949' },
  { name: '四月一日亮太郎', position: null,     department: '拡大委員会',     phone: '090-5474-4932' },
  { name: '岩田 真稀斗',  position: null,       department: '拡大委員会',     phone: '080-6308-7191' },
  { name: '上村 昇平',    position: null,       department: '拡大委員会',     phone: '080-2692-6099' },
  { name: '神園 久二子',  position: null,       department: '拡大委員会',     phone: '090-3661-1925' },
  { name: '川田弘也',     position: null,       department: '拡大委員会',     phone: '090-1345-2048' },
  { name: '澤村 健太郎',  position: null,       department: '拡大委員会',     phone: '080-1769-4767' },
  { name: '島田　佳宜',   position: null,       department: '拡大委員会',     phone: null           },
  { name: '遠山 眞浩',    position: null,       department: '拡大委員会',     phone: '090-2390-9548' },
  { name: '林 龍哉',      position: null,       department: '拡大委員会',     phone: '090-1196-6002' },
  { name: '吉田 将治',    position: null,       department: '拡大委員会',     phone: '090-3324-1458' },
  // ── まちづくり委員会 ──
  { name: '松嶋 純也',    position: '委員長',   department: 'まちづくり委員会', phone: '080-3757-7395' },
  { name: '富田 將方',    position: null,       department: 'まちづくり委員会', phone: '080-5262-4810' },
  { name: '大野 勇斗',    position: null,       department: 'まちづくり委員会', phone: '090-8401-4932' },
  { name: '片山 渉',      position: null,       department: 'まちづくり委員会', phone: '090-6808-3307' },
  { name: '馬場﨑 諒輔',  position: null,       department: 'まちづくり委員会', phone: '090-6531-3791' },
  { name: '早瀬 省吾',    position: null,       department: 'まちづくり委員会', phone: '070-8556-2484' },
  { name: '星原　康人',   position: null,       department: 'まちづくり委員会', phone: '070-5494-6051' },
  { name: '松田 武俊',    position: null,       department: 'まちづくり委員会', phone: '070-5275-1140' },
  { name: '村上　友教',   position: null,       department: 'まちづくり委員会', phone: null           },
  { name: '百田 翔吾',    position: null,       department: 'まちづくり委員会', phone: '080-2757-7290' },
  { name: '山口 舞衣',    position: null,       department: 'まちづくり委員会', phone: '090-2589-0525' },
  { name: '山本 恭平',    position: null,       department: 'まちづくり委員会', phone: '070-9215-1862' },
  // ── ひとづくり委員会 ──
  { name: '坂本 龍二',    position: '委員長',   department: 'ひとづくり委員会', phone: '090-5940-1900' },
  { name: '久保田 ゆりか', position: null,      department: 'ひとづくり委員会', phone: '080-6463-7380' },
  { name: '一原 明香里',  position: null,       department: 'ひとづくり委員会', phone: '090-4998-6340' },
  { name: '片山 桃太郎',  position: null,       department: 'ひとづくり委員会', phone: '090-7867-4599' },
  { name: '川野 誠悟',    position: null,       department: 'ひとづくり委員会', phone: '080-1778-5731' },
  { name: '坂田 浩樹',    position: null,       department: 'ひとづくり委員会', phone: '080-5210-6472' },
  { name: '白濵 清輝',    position: null,       department: 'ひとづくり委員会', phone: '080-6422-0294' },
  { name: '竹﨑 翔里',    position: null,       department: 'ひとづくり委員会', phone: '090-9476-1783' },
  { name: '松嶋 健吾',    position: null,       department: 'ひとづくり委員会', phone: '090-6291-8264' },
  { name: '宮村 浩志',    position: null,       department: 'ひとづくり委員会', phone: '090-3987-6686' },
  { name: '三好 希羅々',  position: null,       department: 'ひとづくり委員会', phone: '080-7985-0533' },
  // ── 総務広報委員会 ──
  { name: '橋本 覚',      position: '委員長',   department: null,             phone: '090-7920-4578' },
  { name: '吉武 祥',      position: null,       department: null,             phone: '080-5255-8856' },
  { name: '木下 康太',    position: null,       department: null,             phone: '080-3942-0928' },
  { name: '木下 良佑',    position: null,       department: null,             phone: '080-5247-2081' },
  { name: '高田 裕也',    position: null,       department: null,             phone: '090-7982-7743' },
  { name: '福岡 輝哲',    position: null,       department: null,             phone: '080-8589-3844' },
  { name: '森﨑 裕理',    position: null,       department: null,             phone: '070-3530-1859' },
  { name: '山本 敬晃',    position: null,       department: null,             phone: '090-9652-4964' },
  // ── 事務局（運営グループ） ──
  { name: '吉住 和洋',    position: '事務局長', department: '運営グループ',   phone: '080-6451-0856' },
  { name: '山田 智大',    position: null,       department: '運営グループ',   phone: '080-2712-7820' },
  { name: '竹﨑 恭平',    position: null,       department: '運営グループ',   phone: '090-4483-9281' },
  { name: '豊田　光',     position: null,       department: '運営グループ',   phone: '090-7156-4849' },
  // ── 全城準備 ──
  { name: '大渕 正仁',    position: null,       department: null,             phone: '090-2715-2502' },
]

async function main() {
  let success = 0
  let failed = 0

  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    const index = String(i + 1).padStart(3, '0')
    const email = `member${index}@yatsushiro-jc.jp`

    process.stdout.write(`[${index}] ${m.name} ... `)

    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: m.name },
    })

    if (createError) {
      console.log(`失敗: ${createError.message}`)
      failed++
      continue
    }

    // profiles に追加情報を更新（トリガーで自動作成済み）
    await new Promise(r => setTimeout(r, 300)) // trigger待ち
    const { error: updateError } = await admin.from('profiles').update({
      full_name: m.name,
      phone: m.phone,
      position: m.position,
      department: m.department,
      role: 'member',
    }).eq('id', data.user.id)

    if (updateError) {
      console.log(`プロフィール更新失敗: ${updateError.message}`)
      failed++
    } else {
      console.log(`完了 (${email})`)
      success++
    }
  }

  console.log(`\n完了: ${success}名追加, ${failed}名失敗`)
  console.log(`\n初期パスワード: ${DEFAULT_PASSWORD}`)
  console.log('※ 各メンバーのメールアドレスは後で実際のアドレスに更新してください')
}

main().catch(console.error)
