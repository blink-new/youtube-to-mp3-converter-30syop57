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
      // Get video information using yt-dlp
      const infoProcess = new Deno.Command("yt-dlp", {
        args: [
          "--dump-json",
          "--no-download",
          `https://www.youtube.com/watch?v=${videoId}`
        ],
        stdout: "piped",
        stderr: "piped",
      });

      const infoResult = await infoProcess.output();
      
      if (!infoResult.success) {
        const error = new TextDecoder().decode(infoResult.stderr);
        console.error('yt-dlp info error:', error);
        return new Response(JSON.stringify({ error: 'Failed to get video information' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const infoOutput = new TextDecoder().decode(infoResult.stdout);
      const videoInfo = JSON.parse(infoOutput);

      return new Response(JSON.stringify({
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        duration: formatDuration(videoInfo.duration),
        channel: videoInfo.uploader || videoInfo.channel,
        videoId: videoId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (action === 'convert') {
      // Convert to MP3 using yt-dlp
      const outputPath = `/tmp/${videoId}.mp3`;
      
      const convertProcess = new Deno.Command("yt-dlp", {
        args: [
          "-x",
          "--audio-format", "mp3",
          "--audio-quality", "0",
          "-o", outputPath,
          `https://www.youtube.com/watch?v=${videoId}`
        ],
        stdout: "piped",
        stderr: "piped",
      });

      const convertResult = await convertProcess.output();
      
      if (!convertResult.success) {
        const error = new TextDecoder().decode(convertResult.stderr);
        console.error('yt-dlp convert error:', error);
        return new Response(JSON.stringify({ error: 'Failed to convert video to MP3' }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Read the converted file
      const audioData = await Deno.readFile(outputPath);
      
      // Clean up the temporary file
      try {
        await Deno.remove(outputPath);
      } catch (e) {
        console.warn('Failed to clean up temp file:', e);
      }

      // Return the audio file
      return new Response(audioData, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${videoId}.mp3"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
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

function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}