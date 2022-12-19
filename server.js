const express = require("express")
const cors = require('cors')
const ytdl = require('ytdl-core')
const fs = require('fs')
const app = express()
const { spawn } = require('child_process');
const ffmpeg = require('ffmpeg-static');


app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/info', async (req, res) => {
    try {
        if (!ytdl.validateURL(req.query.url)) {
            res.status(422).send("Invalid YouTube link"); // error if input incorrect
        } else {
            const url = req.query.url
            const metaInfo = await ytdl.getInfo(url);
            res.status(200).json(metaInfo)

        }
    } catch (error) {
        res.status(500).json("Internal Server Error/ Network Error")
    }
})

app.get('/download', async (req, res) => {
    try {
        const url = req.query.url
        const choosedQuality = req.query.format
        console.log(choosedQuality)
        const type = req.query.type
        if (type === 'Video') {
            const info = await ytdl.getInfo(url);
            const audio = ytdl.downloadFromInfo(info);
            const video = ytdl.downloadFromInfo(info, { quality: choosedQuality });
            const proc = spawn(ffmpeg, ['-loglevel', '8', '-i', 'pipe:3', '-i', 'pipe:4', '-map', '0:a?', '-map', '1:v', '-c', 'copy', '-movflags', 'frag_keyframe+empty_moov', '-f', 'mp4',  'pipe:5'], { stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe', 'pipe'] }); // convert to mp4
            audio.pipe(proc.stdio[3]);
            video.pipe(proc.stdio[4]);
            proc.stdio[5].pipe(res);
            res.attachment(`${info.videoDetails.title}.mp4`)
        } else {
            const info = await ytdl.getInfo(url);
            const audio = ytdl.downloadFromInfo(info,{quality:251});
            const proc = spawn(ffmpeg, ['-loglevel', '8', '-i', 'pipe:3', '-f', 'mp3', 'pipe:4'], { stdio: ['inherit', 'inherit', 'inherit', 'pipe', 'pipe'] }); // convert to mp3
            audio.pipe(proc.stdio[3]);
            proc.stdio[4].pipe(res);
            res.attachment(`${info.videoDetails.title}.mp3`);
        }
    } catch (error) {
        console.log(error)
        res.status(500).json("Internal Server Error / Network Error")
    }
})

app.listen(process.env.PORT || 3001, () => {
    console.log("Server Is Running")
})