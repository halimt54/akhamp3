const express = require('express')

const fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');

const cors = require('cors')

const mysql = require('./mysqlWrapper')

const app = express()
const fs = require('fs')
const port = 8080

// enable all cors
app.use(cors())

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname })
})


app.get('/song/:id', async (req, res) => {
    const id = req.params.id
    if (!id) {
        return res.status(400).send({
            message: "no song id provided"
        })
    }
    const sql = `select file_path from song where id = ?`
    const songResult = await mysql.select(sql, [id])
    
    if (!songResult || songResult.length == 0) {
        return res.status(404).send({
            message: "song not found"
        })
    }
    
    var song = songResult[0]
    var filePath = song.file_path
    var stat = fs.statSync(filePath);
    var total = stat.size;
    if (req.headers.range) {
        var range = req.headers.range;
        console.log(range)
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total - 1;
        var chunksize = (end - start) + 1;
        var readStream = fs.createReadStream(filePath, { start: start, end: end });
        res.writeHead(206, {
            'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
            'Accept-Ranges': 'bytes', 'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg'
        });
        readStream.pipe(res);
    } else {
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'audio/mpeg' });
        fs.createReadStream(filePath).pipe(res);
    }
})

/*
app.get('/mp4', (req, res) => {
    const range = req.headers.range;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoPath = "vlog-2021-08-15.mp4";
    const videoSize = fs.statSync(videoPath).size;
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
})
*/

app.get('/list', async (req, res) => {
    const sql = `select id, name, is_fav, metadata from song`

    let result = await mysql.select(sql)

    if (result && result.length > 0) {
        result = result.map(r => {
            if (r.metadata) {
                delete r.metadata.filePath
            }
            return r
        })
    }
    
    res.send({
        result
    })
})

app.post('/import', async (req, res) => {
    if (!req.files) {
        return res.status(400).send({
            message: "no files sent"
        })
    }
    let data = []
    const files = req.files.files
    files.forEach((song) => {
        //move photo to uploads directory
        const filePath = './uploads/' + song.name
        song.mv(filePath);

        //push file details
        data.push({
            name: song.name,
            mimetype: song.mimetype,
            size: song.size,
            filePath
        });
    })
    const sql = `insert into song (name, file_path, metadata) values ?`
    const paramsArray = data.map(d => ([
        d.name,
        d.filePath,
        JSON.stringify(d)
    ]))
    console.log(paramsArray)
    const result = await mysql.update(sql, [paramsArray])
    
    res.send({
        message: data,
        result
    })
})


const server = app.listen(port, () => {
    console.log("server is ready and listening on " + port)
})