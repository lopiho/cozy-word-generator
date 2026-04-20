import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, password, ...data } = await req.json()

    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Neplatné heslo' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    async function audit(action: string, entity_type: string, entity_id: string | null, details: Record<string, unknown> = {}) {
      await supabase.from('audit_log').insert({
        action,
        entity_type,
        entity_id,
        details,
      })
    }

    switch (action) {
      case 'verify': {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'create_dictionary': {
        const { name, description, icon, type } = data
        if (!name || typeof name !== 'string' || name.length > 255) {
          return new Response(JSON.stringify({ error: 'Neplatný název' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { data: dict, error } = await supabase
          .from('dictionaries')
          .insert({ name, description: description || null, icon: icon || '📚', type: type || 'custom' })
          .select()
          .single()
        if (error) throw error
        await audit('create_dictionary', 'dictionary', dict.id, { name })
        return new Response(JSON.stringify(dict), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update_dictionary': {
        const { id, name, description, icon } = data
        if (!id) {
          return new Response(JSON.stringify({ error: 'Chybí ID' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { data: dict, error } = await supabase
          .from('dictionaries')
          .update({ name, description, icon })
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        await audit('update_dictionary', 'dictionary', id, { name, description, icon })
        return new Response(JSON.stringify(dict), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete_dictionary': {
        const { id } = data
        if (!id) {
          return new Response(JSON.stringify({ error: 'Chybí ID' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        // Get name for audit
        const { data: existing } = await supabase.from('dictionaries').select('name').eq('id', id).single()
        const { error } = await supabase.from('dictionaries').delete().eq('id', id)
        if (error) throw error
        await audit('delete_dictionary', 'dictionary', id, { name: existing?.name })
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'add_words': {
        const { dictionary_id, words } = data
        if (!dictionary_id || !Array.isArray(words) || words.length === 0) {
          return new Response(JSON.stringify({ error: 'Neplatná data' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const rows = words.filter((w: string) => w && w.trim().length > 0 && w.length <= 255)
          .map((w: string) => ({ word: w.trim(), dictionary_id }))
        if (rows.length === 0) {
          return new Response(JSON.stringify({ error: 'Žádná platná slova' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { error } = await supabase.from('words').insert(rows)
        if (error) throw error
        await audit('add_words', 'word', dictionary_id, { count: rows.length, sample: rows.slice(0, 5).map(r => r.word) })
        return new Response(JSON.stringify({ success: true, count: rows.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update_word': {
        const { id, word } = data
        if (!id || !word || typeof word !== 'string' || word.trim().length === 0 || word.length > 255) {
          return new Response(JSON.stringify({ error: 'Neplatná data' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { data: oldWord } = await supabase.from('words').select('word').eq('id', id).single()
        const { error } = await supabase.from('words').update({ word: word.trim() }).eq('id', id)
        if (error) throw error
        await audit('update_word', 'word', id, { old: oldWord?.word, new: word.trim() })
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete_word': {
        const { id } = data
        if (!id) {
          return new Response(JSON.stringify({ error: 'Chybí ID' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { data: existing } = await supabase.from('words').select('word').eq('id', id).single()
        const { error } = await supabase.from('words').delete().eq('id', id)
        if (error) throw error
        await audit('delete_word', 'word', id, { word: existing?.word })
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete_words_bulk': {
        const { ids } = data
        if (!Array.isArray(ids) || ids.length === 0) {
          return new Response(JSON.stringify({ error: 'Chybí IDs' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        const { error } = await supabase.from('words').delete().in('id', ids)
        if (error) throw error
        await audit('delete_words_bulk', 'word', null, { count: ids.length })
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'seed_defaults': {
        const { dictionaries: dicts } = data
        if (!Array.isArray(dicts)) {
          return new Response(JSON.stringify({ error: 'Neplatná data' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
        for (const d of dicts) {
          const { data: dict, error: dictError } = await supabase
            .from('dictionaries')
            .insert({ name: d.name, description: d.description, icon: d.icon, type: d.type })
            .select()
            .single()
          if (dictError) throw dictError
          if (d.words && d.words.length > 0) {
            for (let i = 0; i < d.words.length; i += 500) {
              const batch = d.words.slice(i, i + 500).map((w: string) => ({
                word: w.trim(),
                dictionary_id: dict.id,
              }))
              const { error: wordError } = await supabase.from('words').insert(batch)
              if (wordError) throw wordError
            }
          }
          await audit('seed_defaults', 'dictionary', dict.id, { name: d.name, wordCount: d.words?.length || 0 })
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Neznámá akce' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('Admin error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Interní chyba' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
