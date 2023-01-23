const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "moviesData.db");
app.use(express.json());
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`Db Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//Get API 1
app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
      ORDER BY movie_id;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//POST Movie API 2
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovie = `
        INSERT INTO movie(director_id, movie_name, lead_actor)
        VALUES ('${directorId}', '${movieName}', '${leadActor}');
    `;
  const newMovie = await db.run(addMovie);
  const movieId = newMovie.lastID;
  response.send("Movie Successfully Added");
});

// GET specific movie with movie_id API 3
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovie = `
        SELECT * FROM movie
        WHERE movie_id = ${movieId};
    `;
  const movie = await db.get(getMovie);
  response.send(convertDbObjectToResponseObject(movie));
});

//UPDATE movie details by movie_id (PUT) API 4
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovie = `
         UPDATE movie
         SET 
         director_id = '${directorId}',
         movie_name = '${movieName}',
         lead_actor = '${leadActor}'
         WHERE movie_id = ${movieId};
    `;
  await db.run(updateMovie);
  response.send("Movie Details Updated");
});

// DELETE movie by movie_id API 5

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM movie
    WHERE movie_id = ${movieId};
    `;
  await db.run(deleteMovie);
  response.send("Movie Removed");
});

// GET director API 6

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

// GET movie name directed by specific director API 7

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieByDirector = `
        SELECT movie_name FROM movie
        WHERE director_id = ${directorId};
    `;
  const movieArrayByDirector = await db.all(getMovieByDirector);
  response.send(
    movieArrayByDirector.map((eachMovie) =>
      convertDbObjectToResponseObject(eachMovie)
    )
  );
});
module.exports = app;
