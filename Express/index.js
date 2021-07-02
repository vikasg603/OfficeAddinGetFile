process.env.NODE_ENV = "production";
const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs/promises');
const uuid = require('uuid');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const cors = require('cors');
const TempFilePath = __dirname + '/temp/';

app.use(cors({origin: "https://vikasg603.github.io", preflightContinue: false}));
app.use(express.json({limit: '50mb'}));

app.use('/static', express.static(TempFilePath));

app.get('/.well-known/pki-validation/C5ACBC7A4D1E19691D61328266CF7AAE.txt', (req, res) => {
    res.sendFile('/home/ubuntu/OfficeAddinGetFile/Express/C5ACBC7A4D1E19691D61328266CF7AAE.txt');
})

app.post('/ProcessBase64PDF', async (req, res) => {
    try {

        if (!req.body.doc || !req.body.title) {
            res.status(400).json({
                Error: "No doc found"
            });
        }
        const base64Doc = req.body.doc;
        const title = req.body.title;

        const FileName = uuid.v4();

        const FilePathWithoutExtension = TempFilePath + FileName;

        await fs.writeFile(FilePathWithoutExtension + '.pdf', base64Doc, 'base64');

        await exec(`ebook-convert "${FilePathWithoutExtension}.pdf" "${FilePathWithoutExtension}.epub" --enable-heuristics --title="${title}"`)

        res.json({
            url: '3.8.40.182' + '/static/' + FileName + '.epub'
        })

    } catch (err) {
        console.log(err);
        res.status(503).json({
            Error: "Internal server error"
        });
    }

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})