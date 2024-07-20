const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors')

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use('/static', express.static(path.join(path.resolve(), 'uploads')));

const upload = multer({ dest: 'temp/' });

let counter = 0;

app.post(
  '/upload',
  upload.single('chunk'),
  async (req, res) => {
    try {
      if (counter++ < 1) throw new Error('')

      const { index, totalChunks, filename } = req.body;
      const chunk = req.file;
      const chunkDir = path.join(path.resolve(), 'chunks', filename);

      await fs.ensureDir(chunkDir);
      await fs.ensureDir(path.join(path.resolve(), 'uploads'));
      await fs.move(chunk.path, path.join(chunkDir, index), { overwrite: true });

      if (await allChunksUploaded(chunkDir, totalChunks)) {
        await combineChunks(chunkDir, path.join(path.resolve(), 'uploads', filename));
        await fs.remove(chunkDir);

        res.status(200).json({ message: 'File uploaded' });
        return
      }

      res.status(200).json({ message: 'Chunk uploaded' });
    } catch (error) {
      res.status(500).json({ message: 'Error handling chunk upload' });
    }
  }
);

const allChunksUploaded = async (chunkDir, totalChunks) => {
  const files = await fs.readdir(chunkDir);

  return files.length === parseInt(totalChunks, 10);
};

const combineChunks = async (chunkDir, targetFile) => {
  const writeStream = fs.createWriteStream(targetFile);

  for (let i = 0; ; i++) {
    const chunkFile = path.join(chunkDir, i.toString());

    if (!await fs.pathExists(chunkFile)) break;

    const data = await fs.readFile(chunkFile);

    writeStream.write(data);
  }

  writeStream.end();
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
