const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs/promises');
const uuid = require('uuid');
const { Calibre } = require('node-calibre');
const cors = require('cors');

const TempFilePath = './temp/';

app.use(express.json());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.header('origin'));
    next();
});
app.use(cors());
app.use(express.static(TempFilePath));

app.get('/.well-known/pki-validation/F3DD8BAAEF853C5F0743C4B37253AE70.txt', (req, resp) => {
    resp.send(`8FDDC679910C239EEF2626E88B902063D91E95E6B79A0C3F0B211E5E722A60D0
comodoca.com
dcb1403172f8100`)
});

app.post('/ProcessBase64PDF', async (req, res) => {
    try {

        if (!req.body.doc) {
            res.status(400).json({
                Error: "No doc found"
            });
        }
        const base64Doc = req.body.doc;

        const FilePath = TempFilePath + uuid.v4() + ".pdf"

        await fs.writeFile(FilePath, base64Doc, 'base64');

        const calibre = new Calibre();

        const newFile = await calibre.ebookConvert(FilePath, 'epub', {
            epubFlatten: null,
        });

        res.send({ path: newFile });

    } catch (err) {
        res.status(503).json({
            Error: "Internal server error"
        });
    }

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})