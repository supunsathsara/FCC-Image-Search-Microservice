var express = require('express');
var cors = require('cors');
require('dotenv').config();
var { createClient } = require('pexels');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;

const logSchema = new Schema({
  searchQuery: String,
  date: Date,
});

const Log = mongoose.model('Log', logSchema);

var app = express();

app.use(cors());
app.use(express.json());

const client = createClient(process.env.PEXELS_API_KEY);

app.use('/public', express.static(`${process.cwd()}/public`));

function saveLog(query) {
  const log = new Log({
    searchQuery: query,
    date: new Date(),
  });
  log.save();
}

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/query/:search', (req, res) => {
  query = req.params.search;
  page = req.query.page;
  size = req.query.size;
  page = page ? page : 1;
  saveLog(query);
  if (size) {
    /**
     * large(24MP), medium(12MP) or small(4MP).
     */
    size = size === 'small' ? 'small' : size === 'medium' ? 'medium' : 'large';
    client.photos
      .search({ query: query, per_page: 5, page: page, size: size })
      .then((photos) => {
        result = [];
        photos.photos.forEach((photo) => {
          result.push({
            id: photo.id,
            width: photo.width,
            height: photo.height,
            url: photo.src.large,
            thumbnail: {
              url: photo.src.tiny,
              width: photo.src.tiny
                .split('&')
                [photo.src.tiny.split('&').length - 1].split('=')[1],
              height: photo.src.tiny
                .split('&')
                [photo.src.tiny.split('&').length - 2].split('=')[1],
            },
            description: photo.alt,
            parentPage: photo.url,
          });
        });
        res.json(result);
      });
  } else {
    client.photos
      .search({ query: query, per_page: 5, page: page })
      .then((photos) => {
        result = [];
        photos.photos.forEach((photo) => {
          result.push({
            id: photo.id,
            width: photo.width,
            height: photo.height,
            url: photo.src.large,
            thumbnail: {
              url: photo.src.tiny,
              width: photo.src.tiny
                .split('&')
                [photo.src.tiny.split('&').length - 1].split('=')[1],
              height: photo.src.tiny
                .split('&')
                [photo.src.tiny.split('&').length - 2].split('=')[1],
            },
            description: photo.alt,
            parentPage: photo.url,
          });
        });
        res.json(result);
      });
  }
});

app.get('/recent', (req, res) => {
  Log.find({}, { __v: 0 }, (err, docs) => {
    if (err) {
      console.log(err);
    } else {
      res.json(docs);
    }
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port);
});
