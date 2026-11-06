// queries/part2_queries.js
// Запуск: mongosh "ВАШ_URI" --file queries/part2_queries.js

db = db.getSiblingDB("spotify");

// Завдання 1. Треки для вечірки


db.tracks.find({"audio_features.danceability": {"$gt" : 0.7},"audio_features.energy" : {"$gt" : 0.7},"duration_ms": {"$gte": 180000,  "$lte":300000}});


// Завдання 2. Виконавці, у яких усі треки популярні
// Топ-20 за середньою популярністю

db.tracks.aggregate([
  { $unwind: "$artists" },
  { $group: {
      _id: "$artists",
      tracks_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
  }},
  { $match: { tracks_count: { $gte: 3 }, min_popularity: { $gte: 60 } } },
  { $project: {
      _id: 0,
      artist: "$_id",
      tracks_count: 1,
      min_popularity: 1,
      avg_popularity: { $round: ["$avg_popularity", 1] }
  }},
  { $sort: { avg_popularity: -1, tracks_count: -1 } },
  { $limit: 20 }
]);

// Завдання 3. Нетипові треки

db.tracks.aggregate([
  { $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_tempo: { $stdDevPop: "$audio_features.tempo" },
      tracks: { $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: { tempo: "$audio_features.tempo" }
      }}
  }},
  { $addFields: {
      outlier_threshold: { $add: [ "$avg_tempo", { $multiply: [2, "$std_tempo"] } ] }
  }},
  { $addFields: {
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "t",
          cond: { $gt: [ "$$t.audio_features.tempo", "$outlier_threshold" ] }
        }
      }
  }},
  { $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: 1,
      outlier_threshold: 1,
      outlier_tracks: 1
  }}
]);

// Завдання 4. Треки для фонової роботи

db.tracks.find({
  "audio_features.loudness": { $lt: -10 },
  "audio_features.speechiness": { $lt: 0.1 },
  "audio_features.instrumentalness": { $gt: 0.5 },
  explicit: false
});