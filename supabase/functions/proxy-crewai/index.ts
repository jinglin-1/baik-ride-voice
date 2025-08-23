import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const CREWAI_ENDPOINT = 'https://voice-enabled-sf-cycling-assistant-v1-cb557-b57156cc.crewai.com/kickoff';
const CREWAI_TOKEN = '58418a4b14bf';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === 'GET' && new URL(req.url).pathname === '/proxy-crewai/health') {
    console.log('Health check requested');
    return new Response(
      JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }

  // Main proxy endpoint
  if (req.method === 'POST') {
    try {
      const requestBody = await req.json();
      console.log('Incoming request:', JSON.stringify(requestBody));

      // Validate incoming request
      if (!requestBody.user_request) {
        console.error('Missing user_request in request body');
        return new Response(
          JSON.stringify({ error: 'Missing user_request field' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      // Transform data format: {"user_request": "..."} → {"inputs": {"user_request": "..."}}
      const transformedData = {
        inputs: {
          user_request: requestBody.user_request
        }
      };

      console.log('Transformed data:', JSON.stringify(transformedData));

      // Forward request to CrewAI
      const crewAIResponse = await fetch(CREWAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CREWAI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!crewAIResponse.ok) {
        console.error(`CrewAI API error: ${crewAIResponse.status} ${crewAIResponse.statusText}`);
        const errorText = await crewAIResponse.text();
        console.error('CrewAI error response:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'CrewAI API request failed', 
            status: crewAIResponse.status,
            message: errorText
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: crewAIResponse.status 
          }
        );
      }

      const crewAIData = await crewAIResponse.json();
      console.log('CrewAI response:', JSON.stringify(crewAIData));

      // Return CrewAI's response
      return new Response(
        JSON.stringify(crewAIData),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } catch (error) {
      console.error('Proxy error:', error);
      
      return new Response(
        JSON.stringify({ 
          error: 'Internal server error', 
          message: error.message 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
  }

  // Method not allowed
  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405 
    }
  );
});