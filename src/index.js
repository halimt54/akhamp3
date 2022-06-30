const express = require('express')

const fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');

const cors = require('cors')

const mysql = require('./mysqlWrapper')

const app = express()
const streamerApi = express.Router()
const fs = require('fs');
const mysqlWrapper = require('./mysqlWrapper');
const port = 8081

// enable all cors
app.use(cors())

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


streamerApi.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname })
})


streamerApi.get('/song/:id', async (req, res) => {
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

streamerApi.get('/list', async (req, res) => {
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

streamerApi.patch('/favorite', async (req, res) => {
    try {
        const { songId } = req.body
        if (!songId) {
            return res.status(400).send({
                message: "songId is missing"
            })
        }
        const sql = `update song set is_fav = 1 where id = ?`
        const result = await mysqlWrapper.update(sql, [songId])

        if (!result) {
            return res.status(500).send({
                message: "could not set as favorite, please make sure the song is not in favorite list"
            })
        }
        res.send({
            message: "operation is successful",
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

streamerApi.delete('/favorite', async (req, res) => {
    try {
        const { songId } = req.body
        if (!songId) {
            return res.status(400).send({
                message: "songId is missing"
            })
        }
        const sql = `update song set is_fav = 0 where id = ?`
        const result = await mysqlWrapper.update(sql, [songId])

        if (!result) {
            return res.status(500).send({
                message: "could not unset the favorite, please make sure the song is in favorite list"
            })
        }
        res.send({
            message: "operation is successful",
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

streamerApi.get('/favorite', async (req, res) => {
    try {
        const sql = `select * from song where is_fav = 1`
        const data = await mysqlWrapper.select(sql)

        res.send({
            message: "operation is successful",
            data
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// get playlists
streamerApi.get('/playlist', async (req, res) => {
    try {
        const sql = `select * from playlist`
        const data = await mysqlWrapper.select(sql)

        res.send({
            message: "operation is successful",
            data
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})
// add playlist
streamerApi.post('/playlist', async (req, res) => {
    try {
        const { playlistName } = req.body
        if (!playlistName) {
            return res.status(400).send({
                message: "playlistName is missing"
            })
        }
        const sql = `insert into playlist (\`name\`) values (?)`
        const result = await mysqlWrapper.autoIncrementInsert(sql, [playlistName])

        if (result < 1) {
            return res.status(500).send({
                message: "could not insert new playlist, please check if the playlistName param is sent correcly and is unique"
            })
        }
        res.send({
            message: "operation is successful",
            playlistId: result
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// update playlist
streamerApi.put('/playlist', async (req, res) => {
    try {
        const { playlistId, playlistName } = req.body
        if (!playlistId || !playlistName) {
            return res.status(400).send({
                message: "playlistId or playlistName is missing"
            })
        }
        const sql = `update playlist set \`name\` = ? where id = ?`
        const result = await mysqlWrapper.update(sql, [playlistName, playlistId])

        if (!result) {
            return res.status(500).send({
                message: "could notupdate playlist, please check parameters"
            })
        }
        res.send({
            message: "operation is successful"
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// delete playlist
streamerApi.delete('/playlist', async (req, res) => {
    try {
        const { playlistId } = req.body
        if (!playlistId) {
            return res.status(400).send({
                message: "playlistId is missing"
            })
        }
        const sql = `delete from playlist where id = ?`
        const result = await mysqlWrapper.delete(sql, [playlistId])

        if (!result) {
            return res.status(500).send({
                message:  "could not delete playlist, please check parameters"
            })
        }
        res.send({
            message: "operation is successful"
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// add song to playlist
streamerApi.post('/playlistSong', async (req, res) => {
    try {
        const { playlistId, songId } = req.body
        if (!playlistId || !songId) {
            return res.status(400).send({
                message: "playlistId or songId is missing"
            })
        }
        const sql = `insert into playlist_song (playlist_id, song_id) values (?, ?)`
        const result = await mysqlWrapper.insert(sql, [playlistId, songId])

        if (!result) {
            return res.status(500).send({
                message: "could not add song to playlist, please check parameters"
            })
        }
        res.send({
            message: "operation is successful"
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// delete song from playlist
streamerApi.delete('/playlistSong', async (req, res) => {
    try {
        const { playlistId, songId } = req.body
        if (!playlistId || !songId) {
            return res.status(400).send({
                message: "playlistId or songId is missing"
            })
        }
        const sql = `delete from playlist_song where playlist_id = ? and song_id = ?`
        const result = await mysqlWrapper.delete(sql, [playlistId, songId])

        if (!result) {
            return res.status(500).send({
                message:  "could not remove song from playlist, please check parameters"
            })
        }
        res.send({
            message: "operation is successful"
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

// get playlist songs
streamerApi.get('/playlistSong', async (req, res) => {
    try {
        const { playlistId } = req.body
        if (!playlistId) {
            return res.status(400).send({
                message: "playlistId is missing"
            })
        }

        const sql = `select so.* from playlist_song plso join song so on so.id = plso.song_id where plso.playlist_id = ?`
        const data = await mysqlWrapper.select(sql, [playlistId])

        res.send({
            message: "operation is successful",
            data
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

streamerApi.post('/import', async (req, res) => {
    try {

        if (!req.files) {
            return res.status(400).send({
                message: "no files sent"
            })
        }
        // console.log(req.files)
        let data = []
        const files = req.files
        Object.values(files).forEach((song) => {
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

        if (data.length < 1) {
            throw new Error("Faulty data, could not get files")
        }
        const sql = `insert into song (name, file_path, metadata) values ?`
        const paramsArray = data.map(d => ([
            d.name,
            d.filePath,
            JSON.stringify(d)
        ]))
        const result = await mysql.update(sql, [paramsArray])

        res.send({
            message: data,
            result
        })
    } catch (error) {
        console.log(error)
        res.status(500).send({
            message: "unknown error",
            error
        })
    }
})

app.use('/streamer-api', streamerApi)

const server = app.listen(port, () => {
    console.log("server is ready and listening on " + port)
})