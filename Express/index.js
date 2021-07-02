const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs/promises');
const uuid = require('uuid');
const { Calibre } = require('node-calibre');
const cors = require('cors');
const TempFilePath = './temp/';

app.use((req, res, next) => {
    console.log(req.headers);
    next();
});

//app.use(cors({origin: "https://vikasg603.github.io", preflightContinue: false}));
app.use(express.json());

app.use('/static', express.static(TempFilePath));

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

        res.json({ path: newFile });

    } catch (err) {
        res.status(503).json({
            Error: "Internal server error"
        });
    }

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})