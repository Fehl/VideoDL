// backend/index.ts

import express, { Request, Response } from 'express';
import cors from 'cors';
import ffmpegPath from 'ffmpeg-static';
// import ffmpeg from 'fluent-ffmpeg';
import ytdl from '@distube/ytdl-core';

const ffmpeg = require('fluent-ffmpeg');
const app = express();
const PORT = 4000;

// Setup ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath!);

app.use(cors());

// --- /info route ---
// Fetch video info: title + available qualities
app.get('/info', async (req: Request, res: Response) => {
  const url = req.query.url as string;

  if (!url || !ytdl.validateURL(url)) {
    res.status(400).send('Invalid YouTube URL');
    return;
  }

  try {
    const info = await ytdl.getInfo(url);

    // Get all available video-only streams
    const qualities = info.formats
      .filter((format: any) => format.hasVideo && format.container === 'mp4')
      .map((format: any) => format.height)
      .filter((height: number, index: number, self: number[]) => height && self.indexOf(height) === index)
      .sort((a: number, b: number) => b - a); // descending order

    res.json({
      title: info.videoDetails.title,
      qualities: qualities, // [1080, 720, 480, 360, etc.]
    });
  } catch (error) {
    console.error('Error fetching info:', error);
    res.status(500).send('Failed to fetch video info');
  }
});

// --- /download route ---
// Stream merged video+audio to the user
app.get('/download', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  const format = (req.query.format as string) || 'mp4';
  const quality = req.query.quality as string;

  if (!url || !ytdl.validateURL(url)) {
    res.status(400).send('Invalid URL');
    return;
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 50);

    if (format === 'mp3') {
      // Audio only
      res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
      res.setHeader('Content-Type', 'audio/mpeg');

      ytdl(url, { quality: 'highestaudio' }).pipe(res);

    } else {
      // Video
      const requestedHeight = parseInt(quality.replace('p', ''), 10);

      // Choose the best format that has video *and* audio
      const formatWithAudio = info.formats.find((f: any) =>
        f.container === 'mp4' &&
        f.hasVideo &&
        f.hasAudio &&
        f.height === requestedHeight
      );

      if (!formatWithAudio) {
        // If no combined audio/video found, fallback to video-only (no audio)
        const videoOnly = info.formats.find((f: any) =>
          f.container === 'mp4' &&
          f.hasVideo &&
          !f.hasAudio &&
          f.height === requestedHeight
        );

        if (!videoOnly) {
          res.status(400).send('Requested quality not available.');
          return;
        }

        res.setHeader('Content-Disposition', `attachment; filename="${title}-noaudio.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        ytdl(url, { quality: videoOnly.itag }).pipe(res);
      } else {
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        ytdl(url, { quality: formatWithAudio.itag }).pipe(res);
      }
    }

  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Failed to download');
  }
});


// --- Start server ---
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
