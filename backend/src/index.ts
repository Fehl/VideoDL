import express, { Request, Response } from 'express';
// import ytdl from 'ytdl-core';
import cors from 'cors';

const ytdl = require("@distube/ytdl-core");
const fs = require('fs');
const app = express();
const PORT = 4000;


app.use(cors());

app.get('/download', async (req: Request, res: Response) => {
  const url = req.query.url as string;

  if (!ytdl.validateURL(url)) {
    res.status(400).send('Invalid URL');
    return;
  }

  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

    if (!format) {
    res.status(400).send('No suitable format found');
    return;
    }

//   res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
//   ytdl(url).pipe(fs.createWriteStream('downloads/video.mp4'));
//   console.log("wow")
  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    ytdl(url, { format: 'mp4' }).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Failed to download video');
  }
  
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
