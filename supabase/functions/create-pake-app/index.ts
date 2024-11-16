// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, app_name } = await req.json()

    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Insertar en la base de datos
    const { data, error: insertError } = await supabaseClient
      .from('pake_apps')
      .insert([
        {
          url,
          app_name,
          status: 'processing'
        }
      ])
      .select()
      .single()

    if (insertError) throw insertError

    // Aquí simularemos el proceso de empaquetado
    // En una implementación real, aquí irían los comandos de Pake
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Actualizar el estado a completado
    const { error: updateError } = await supabaseClient
      .from('pake_apps')
      .update({ 
        status: 'completed',
        package_url: `https://example.com/apps/${app_name}.zip` // URL simulada
      })
      .eq('id', data.id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          status: 'completed'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})