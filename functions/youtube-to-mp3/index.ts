import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  // Handle CORS for frontend calls
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { url, action } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'YouTube URL is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/);
    if (!videoIdMatch) {
      return new Response(JSON.stringify({ error: 'Invalid YouTube URL' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const videoId = videoIdMatch[1];

    if (action === 'info') {
      // Get video information using YouTube oEmbed API
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await fetch(oembedUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch video info');
        }
        
        const data = await response.json();
        
        // Get additional info from YouTube's basic API
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        return new Response(JSON.stringify({
          title: data.title,
          thumbnail: thumbnailUrl,
          duration: "Unknown", // oEmbed doesn't provide duration
          channel: data.author_name,
          videoId: videoId
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('Error fetching video info:', error);
        return new Response(JSON.stringify({ error: 'Failed to get video information' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    if (action === 'convert') {
      // For demonstration purposes, we'll create a mock MP3 file
      // In a real implementation, you would use a service like:
      // - YouTube API with proper authentication
      // - Third-party conversion service
      // - Server with yt-dlp installed
      
      try {
        // Create a minimal MP3 header (this is just for demo - not a real MP3)
        const mp3Header = new Uint8Array([
          0xFF, 0xFB, 0x90, 0x00, // MP3 frame header
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
          0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
        ]);
        
        // Create a larger buffer to simulate an MP3 file
        const mockMp3Data = new Uint8Array(1024 * 10); // 10KB mock file
        mockMp3Data.set(mp3Header, 0);
        
        // Fill with some pattern data
        for (let i = mp3Header.length; i < mockMp3Data.length; i++) {
          mockMp3Data[i] = Math.floor(Math.random() * 256);
        }

        return new Response(mockMp3Data, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('Error creating mock MP3:', error);
        return new Response(JSON.stringify({ error: 'Failed to convert video to MP3' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});