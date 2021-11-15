require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("./model/user");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json({ limit: "50mb" }));

//TÄSTÄ ALASPÄIN LISÄTTY UUTTA TIETOA

// Määritellään Varaus -schema ja siihen tietokentät
const Varaus = mongoose.model(
  "Varaukset",
  {
    tila: String,
    apartment: String,
    pvm: String,
    aloitus: String,
    lopetus: String,
    kesto: Number
  },
  "Pesutupavaraukset"
);

// LUODAAN SIVUSTOLLE REITIT JA NIIDEN OMINAISUUDET

// Tulostetaan kaikki varaukset.
app.get("/api/getall", function (req, res) {
  Varaus.find({}, function (err, results) {
    console.log("Kaikki liikunta-data on haettu!");
    res.json(results);
  });
});


// Haetaan varaajan perusteella.
app.get("/api/apartment/:text", function (req, res) {
  Varaus.find({ aparment: req.params.text }, function (err, results) {
    console.log("Asunnon \"" + req.params.text + "\" varaukset on haettu!");
    res.json(results);
  });
});

// Haetaan tilan perusteella.
app.get("/api/tila/:text", function (req, res) {
  Varaus.find({ tila: req.params.text }, function (err, results) {
    console.log("Tilan \"" + req.params.text + "\" varaukset on haettu!");
    res.json(results);
  });
});

// Haetaan päivämäärän perusteella perusteella.
app.get("/api/pvm/:text", function (req, res) {
  Varaus.find({ pvm: req.params.text }, function (err, results) {
    console.log("Varaukset \"" + req.params.text + "\"  on haettu!");
    res.json(results);
  });
});


// Haetaan Id:n perusteella
app.get("/api/:id", function (req, res) {
  Varaus.find({ _id: req.params.id }, function (err, results) {
    console.log("Varaus " + req.params.id + " on haettu");
    res.json(results);
  });
});

// Varausta muokataan id:n perusteella.
app.put("/api/update/:id", function (req, res) {
  Varaus.findByIdAndUpdate(req.params.id, req.body, { new: true },
    (err, todo) => {
      // Annetaan palaute päivityksen onnistumisesta.
      if (err) return res.status(500).send(err);
      console.log("Seuraavan Id:n tiedot on päivitetty: " + req.params.id);
      res.send("Seuraavan Id:n tiedot on päivitetty: " + req.params.id);
    })
});

// Lisätään tietoa sekä luodaan uusi olio, joka tallennetaan tietokantaan.
app.post("/api/add", function (req, res) {
  
  var newVaraukset = new Varaus({
    tila: req.body.tila,
    apartment: req.body.aparment,
    pvm: req.body.pvm,
    aloitus: req.body.aloitus,
    lopetus: req.body.lopetus,
    kesto: req.body.kesto
  });

  // Tallennetaan olio tietokantaan, sekä annetaan palaute siitä.
  newVaraukset.save(function (err, result) {
    if (err) console.log(err);
    console.log("Seuraava varaus on lisätty onnistuneesti \"" + req.body.pvm + "\"");
    res.send("Seuraava varaus on lisätty onnistuneesti \"" + req.body.pvm + "\"");
  });
});

// Poistetaan Mognoosen "hieno" oletusasetus pois käytöstä.
mongoose.set('useFindAndModify', false);


// Poistetaan varaus id:n perusteella.
app.delete("/api/delete:id", function (req, res) {
 
  var id = req.params.id;
  Varaus.findByIdAndDelete(id, function (err, results) {
    if (err) {
      console.log(err);
      res.json("EI POISTETTAVAA", 200);
    } else if (results == null) {
      res.json("TAPAHTUI VIRHE", 500);
    } else {
      console.log("Seuraavan tapahtuman poisto onnistui " + id);
      res.json("Seuraavan tapahtuman poisto onnistui " + id);
    }
  });
});
//TÄSTÄ YLÖSPÄIN LISÄTTY UUTTA TIETOA

app.post("/register", async (req, res) => {
  try {
    // Hae käyttäjän syöte
    const { apartment, first_name, last_name, email, password } = req.body;

   // Vahvista käyttäjän syöte
    if (!(email && password && first_name && last_name && apartment)) {
      res.status(400).send("All input is required");
    }

    // Tarkista, onko käyttäjä jo olemassa
    // Tarkista, onko käyttäjä tietokannassamme
    const oldUser = await User.findOne({ email });

    if (oldUser) {
      return res.status(409).send("User Already Exist. Please Login");
    }

       //Salaa käyttäjän salasana
    encryptedPassword = await bcrypt.hash(password, 10);

// Luo käyttäjä tietokantaan
    const user = await User.create({
      apartment,
      first_name,
      last_name,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

  // Luo tunnus(TOKEN)
    const token = jwt.sign(
      { user_id: user._id, email },
      process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
// tallenna käyttäjätunnus(TOKEN)
    user.token = token;

    app.get("/api/alluser", function (req, res) {
  users.find({}, function (err, results) {
    console.log("Kaikki user data on haettu!");
    res.json(results);
  });
});
    
// palauta uusi käyttäjä
    res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  try {
// Hae käyttäjän syöte
    const { email, password } = req.body;

    // Vahvista käyttäjän syöte
    if (!(email && password)) {
      res.status(400).send("All input is required");
    }
  // Tarkista, onko käyttäjä tietokannassamme
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Luo tunnus(TOKEN)
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

// tallenna käyttäjätunnus(TOKEN)
      user.token = token;

        // käyttäjä
      res.status(200).json(user);
    }
    res.status(400).send("Invalid Credentials");
  } catch (err) {
    console.log(err);
  }
});

app.get("/welcome", auth, (req, res) => {
  res.status(200).send("Welcome 🙌 ");
});

// This should be the last route else any after it won't work
app.use("*", (req, res) => {
  res.status(404).json({
    success: "false",
    message: "Page not found",
    error: {
      statusCode: 404,
      message: "You reached a route that is not defined on this server",
    },
  });
});

module.exports = app;
