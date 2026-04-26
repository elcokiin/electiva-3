// Routes.js - Módulo de rutas
var express = require("express");
var router = express.Router();

let mensajeIdCounter = 1;

const mensajes = [
  {
    _id: "0",
    user: "spiderman",
    mensaje: "Hola Mundo",
  },
];

// Get mensajes
router.get("/", function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json(mensajes);
});

// Post mensaje
router.post("/", function (req, res) {
  const { mensaje, user } = req.body;

  if (!user || !mensaje) {
    return res
      .status(400)
      .json({ ok: false, error: "Usuario o mensaje invalidos" });
  } else {
    const mensajeee = {
      _id: mensajeIdCounter.toString(),
      mensaje: req.body.mensaje,
      user: req.body.user,
    };

    mensajeIdCounter++;

    mensajes.push(mensajeee);

    console.log(mensajeee);
  }

  res.json({
    ok: true,
    mensaje: mensajeee,
  });
});

// Delete mensaje
router.delete("/:id", function (req, res) {
  const { id } = req.params;
  const index = mensajes.findIndex((m) => m._id === id);

  if (index === -1) {
    return res.status(404).json({ ok: false, error: "Mensaje no encontrado" });
  }

  const [mensaje] = mensajes.splice(index, 1);

  res.json({
    ok: true,
    mensaje,
  });
});

module.exports = router;
