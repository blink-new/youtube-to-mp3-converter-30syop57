import { useState } from 'react'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Progress } from './components/ui/progress'
import { Alert, AlertDescription } from './components/ui/alert'
import { Download, Play, Clock, AlertCircle, CheckCircle2, Youtube } from 'lucide-react'

interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  channel: string
}

function App() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/
    return youtubeRegex.test(url)
  }

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  const handleConvert = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setError('')
    setSuccess('')
    setIsLoading(true)
    setProgress(0)
    setVideoInfo(null)
    setDownloadUrl('')

    try {
      // Fetch video info from our backend
      setProgress(25)
      const infoResponse = await fetch('https://30syop57--youtube-to-mp3.functions.blink.new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          action: 'info'
        })
      })

      if (!infoResponse.ok) {
        const errorData = await infoResponse.json()
        throw new Error(errorData.error || 'Failed to get video information')
      }

      const videoData = await infoResponse.json()
      setVideoInfo(videoData)
      setProgress(50)

      // Convert video to MP3
      setProgress(75)
      const convertResponse = await fetch('https://30syop57--youtube-to-mp3.functions.blink.new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          action: 'convert'
        })
      })

      if (!convertResponse.ok) {
        const errorData = await convertResponse.json()
        throw new Error(errorData.error || 'Failed to convert video')
      }

      // Create blob URL for download
      const audioBlob = await convertResponse.blob()
      const blobUrl = URL.createObjectURL(audioBlob)
      
      setProgress(100)
      setDownloadUrl(blobUrl)
      setSuccess('Conversion completed successfully!')
      
    } catch (err) {
      console.error('Conversion error:', err)
      setError(err instanceof Error ? err.message : 'Failed to convert video. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl && videoInfo) {
      // Create download link
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${videoInfo.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up blob URL after download
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Youtube className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">YouTube to MP3 Converter</h1>
              <p className="text-gray-600">Convert YouTube videos to high-quality MP3 files</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Converter Card */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Convert YouTube Videos to MP3
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Paste your YouTube video URL below and get high-quality MP3 audio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-lg"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleConvert}
                  disabled={isLoading || !url.trim()}
                  className="h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-medium"
                >
                  {isLoading ? 'Converting...' : 'Convert'}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Converting your video...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Video Preview */}
            {videoInfo && (
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-32 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://via.placeholder.com/320x240/f3f4f6/6b7280?text=Video+Thumbnail'
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {videoInfo.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{videoInfo.channel}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{videoInfo.duration}</span>
                      </div>
                    </div>
                  </div>
                  
                  {downloadUrl && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <Button
                        onClick={handleDownload}
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download MP3
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="shadow-lg border-0 bg-blue-50 border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Demo Version</h3>
                <p className="text-blue-800 text-sm">
                  This is a demonstration version that shows the UI and workflow. The actual MP3 conversion 
                  generates a mock audio file. In a production version, this would integrate with proper 
                  YouTube audio extraction services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">How to Use</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Copy YouTube URL</h3>
                <p className="text-gray-600 text-sm">
                  Find the YouTube video you want to convert and copy its URL
                </p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Paste & Convert</h3>
                <p className="text-gray-600 text-sm">
                  Paste the URL in the input field above and click Convert
                </p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Download MP3</h3>
                <p className="text-gray-600 text-sm">
                  Once converted, download your high-quality MP3 file
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Please respect YouTube's Terms of Service and copyright laws when using this tool.
              Only download content you have permission to use.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App