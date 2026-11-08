//npm init -y
//crear index.js
const axios = require("axios") //npm i axios
const express = require("express") //npm i express
const app = express()
const port = 3011
const path = require("path") //npm i path
const methodOverride = require("method-override") //npm i method-override

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs") //npm i ejs (SSR)
app.use(express.static(path.join(__dirname, "public")))

//Para poder leer datos (request body) en metodos POST
app.use(express.urlencoded({ extended: true }))
//Leer datos JSON en request body POST
app.use(express.json())

app.use(methodOverride("_method"))

// Cargar JSON y añadir el campo  en una variable global
let starwars = require("./starwars.json")

function inicializarFotos() {
    starwars = starwars.map(personaje => {
        const primerNombre = personaje.name.split(" ")[0]
        return {
            ...personaje,
            photo: `/images/${primerNombre}.jpg`
        }
    })
}
inicializarFotos()

// Buscador (pagina principal)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "search.html"))
})

// LISTAR / BUSCADOR (cRud)
app.get("/starwars", (req, res) => {
    const { q } = req.query

    // Si viene queryString "q", buscar coincidencia
    if (q) {
        const starwar = starwars.find(c => c.name.toLowerCase().includes(q.toLowerCase()))
        if (starwar) {
            return res.redirect(`/starwars/${encodeURIComponent(starwar.name)}`)
        } else {
            return res.render("error.ejs", { msg: "Personaje no encontrado" })
        }
    }

    // Si no hay queryString, listar todas las imagenes
    res.render("index.ejs", { starwars })
})

// MOSTRAR (cRud)
app.get("/starwars/:nombre", async (req, res) => {
    try {
        // Obtener el nombre a partir de req.params
        const { nombre } = req.params

        // Buscar dentro del array el objeto que tenga ese nombre
        const starwar = starwars.find(c => c.name.toLowerCase() === nombre.toLowerCase())

        if (starwar) {
            let planeta = null

            // Consultar homeworld en la API si existe
            if (starwar.homeworld) {
                try {
                    const respuesta = await axios.get(starwar.homeworld)
                    planeta = respuesta.data
                } catch (errApi) {
                    console.log("No se pudo cargar el planeta de la API")
                }
            }

            //3 - Renderizar show.ejs con el personaje y su planeta
            res.render("show.ejs", { starwar, planeta })
        } else {
            res.render("error.ejs", { msg: "Personaje no encontrado" })
        }
    } catch (error) {
        res.render("error.ejs", { msg: "Error al consultar los datos" })
    }
})

// FORMULARIO EDITAR
app.get("/starwars/:nombre/edit", (req, res) => {
    const { nombre } = req.params
    const starwar = starwars.find(c => c.name.toLowerCase() === nombre.toLowerCase())

    if (starwar) {
        res.render("edit.ejs", { starwar })
    } else {
        res.render("error.ejs", { msg: "Personaje no encontrado" })
    }
})

// ACTUALIZAR (crUd)
app.patch("/starwars/:nombre", (req, res) => {
    const { nombre } = req.params
    const starwar = starwars.find(c => c.name.toLowerCase() === nombre.toLowerCase())

    if (starwar) {
        const { height, mass } = req.body
        starwar.height = height
        starwar.mass = mass
        res.redirect(`/starwars/${encodeURIComponent(starwar.name)}`)
    } else {
        res.render("error.ejs", { msg: "Personaje no encontrado" })
    }
})

// DESTRUIR (cruD)
app.delete("/starwars/:nombre", (req, res) => {
    const { nombre } = req.params
    starwars = starwars.filter(c => c.name.toLowerCase() !== nombre.toLowerCase())
    res.redirect("/starwars")
})

// Rutas por defecto (404)
app.use((req, res) => {
    res.render("error.ejs", { msg: "404 - NOT FOUND" })
})

// Levantar el server
app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})