'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [quality, setQuality] = useState('');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const fetchVideoInfo = async () => {
    if (!url) return;
    setLoadingInfo(true);
    try {
      const response = await fetch(`http://localhost:4000/info?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setAvailableQualities(data.qualities.map((q: number) => `${q}p`)); // 720p, 480p...
      setQuality(`${data.qualities[0]}p`); // default highest quality
    } catch (error) {
      console.error('Failed to fetch video info:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleDownload = () => {
    if (!url) return;

    const baseUrl = `http://localhost:4000/download?url=${encodeURIComponent(url)}&format=${format}`;
    const finalUrl = format === 'mp3' ? baseUrl : `${baseUrl}&quality=${quality}`;

    const anchor = document.createElement('a');
    anchor.href = finalUrl;
    anchor.download = '';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleToggleOptions = async () => {
    if (!showOptions && url) {
      await fetchVideoInfo();
    }
    setShowOptions(!showOptions);
  };

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-6">
      <h1 className="text-3xl font-bold">YouTube Video Downloader</h1>

      <input
        className="p-2 w-96 rounded bg-gray-800 border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        placeholder="Enter YouTube video URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      {showOptions && (
        <div className="w-96 p-4 bg-gray-800 rounded shadow-md space-y-4">
          <div>
            <label className="block text-sm mb-1">Select Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'mp4' | 'mp3')}
              className="w-full p-2 bg-gray-700 rounded text-white focus:outline-none"
            >
              <option value="mp4">MP4 (Video + Audio)</option>
              {/* <option value="mp3">MP3 (Audio Only)</option> */}
            </select>
          </div>

          {format !== 'mp3' && (
            <div>
              <label className="block text-sm mb-1">Select Quality</label>
              {loadingInfo ? (
                <div className="text-gray-400">Loading available qualities...</div>
              ) : (
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded text-white focus:outline-none"
                >
                  {availableQualities.length > 0 ? (
                    availableQualities.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))
                  ) : (
                    <option>No qualities available</option>
                  )}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          onClick={handleDownload}
          disabled={!url || (format !== 'mp3' && !quality)}
        >
          Download
        </button>

        <button
          className="bg-gray-700 px-6 py-2 rounded hover:bg-gray-600 transition disabled:opacity-50"
          onClick={handleToggleOptions}
          disabled={!url}
        >
          {showOptions ? 'Hide Options' : 'Options'}
        </button>
      </div>
    </div>
  );
}
