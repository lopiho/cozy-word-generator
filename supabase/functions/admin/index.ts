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

    // Validate password
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
        const { error } = await supabase.from('dictionaries').delete().eq('id', id)
        if (error) throw error
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
        return new Response(JSON.stringify({ success: true, count: rows.length }), {
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
        const { error } = await supabase.from('words').delete().eq('id', id)
        if (error) throw error
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
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'seed_defaults': {
        // Seed default dictionaries and words from provided data
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
            // Insert in batches of 500
            for (let i = 0; i < d.words.length; i += 500) {
              const batch = d.words.slice(i, i + 500).map((w: string) => ({
                word: w.trim(),
                dictionary_id: dict.id,
              }))
              const { error: wordError } = await supabase.from('words').insert(batch)
              if (wordError) throw wordError
            }
          }
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
